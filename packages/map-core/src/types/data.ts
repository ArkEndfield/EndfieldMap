import type { EntityData } from '@endfieldmap/map-core/types/entity';
import type { MapIndex } from '@endfieldmap/map-core/const/map';

/**
 * entity 是否显示
 */
export type EntityVisibility = Record<EntityData['entityDataIdKey'], boolean>;

/**
 * 标点是否被标记
 */
export type FeatureMarked = Record<EntityData['levelLogicId'], boolean>;

/**
 * 存储的数据类型
 */
export type StorageData<T> = Partial<Record<MapIndex, T>>;

/**
 * 导出的数据结构
 */
export interface ExportedData {
  /** 数据版本 */
  version: string;
  /** 导出时间戳 */
  timestamp: number;
  /** feature 的marked情况 */
  markedFeatures: StorageData<FeatureMarked>;
}
