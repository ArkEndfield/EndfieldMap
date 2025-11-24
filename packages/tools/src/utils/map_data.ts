import { DEFAULT_MAP_CENTERS, MapIndex } from '@endfieldmap/tools/const';
import type { Coordinate } from 'ol/coordinate';

/**
 * 获取地图中心点
 * @param mapId 地图索引，默认值为 'map01'
 * @returns 地图中心点
 */
export const getMapCenter = (mapId?: MapIndex | null): Coordinate => {
  if (!mapId || !(mapId in DEFAULT_MAP_CENTERS)) {
    return DEFAULT_MAP_CENTERS[MapIndex.MAP01];
  }
  return DEFAULT_MAP_CENTERS[mapId];
};

/**
 * 将XYZ坐标转换为OL坐标
 * @param pos xyz坐标
 * @param mapIndex 地图索引
 * @returns  OL坐标
 */
export const xyz2crd = (pos: { x: number; y: number; z: number }, mapIndex: MapIndex) => {
  const coords = mapIndex === MapIndex.MAP02 ? [pos.x / 8 + 80, pos.z / 8 + 224] : [pos.x / 8 + 128, pos.z / 8 + 160];

  return coords;
};

/**
 * 将OL坐标转换为XYZ坐标
 * @param coordinate OL坐标
 * @param mapIndex 地图索引
 * @returns xyz坐标
 */
export const crd2xyz = (coordinate: Coordinate, mapIndex: MapIndex) => {
  const x = mapIndex === MapIndex.MAP02 ? coordinate[0] - 80 : coordinate[0] - 128;
  const z = mapIndex === MapIndex.MAP02 ? coordinate[1] - 224 : coordinate[1] - 160;
  return {
    x: x * 8,
    y: 0,
    z: z * 8,
  };
};

export const calculateDistance = (coordinate1: Coordinate, coordinate2: Coordinate) => {
  const x1 = coordinate1[0];
  const y1 = coordinate1[1];
  const x2 = coordinate2[0];
  const y2 = coordinate2[1];
  return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
};

export const calculateXYZDistance = (xyz1: { x: number; y: number; z: number }, xyz2: { x: number; y: number; z: number }) => {
  return Math.sqrt(Math.pow(xyz1.x - xyz2.x, 2) + Math.pow(xyz1.z - xyz2.z, 2));
};
