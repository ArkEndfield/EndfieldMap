/**
 * 地图索引
 * TODO: 自动化
 */
export const enum MapIndex {
  MAP01 = 'map01',
  MAP02 = 'map02',
}

/**
 * 默认地图中心点
 * TODO: 自动化
 */
export const DEFAULT_MAP_CENTERS: Record<MapIndex, { x: number; y: number; z: number }> = {
  // [MapIndex.MAP01]: [100, 152],
  // [MapIndex.MAP02]: [50, 188],
  [MapIndex.MAP01]: { x: -224, y: 0, z: -64 },
  [MapIndex.MAP02]: { x: -240, y: 0, z: -288 },
};
