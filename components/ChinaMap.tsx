import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { ChevronLeft } from 'lucide-react';
import { getProvinceCode, normalizeProvinceName } from '../utils/chinaRegions';

interface ChinaMapProps {
  provinces: string[];
  selectedProvinces: string[];
  onSelectionChange: (provinces: string[]) => void;
}

type GeoJsonFeature = {
  properties?: {
    name?: string;
    cp?: [number, number];
    centroid?: [number, number];
    center?: [number, number];
  };
  geometry?: {
    type?: string;
    coordinates?: unknown;
  };
};

type GeoJson = {
  features?: GeoJsonFeature[];
};

type CityMarker = {
  name: string;
  value: [number, number];
};

type MapRenderState = {
  mapName: string;
  mode: 'country' | 'province';
};

const MAP_URL_TEMPLATES = [
  'https://geo.datav.aliyun.com/areas_v3/bound/{code}_full.json',
  'https://gw.alipayobjects.com/os/alisis/geo-data-v3/{code}_full.json',
];

const MAP_CACHE = new Map<string, GeoJson>();

function buildMapUrls(code: string) {
  return MAP_URL_TEMPLATES.map((template) => template.replace('{code}', code));
}

async function fetchWithTimeout(url: string, timeout = 10000) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      cache: 'force-cache',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} - ${url}`);
    }

    return (await response.json()) as GeoJson;
  } finally {
    window.clearTimeout(timer);
  }
}

async function loadGeoJson(code: string) {
  const cachedGeoJson = MAP_CACHE.get(code);
  if (cachedGeoJson) {
    return cachedGeoJson;
  }

  let lastError: unknown = null;

  for (const url of buildMapUrls(code)) {
    try {
      const geoJson = await fetchWithTimeout(url, 10000);
      MAP_CACHE.set(code, geoJson);
      return geoJson;
    } catch (error) {
      console.warn('[ChinaMap] 地图源加载失败:', url, error);
      lastError = error;
    }
  }

  throw lastError ?? new Error('地图数据加载失败');
}

function isCoordinatePair(value: unknown): value is [number, number] {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    typeof value[0] === 'number' &&
    typeof value[1] === 'number'
  );
}

function collectGeometryPoints(coordinates: unknown, bucket: Array<[number, number]>) {
  if (isCoordinatePair(coordinates)) {
    bucket.push([coordinates[0], coordinates[1]]);
    return;
  }

  if (Array.isArray(coordinates)) {
    coordinates.forEach((item) => collectGeometryPoints(item, bucket));
  }
}

function getFeatureCenter(feature: GeoJsonFeature) {
  const presetCenter =
    feature.properties?.cp ?? feature.properties?.centroid ?? feature.properties?.center;

  if (isCoordinatePair(presetCenter)) {
    return presetCenter;
  }

  const points: Array<[number, number]> = [];
  collectGeometryPoints(feature.geometry?.coordinates, points);

  if (points.length === 0) {
    return null;
  }

  const [minLng, maxLng, minLat, maxLat] = points.reduce(
    (accumulator, [lng, lat]) => [
      Math.min(accumulator[0], lng),
      Math.max(accumulator[1], lng),
      Math.min(accumulator[2], lat),
      Math.max(accumulator[3], lat),
    ],
    [Infinity, -Infinity, Infinity, -Infinity]
  );

  return [(minLng + maxLng) / 2, (minLat + maxLat) / 2] as [number, number];
}

function extractCityMarkers(geoJson: GeoJson) {
  const cityMap = new Map<string, CityMarker>();

  (geoJson.features ?? []).forEach((feature) => {
    const cityName = feature.properties?.name?.trim();
    if (!cityName || cityMap.has(cityName)) {
      return;
    }

    const center = getFeatureCenter(feature);
    if (!center) {
      return;
    }

    cityMap.set(cityName, {
      name: cityName,
      value: center,
    });
  });

  return Array.from(cityMap.values()).sort((left, right) =>
    left.name.localeCompare(right.name, 'zh-Hans-CN')
  );
}

function getProvinceMapKey(provinceName: string) {
  const provinceCode = getProvinceCode(provinceName);
  return provinceCode ? `province-${provinceCode}` : null;
}

const ChinaMap: React.FC<ChinaMapProps> = ({
  provinces,
  selectedProvinces,
  onSelectionChange,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeProvince, setActiveProvince] = useState<string | null>(null);
  const [activeProvinceCities, setActiveProvinceCities] = useState<CityMarker[]>([]);
  const [mapRenderState, setMapRenderState] = useState<MapRenderState | null>(null);

  const provinceCountMap = useMemo(() => {
    const nextMap = new Map<string, number>();

    provinces.forEach((province) => {
      if (!province || province === '-') {
        return;
      }

      const normalizedProvince = normalizeProvinceName(province);
      nextMap.set(normalizedProvince, (nextMap.get(normalizedProvince) ?? 0) + 1);
    });

    return nextMap;
  }, [provinces]);

  const maxCount = useMemo(() => {
    let max = 1;
    provinceCountMap.forEach((count) => {
      if (count > max) {
        max = count;
      }
    });
    return max;
  }, [provinceCountMap]);

  const activeProvinceMapKey = useMemo(
    () => (activeProvince ? getProvinceMapKey(activeProvince) : null),
    [activeProvince]
  );

  useEffect(() => {
    let cancelled = false;

    const prepareMaps = async () => {
      try {
        setLoading(true);
        setError(null);

        const chinaGeoJson = await loadGeoJson('100000');
        if (cancelled) {
          return;
        }

        echarts.registerMap('china', chinaGeoJson as never);

        if (!activeProvince) {
          setActiveProvinceCities([]);
          setMapRenderState({
            mapName: 'china',
            mode: 'country',
          });
          setLoading(false);
          return;
        }

        const provinceCode = getProvinceCode(activeProvince);
        if (!provinceCode) {
          throw new Error(`未找到省份编码: ${activeProvince}`);
        }

        const provinceGeoJson = await loadGeoJson(provinceCode);
        if (cancelled) {
          return;
        }

        echarts.registerMap(`province-${provinceCode}`, provinceGeoJson as never);
        setActiveProvinceCities(extractCityMarkers(provinceGeoJson));
        setMapRenderState({
          mapName: `province-${provinceCode}`,
          mode: 'province',
        });
        setLoading(false);
      } catch (mapError) {
        console.error('[ChinaMap] ECharts Map Error:', mapError);
        if (cancelled) {
          return;
        }

        setError(
          mapError instanceof Error ? `地图加载失败: ${mapError.message}` : '地图加载失败'
        );
        setMapRenderState(null);
        setLoading(false);
      }
    };

    prepareMaps();

    return () => {
      cancelled = true;
    };
  }, [activeProvince]);

  useEffect(() => {
    if (selectedProvinces.length === 0 && activeProvince) {
      setActiveProvince(null);
    }
  }, [activeProvince, selectedProvinces]);

  useEffect(() => {
    if (!chartRef.current) {
      return;
    }

    if (!mapRenderState) {
      return;
    }

    const chart =
      chartInstanceRef.current ?? echarts.init(chartRef.current, undefined, { renderer: 'canvas' });
    chartInstanceRef.current = chart;
    let resizeFrame = 0;
    let optionFrame = 0;
    const nationalData = Array.from(provinceCountMap.entries()).map(([name, value]) => ({
      name,
      value,
      itemStyle: selectedProvinces.includes(name)
        ? {
            borderColor: '#0f172a',
            borderWidth: 2,
            shadowBlur: 14,
            shadowColor: 'rgba(29, 78, 216, 0.25)',
          }
        : undefined,
    }));

    if (mapRenderState.mode === 'country') {
      chart.off('click');
      chart.on('click', (params: { name?: string }) => {
        const clickedName = params.name?.trim();
        if (!clickedName) {
          return;
        }

        const normalizedProvince = normalizeProvinceName(clickedName);
        if (!getProvinceCode(normalizedProvince)) {
          return;
        }

        setActiveProvince(normalizedProvince);
        onSelectionChange([normalizedProvince]);
      });
    } else {
      chart.off('click');
    }

    chart.getZr().off('dblclick');
    chart.getZr().on('dblclick', () => {
      setActiveProvince(null);
      onSelectionChange([]);
    });

    optionFrame = window.requestAnimationFrame(() => {
      if (mapRenderState.mode === 'country') {
        const nationalOption: echarts.EChartsOption = {
          backgroundColor: 'transparent',
          animationDurationUpdate: 450,
          tooltip: {
            trigger: 'item',
            formatter: (params: any) => {
              const provinceName = normalizeProvinceName(params.name);
              const count = provinceCountMap.get(provinceName) ?? 0;

              return [
                provinceName,
                `<br/><span style="color:#1d4ed8">● 当前任务数: ${count}</span>`,
                '<br/><span style="color:#64748b">点击查看该省市级名称</span>',
              ].join('');
            },
            backgroundColor: 'rgba(255,255,255,0.96)',
            borderColor: '#dbeafe',
            borderWidth: 1,
            textStyle: {
              color: '#0f172a',
              fontSize: 12,
            },
            extraCssText:
              'box-shadow: 0 8px 24px rgba(15,23,42,0.12); border-radius: 12px;',
          },
          visualMap: {
            show: false,
            min: 0,
            max: maxCount,
            inRange: {
              color: ['#dbeafe', '#60a5fa', '#1d4ed8'],
            },
          },
          series: [
            {
              name: '任务覆盖省份',
              type: 'map',
              map: mapRenderState.mapName,
              roam: true,
              scaleLimit: { min: 1, max: 6 },
              layoutCenter: ['45%', '53%'],
              layoutSize: '82%',
              selectedMode: false,
              label: {
                show: false,
              },
              emphasis: {
                label: {
                  show: true,
                  color: '#0f172a',
                },
                itemStyle: {
                  areaColor: '#93c5fd',
                },
              },
              itemStyle: {
                borderColor: '#93c5fd',
                borderWidth: 0.8,
                areaColor: '#ffffff',
              },
              data: nationalData,
            },
          ],
        };

        chart.setOption(nationalOption, true);
      } else if (activeProvince && activeProvinceMapKey) {
        const provinceOption: echarts.EChartsOption = {
          backgroundColor: 'transparent',
          animationDurationUpdate: 450,
          tooltip: {
            trigger: 'item',
            formatter: (params: any) => {
              if (params.seriesType === 'scatter') {
                return `${params.name}<br/><span style="color:#1d4ed8">● 市级标记</span>`;
              }

              return `${params.name}<br/><span style="color:#64748b">双击空白区域返回全国</span>`;
            },
            backgroundColor: 'rgba(255,255,255,0.96)',
            borderColor: '#dbeafe',
            borderWidth: 1,
            textStyle: {
              color: '#0f172a',
              fontSize: 12,
            },
            extraCssText:
              'box-shadow: 0 8px 24px rgba(15,23,42,0.12); border-radius: 12px;',
          },
          geo: {
            map: mapRenderState.mapName,
            roam: true,
            scaleLimit: { min: 1, max: 8 },
            layoutCenter: ['44%', '53%'],
            layoutSize: '76%',
            itemStyle: {
              areaColor: 'transparent',
              borderColor: 'transparent',
            },
          },
          series: [
            {
              name: activeProvince,
              type: 'map',
              map: mapRenderState.mapName,
              roam: true,
              scaleLimit: { min: 1, max: 8 },
              layoutCenter: ['44%', '53%'],
              layoutSize: '76%',
              label: {
                show: false,
              },
              emphasis: {
                label: {
                  show: false,
                },
                itemStyle: {
                  areaColor: '#bfdbfe',
                },
              },
              itemStyle: {
                borderColor: '#8db7ff',
                borderWidth: 1,
                areaColor: '#eef4ff',
              },
            },
            {
              name: `${activeProvince}城市`,
              type: 'scatter',
              coordinateSystem: 'geo',
              data: activeProvinceCities,
              symbol: 'circle',
              symbolSize: 9,
              itemStyle: {
                color: '#1d4ed8',
                borderColor: '#ffffff',
                borderWidth: 1.5,
              },
              label: {
                show: true,
                position: 'right',
                formatter: '{b}',
                color: '#0f172a',
                fontSize: 10,
                backgroundColor: 'rgba(255,255,255,0.92)',
                borderRadius: 999,
                padding: [2, 6],
              },
              emphasis: {
                scale: 1.08,
              },
              zlevel: 2,
            },
          ],
        };

        chart.setOption(provinceOption, true);
      }

      resizeFrame = window.requestAnimationFrame(() => {
        chart.resize();
      });
    });

    const handleResize = () => {
      chart.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.cancelAnimationFrame(optionFrame);
      window.cancelAnimationFrame(resizeFrame);
      window.removeEventListener('resize', handleResize);
    };
  }, [
    activeProvince,
    activeProvinceCities,
    activeProvinceMapKey,
    mapRenderState,
    maxCount,
    onSelectionChange,
    provinceCountMap,
    selectedProvinces,
  ]);

  useEffect(() => {
    return () => {
      chartInstanceRef.current?.dispose();
      chartInstanceRef.current = null;
    };
  }, []);

  return (
    <div className="relative flex h-[500px] w-full items-center justify-center overflow-hidden rounded-2xl bg-[#f0f9ff]">
      {activeProvince && (
        <button
          type="button"
          onClick={() => {
            setActiveProvince(null);
            onSelectionChange([]);
          }}
          className="absolute left-4 top-4 z-20 inline-flex items-center rounded-full border border-blue-100 bg-white/95 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50"
        >
          <ChevronLeft size={14} className="mr-1" />
          返回全国
        </button>
      )}

      {loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/55 backdrop-blur-sm">
          <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-xs font-bold text-blue-600">加载地图数据...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-red-50/70 px-4 text-center">
          <p className="text-xs font-bold leading-5 text-red-500">{error}</p>
        </div>
      )}

      <div ref={chartRef} className="h-full min-h-[400px] w-full" />

      <div className="pointer-events-none absolute right-4 top-4 z-10">
        <div className="rounded-xl border border-sky-100 bg-white/90 p-3 shadow-sm backdrop-blur-md">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-[#00338d]">
              <div className="h-2.5 w-2.5 rounded-full bg-[#1d4ed8]"></div>
              <span>{activeProvince ? `${activeProvince} 城市标记` : '任务覆盖省份'}</span>
            </div>
            <div className="h-px w-full bg-sky-50"></div>
            <div className="text-[9px] font-bold text-sky-500">
              {activeProvince ? `共 ${activeProvinceCities.length} 个市级名称` : `共 ${provinceCountMap.size} 个任务省份`}
            </div>
            <div className="text-[9px] font-medium text-gray-400">
              {activeProvince ? '双击空白处返回全国视图' : '点击省份进入省内视图'}
            </div>
          </div>
        </div>
      </div>

      {activeProvince && activeProvinceCities.length > 0 && (
        <div className="absolute bottom-4 left-4 z-10 max-h-[180px] w-[260px] overflow-y-auto rounded-xl border border-blue-100 bg-white/92 p-3 shadow-sm backdrop-blur-md">
          <div className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
            {activeProvince} 市级名称
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {activeProvinceCities.map((city) => (
              <div key={city.name} className="flex items-center gap-2 text-[11px] text-gray-700">
                <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                <span className="truncate">{city.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChinaMap;
