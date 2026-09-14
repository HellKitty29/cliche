import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ChevronLeft } from 'lucide-react';
import {
  CITY_COORDINATES,
  CityCoordinate,
  LOCAL_CHINA_GEOJSON_URL,
} from '../utils/offlineChinaMapData';
import { normalizeProvinceName } from '../utils/chinaRegions';

interface ChinaMapProps {
  provinces: string[];
  cityValues?: Array<{ province: string; city: string }>;
  selectedProvinces: string[];
  selectedCities?: string[];
  onSelectionChange: (provinces: string[]) => void;
  onCitySelectionChange?: (cities: string[]) => void;
}

type CityStats = CityCoordinate & {
  count: number;
};

type ProvinceProperties = {
  name?: string;
  center?: [number, number];
  centroid?: [number, number];
  cp?: [number, number];
};

type ProvinceFeature = Feature<Geometry, ProvinceProperties>;
type ProvinceFeatureCollection = FeatureCollection<Geometry, ProvinceProperties>;

const CHINA_BOUNDS = L.latLngBounds([17.5, 72], [54.5, 136]);
const DEFAULT_CENTER: [number, number] = [35.8, 104.5];

function normalizeCityName(value: string) {
  return value.trim();
}

function getProvinceFeatureName(feature: ProvinceFeature) {
  return normalizeProvinceName(feature.properties?.name ?? '');
}

function getFeatureCenter(feature: ProvinceFeature) {
  return feature.properties?.center ?? feature.properties?.centroid ?? feature.properties?.cp ?? null;
}

function buildProvinceStyle(
  feature: ProvinceFeature,
  provinceCounts: Map<string, number>,
  selectedProvinces: string[],
  maxCount: number
): L.PathOptions {
  const provinceName = getProvinceFeatureName(feature);
  const count = provinceCounts.get(provinceName) ?? 0;
  const intensity = count === 0 ? 0 : count / maxCount;
  const isSelected = selectedProvinces.includes(provinceName);

  return {
    color: isSelected ? '#0f172a' : '#93c5fd',
    weight: isSelected ? 2.2 : 1,
    opacity: 1,
    fillColor:
      count === 0 ? '#ffffff' : intensity > 0.66 ? '#2563eb' : intensity > 0.33 ? '#60a5fa' : '#dbeafe',
    fillOpacity: isSelected ? 0.78 : count === 0 ? 0.68 : 0.82,
  };
}

