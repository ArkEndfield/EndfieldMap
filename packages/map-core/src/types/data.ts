import type { CustomPointMapData, ElectricPoleMapData } from '@endfieldmap/map-core/types/entity';
import type { EntityData } from '@endfieldmap/map-core/types/entity';

import type { MapData } from '@endfieldmap/map-core/types/map';

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
export type StorageData<T> = Partial<Record<MapData['id'], T>>;

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
  /** entity可见性 */
  entityVisibility?: StorageData<EntityVisibility>;
  /** 电线杆数据 */
  electricPoleData?: ElectricPoleMapData;
  /** 自定义标点数据 */
  customPointData?: CustomPointMapData;
}
