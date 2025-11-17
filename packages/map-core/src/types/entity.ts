import type { ElectricPoleIdKey, MapIndex } from '@endfieldmap/map-core/const/map';
import type { Position } from '@endfieldmap/map-core/types/position';

/**
 * 实体数据，来自于json
 */
export interface EntityData {
  /** 逻辑ID */
  levelLogicId: number;
  /** 实体数据ID */
  entityDataIdKey: string;
  /** 模板ID */
  templateId: string;
  /** 实体类型 */
  entityType: string;
  /** 位置 */
  position: Position;
  /** 默认隐藏 */
  defaultHide?: boolean;
  /** 在完成任务后隐藏 */
  is_hide_after_mission?: string;
  /** 最大数量 */
  max_count?: number;
  /** 类型ID */
  type_id?: string;
  /** 在完成任务前隐藏 */
  is_hide_before_mission?: string;
  prts_id?: string;
  used_for_quest?: boolean;
  /** 状态 */
  state?: number;
  /** 交互选项 */
  option_interact?: number;
  /** 奖励ID */
  reward_id?: string;
}

/**
 * 电线杆数据
 */
export interface ElectricPoleData extends EntityData {
  entityDataIdKey: typeof ElectricPoleIdKey;
  entityType: '#ElectricPole';
  templateId: '#electric_pole';
  connectTo: EntityData['levelLogicId'] | null;
}

/**
 * 实体数据列表
 */
export type EntityDataList = EntityData[];

/**
 * 电线杆数据列表
 */
export type ElectricPoleDataList = ElectricPoleData[];

/**
 * 实体分类数据，来自于json
 */
export interface EntityCategoryData {
  category: string;
  data: EntityDataList;
}

/**
 * 地图等级下的实体分类数据，来自于json
 */
export interface EntityLevelData {
  map_level_id: string;
  categories: EntityCategoryData[]
}

/**
 * 地图数据，来自于json
 */
export interface EntityJsonData {
  map_id: MapIndex;
  levels: EntityLevelData[]
}

/**
 * 地图数据列表，来自于json
 */
export type EntityJsonDataList = EntityJsonData[];

/**
 * 实体数据ID键
 */
export type EntityInfoKey = EntityData['entityDataIdKey'];

/**
 * 实体信息数据
 */
export interface EntityInfoData {
  category: EntityCategoryData['category'];
  entityInfo: {
    point: EntityInfoKey;
    pic: string;
  }
}

/**
 * 实体信息数据JSON，来自于json
 */
export type EntityInfoDataJson = Record<EntityInfoKey, EntityInfoData>;

/**
 * 实体信息项数据，用于EntityLayer的数据返回
 */
export interface EntityInfoItemData<T extends EntityData | ElectricPoleData = EntityData> {
  uniqueKey: string;
  category: EntityCategoryData['category'];
  entityDataIdKey: EntityData['entityDataIdKey'];
  entityInfo: EntityInfoData['entityInfo'];
  visible: boolean;
  data: T[];
  mapIndex: MapIndex;
  count: number;
  markedCount: number;
  selectedCount: number;
  activeCount: number;
}

export type ElectricPoleMapData = Record<MapIndex, ElectricPoleDataList>;
