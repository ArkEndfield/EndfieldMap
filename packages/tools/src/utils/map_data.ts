import { DEFAULT_MAP_CENTERS, MapIndex } from '@endfieldmap/tools/const';
import type { Coordinate } from 'ol/coordinate';

/**
 * 获取地图中心点
 * @param mapId 地图索引，默认值为 'map01'
 * @returns 地图中心点
 */
export const getMapCenter = (mapId?: MapIndex | null): Coordinate => {
  if (!mapId || !(mapId in DEFAULT_MAP_CENTERS)) {
    return xyz2crd(DEFAULT_MAP_CENTERS[MapIndex.MAP01], MapIndex.MAP01);
  }
  return xyz2crd(DEFAULT_MAP_CENTERS[mapId], mapId);
};

/**
 * 将XYZ坐标转换为OL坐标
 * @param pos xyz坐标
 * @param mapIndex 地图索引
 * @returns  OL坐标
 */
export const xyz2crd = (pos: { x: number; y: number; z: number }, mapIndex: MapIndex) => {
  if (mapIndex === MapIndex.MAP02) {
    return [pos.x / 16 + 104, pos.z / 16 + 232];
  } else if (mapIndex === MapIndex.MAP01) {
    return [pos.x / 8 + 128, pos.z / 8 + 144];
  } else {
    return [pos.x / 8 + 64, pos.z / 8 + 176];
  }
};

/**
 * 将OL坐标转换为XYZ坐标
 * @param coordinate OL坐标
 * @param mapIndex 地图索引
 * @returns xyz坐标
 */
export const crd2xyz = (coordinate: Coordinate, mapIndex: MapIndex) => {
  let x, z, times;
  if (mapIndex === MapIndex.MAP01) {
    x = coordinate[0] - 128;
    z = coordinate[1] - 144;
    times = 8;
  } else if (mapIndex === MapIndex.MAP02) {
    x = coordinate[0] - 104;
    z = coordinate[1] - 232;
    times = 16;
  } else {
    x = coordinate[0] - 64;
    z = coordinate[1] - 176;
    times = 8;
  }
  return {
    x: x * times,
    y: 0,
    z: z * times,
  };
};

export const calculateDistance = (coordinate1: Coordinate, coordinate2: Coordinate) => {
  const x1 = coordinate1[0];
  const y1 = coordinate1[1];
  const x2 = coordinate2[0];
  const y2 = coordinate2[1];
  return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
};

export const calculateXYZDistance = (
  xyz1: { x: number; y: number; z: number },
  xyz2: { x: number; y: number; z: number }
) => {
  return Math.sqrt(Math.pow(xyz1.x - xyz2.x, 2) + Math.pow(xyz1.z - xyz2.z, 2));
};
