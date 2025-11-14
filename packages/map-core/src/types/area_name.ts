import type { KeyValueObject } from '@endfieldmap/map-core/types/base';
import type { Position } from '@endfieldmap/map-core/types/position';

/** 通用区域名称 */
interface CommonAreaName {
  /** 优先级 */
  priority: 'Override' | 'Base';
  /** 保存ID */
  saveId: number;
  /** 地图 */
  map: string;
  /** 主标题 */
  mainTitle: KeyValueObject<string, string>;
  /** 副标题 */
  subTitle: KeyValueObject<string, string> & {
    /** 位置 */
    position: Position;
  };
}

/** 覆盖优先级区域名称 */
export interface OverridePriorityAreaName extends CommonAreaName {
  /** 优先级 */
  priority: 'Override';
  /** 深度文本 */
  depthText: KeyValueObject<string, string>;
}

/** 基础优先级区域名称 */
export interface BasePriorityAreaName extends CommonAreaName {
  /** 优先级 */
  priority: 'Base';
  /** 深度文本 */
  depthText: {
    key: 'string';
  };
}

export type UnionAreaName = OverridePriorityAreaName[] | BasePriorityAreaName[];

/** 区域名称数据 */
export interface AreaNameData {
  /** 覆盖优先级区域名称 */
  override: OverridePriorityAreaName[];
  /** 基础优先级区域名称 */
  base: BasePriorityAreaName[];
}
