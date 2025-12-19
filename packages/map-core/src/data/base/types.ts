import type { MapIndex } from '@endfieldmap/map-core/const/map';
import type { EntityData } from '@endfieldmap/map-core/types/entity';

/**
 * 数据实例状态接口
 * 定义所有数据实例的通用状态
 */
export interface DataInstanceState {
  /** 是否被标记 */
  marked: boolean;
  /** 是否被选中 */
  selected: boolean;
  /** 是否激活 */
  active: boolean;
  /** 是否可见 */
  visible: boolean;
}

/**
 * 数据实例配置接口
 */
export interface DataInstanceConfig<T extends EntityData> {
  /** 原始数据 */
  data: T;
  /** 地图索引 */
  mapIndex: MapIndex;
}

/**
 * 数据管理器配置接口
 */
export interface DataManagerConfig {
  /** 地图索引 */
  mapIndex: MapIndex;
}

/**
 * 数据状态变化事件详情
 */
export interface DataStateChangeDetail<T extends EntityData = EntityData> {
  /** 数据实例ID */
  id: number;
  /** 变化的属性名 */
  property: keyof DataInstanceState;
  /** 旧值 */
  oldValue: boolean;
  /** 新值 */
  newValue: boolean;
  /** 原始数据 */
  data: T;
}
