import type { ViewState } from '@endfieldmap/tools/const/typing';

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
export const DEFAULT_MAP_CENTERS: Record<MapIndex, ViewState> = {
  [MapIndex.MAP01]: [100, 152],
  [MapIndex.MAP02]: [50, 188],
};