const ChinaMap: React.FC<ChinaMapProps> = ({
  provinces,
  cityValues = [],
  selectedProvinces,
  selectedCities = [],
  onSelectionChange,
  onCitySelectionChange,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const provinceLayerRef = useRef<L.GeoJSON | null>(null);
  const cityLayerRef = useRef<L.LayerGroup | null>(null);
  const [chinaGeoJson, setChinaGeoJson] = useState<ProvinceFeatureCollection | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  const provinceCounts = useMemo(() => {
    const counts = new Map<string, number>();

    provinces.forEach((province) => {
      if (!province || province === '-') return;
      const normalizedProvince = normalizeProvinceName(province);
      counts.set(normalizedProvince, (counts.get(normalizedProvince) ?? 0) + 1);
    });

    return counts;
  }, [provinces]);

  const maxCount = useMemo(() => {
    let max = 1;
    provinceCounts.forEach((count) => {
      max = Math.max(max, count);
    });
    return max;
  }, [provinceCounts]);

  const cityStats = useMemo(() => {
    const counts = new Map<string, number>();

    cityValues.forEach(({ province, city }) => {
      if (!city || city === '-') return;
      const normalizedProvince = normalizeProvinceName(province || city);
      const normalizedCity = normalizeCityName(city);
      const key = `${normalizedProvince}|${normalizedCity}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });

    return CITY_COORDINATES.map((city) => {
      const province = normalizeProvinceName(city.province);
      return {
        ...city,
        province,
        count: counts.get(`${province}|${city.name}`) ?? 0,
      };
    }).filter((city) => city.count > 0 || provinceCounts.has(city.province));
  }, [cityValues, provinceCounts]);

  const activeProvinceName = selectedProvinces.length === 1 ? selectedProvinces[0] : null;
  const visibleCities = useMemo(() => {
    if (!activeProvinceName) return cityStats;
    return cityStats.filter((city) => city.province === activeProvinceName);
  }, [activeProvinceName, cityStats]);

  useEffect(() => {
    let cancelled = false;

    const loadLocalGeoJson = async () => {
      try {
        setMapError(null);
        const response = await fetch(LOCAL_CHINA_GEOJSON_URL, { cache: 'force-cache' });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const geoJson = (await response.json()) as ProvinceFeatureCollection;
        if (!cancelled) {
          setChinaGeoJson(geoJson);
        }
      } catch (error) {
        if (!cancelled) {
          setMapError(error instanceof Error ? error.message : 'local geojson load failed');
        }
      }
    };

    loadLocalGeoJson();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      attributionControl: false,
      zoomControl: false,
      center: DEFAULT_CENTER,
      zoom: 4,
      minZoom: 3,
      maxZoom: 8,
      maxBounds: CHINA_BOUNDS.pad(0.35),
      maxBoundsViscosity: 0.85,
      preferCanvas: true,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    map.fitBounds(CHINA_BOUNDS, { padding: [8, 8] });
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      provinceLayerRef.current = null;
      cityLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !chinaGeoJson) return;

    provinceLayerRef.current?.remove();

    const provinceLayer = L.geoJSON(chinaGeoJson, {
      style: (feature) =>
        buildProvinceStyle(feature as ProvinceFeature, provinceCounts, selectedProvinces, maxCount),
      onEachFeature: (feature, layer) => {
        const provinceFeature = feature as ProvinceFeature;
        const provinceName = getProvinceFeatureName(provinceFeature);
        const count = provinceCounts.get(provinceName) ?? 0;
        const isSelected = selectedProvinces.includes(provinceName);

        layer.bindTooltip(
          `<strong>${provinceName}</strong><br/>审计任务：${count}<br/>点击${isSelected ? '取消筛选' : '筛选省份'}`,
          {
            direction: 'top',
            sticky: true,
            opacity: 0.94,
          }
        );

        layer.on({
          click: () => {
            onCitySelectionChange?.([]);
            onSelectionChange(isSelected ? [] : [provinceName]);
          },
          mouseover: () => {
            (layer as L.Path).setStyle({
              weight: 2.4,
              color: '#1d4ed8',
              fillOpacity: 0.9,
            });
          },
          mouseout: () => {
            (layer as L.Path).setStyle(
              buildProvinceStyle(provinceFeature, provinceCounts, selectedProvinces, maxCount)
            );
          },
        });
      },
    }).addTo(map);

    provinceLayerRef.current = provinceLayer;
  }, [
    chinaGeoJson,
    maxCount,
    onCitySelectionChange,
    onSelectionChange,
    provinceCounts,
    selectedProvinces,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    cityLayerRef.current?.remove();
    const cityLayer = L.layerGroup().addTo(map);

    visibleCities.forEach((city: CityStats) => {
      const isSelected = selectedCities.includes(city.name);
      const marker = L.circleMarker([city.coordinates[1], city.coordinates[0]], {
        radius: isSelected ? 7 : city.count > 0 ? 5.5 : 4,
        color: '#ffffff',
        weight: 1.6,
        fillColor: isSelected ? '#0f172a' : '#1d4ed8',
        fillOpacity: city.count > 0 ? 0.92 : 0.46,
      });

      marker.bindTooltip(
        `<strong>${city.name}</strong><br/>${city.province}<br/>城市点位：${city.count || '无任务'}<br/>点击筛选城市`,
        {
          direction: 'right',
          sticky: true,
          opacity: 0.94,
        }
      );

      marker.on('click', (event) => {
        L.DomEvent.stopPropagation(event);
        const nextCities = isSelected ? [] : [city.name];
        onSelectionChange([city.province]);
        onCitySelectionChange?.(nextCities);
      });

      marker.addTo(cityLayer);
    });

    cityLayerRef.current = cityLayer;
  }, [onCitySelectionChange, onSelectionChange, selectedCities, visibleCities]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !chinaGeoJson) return;

    if (!activeProvinceName) {
      map.fitBounds(CHINA_BOUNDS, { animate: true, padding: [8, 8] });
      return;
    }

    const feature = chinaGeoJson.features.find(
      (item) => normalizeProvinceName(item.properties?.name ?? '') === activeProvinceName
    );
    const center = feature ? getFeatureCenter(feature) : null;

    if (!center) return;

    const [lng, lat] = center;
    map.setView([lat, lng], activeProvinceName.length > 4 ? 5 : 6, { animate: true });
  }, [activeProvinceName, chinaGeoJson]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-[#eef6ff]">
      {activeProvinceName && (
        <button
          type="button"
          onClick={() => {
            onSelectionChange([]);
            onCitySelectionChange?.([]);
          }}
          className="absolute left-4 top-4 z-[500] inline-flex items-center rounded-full border border-blue-100 bg-white/95 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50"
        >
          <ChevronLeft size={14} className="mr-1" />
          返回全国
        </button>
      )}

      {!chinaGeoJson && !mapError && (
        <div className="absolute inset-0 z-[600] flex items-center justify-center bg-white/60 text-xs font-bold text-blue-600 backdrop-blur-sm">
          加载本地地图数据...
        </div>
      )}

      {mapError && (
        <div className="absolute inset-0 z-[600] flex items-center justify-center bg-red-50/80 px-4 text-center text-xs font-bold text-red-500">
          本地地图数据加载失败：{mapError}
        </div>
      )}

      <div ref={mapContainerRef} className="h-full min-h-[360px] w-full" />

      <div className="pointer-events-none absolute right-4 top-4 z-[500]">
        <div className="rounded-xl border border-sky-100 bg-white/90 p-3 shadow-sm backdrop-blur-md">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-[#00338d]">
              <div className="h-2.5 w-2.5 rounded-full bg-[#1d4ed8]" />
              <span>{activeProvinceName ? `${activeProvinceName} 城市点位` : '本地省份地图'}</span>
            </div>
            <div className="h-px w-full bg-sky-50" />
            <div className="text-[9px] font-bold text-sky-500">
              {activeProvinceName
                ? `显示 ${visibleCities.length} 个城市点位`
                : `覆盖 ${provinceCounts.size} 个任务省份`}
            </div>
            <div className="text-[9px] font-medium text-gray-400">
              点击省份或城市筛选下方任务表格
            </div>
          </div>
        </div>
      </div>

      {activeProvinceName && visibleCities.length > 0 && (
        <div className="absolute bottom-4 left-4 z-[500] max-h-[180px] w-[260px] overflow-y-auto rounded-xl border border-blue-100 bg-white/92 p-3 shadow-sm backdrop-blur-md">
          <div className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
            {activeProvinceName} 城市点位
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {visibleCities.map((city) => (
              <button
                key={city.name}
                type="button"
                onClick={() => {
                  onSelectionChange([city.province]);
                  onCitySelectionChange?.(selectedCities.includes(city.name) ? [] : [city.name]);
                }}
                className={`flex min-w-0 items-center gap-2 rounded px-1.5 py-1 text-left text-[11px] transition ${
                  selectedCities.includes(city.name)
                    ? 'bg-blue-50 font-bold text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                <span className="truncate">{city.name}</span>
                <span className="ml-auto shrink-0 text-[9px] text-gray-400">{city.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChinaMap;
