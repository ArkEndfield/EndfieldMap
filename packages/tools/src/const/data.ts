/**
 * 地图索引
 * TODO: 自动化
 */
export const enum MapIndex {
  MAP01 = 'map01',
  MAP02 = 'map02',
  DUNG01 = 'dung01'
}

/**
 * 默认地图中心点
 * TODO: 自动化
 */
export const DEFAULT_MAP_CENTERS: Record<MapIndex, { x: number; y: number; z: number }> = {
  // [MapIndex.MAP01]: [100, 152],
  // [MapIndex.MAP02]: [16, 185],
  [MapIndex.MAP01]: { x: -224, y: 0, z: -64 },
  [MapIndex.MAP02]: { x: -1408, y: 0, z: -752 },
  [MapIndex.DUNG01]: { x: -80, y: 0, z: -80 },
};
