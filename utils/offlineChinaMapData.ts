export type CityCoordinate = {
  name: string;
  province: string;
  coordinates: [number, number];
};

export const LOCAL_CHINA_GEOJSON_URL = '/geo/china-provinces.geojson';

export const CITY_COORDINATES: CityCoordinate[] = [
  { name: '北京市', province: '北京市', coordinates: [116.4074, 39.9042] },
  { name: '天津市', province: '天津市', coordinates: [117.2009, 39.0842] },
  { name: '上海市', province: '上海市', coordinates: [121.4737, 31.2304] },
  { name: '广州市', province: '广东省', coordinates: [113.2644, 23.1291] },
  { name: '深圳市', province: '广东省', coordinates: [114.0579, 22.5431] },
  { name: '成都市', province: '四川省', coordinates: [104.0665, 30.5728] },
  { name: '南昌市', province: '江西省', coordinates: [115.8582, 28.6829] },
  { name: '杭州市', province: '浙江省', coordinates: [120.1551, 30.2741] },
  { name: '南京市', province: '江苏省', coordinates: [118.7969, 32.0603] },
  { name: '武汉市', province: '湖北省', coordinates: [114.3055, 30.5928] },
  { name: '长沙市', province: '湖南省', coordinates: [112.9388, 28.2282] },
  { name: '重庆市', province: '重庆市', coordinates: [106.5516, 29.563] },
  { name: '西安市', province: '陕西省', coordinates: [108.9398, 34.3416] },
  { name: '青岛市', province: '山东省', coordinates: [120.3826, 36.0671] },
  { name: '郑州市', province: '河南省', coordinates: [113.6254, 34.7466] },
];
