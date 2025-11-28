import type { ElectricPoleIdKey, CustomPointKey, MapIndex, ElectricPoleKey } from '@endfieldmap/map-core/const/map';
import type { Position } from '@endfieldmap/map-core/types/position';
import type { customPointTypeMap } from '../data/custom_point';

export interface EnityProperties {
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
  /** 副本奖励ID */
  dungeion_series_id?: string;
}

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
  /** 属性 */
  properties: EnityProperties;
}

/**
 * 电线杆数据
 */
export interface ElectricPoleData extends EntityData {
  entityDataIdKey: typeof ElectricPoleIdKey;
  entityType: '#ElectricPole';
  templateId: typeof ElectricPoleIdKey;
  properties: EnityProperties & {
    connectTo: EntityData['levelLogicId'] | null;
    name?: string;
  };
}

/**
 * 自定义标点ID
 */
export type CustomPointIdKey = keyof typeof customPointTypeMap;

/**
 * 自定义标点数据
 */
export interface CustomPointData extends EntityData {
  entityDataIdKey: CustomPointIdKey;
  entityType: '#CustomPoint';
  templateId: typeof CustomPointKey;
  properties: EnityProperties & {
    name?: string;
  };
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
 * 自定义标点数据列表
 */
export type CustomPointDataList = CustomPointData[];

// TODO: 希望做成自动化
export type Category =
  | 'chest'
  | 'dnarrative'
  | 'dungeon'
  | 'enemy'
  | 'ether'
  | 'mineral'
  | 'narrative'
  | 'plant'
  | 'settlement'
  | 'spcstone'
  | 'special';

/**
 * 实体分类数据，来自于json
 */
export interface EntityCategoryData {
  category: Category;
  data: EntityDataList;
}

/**
 * 地图等级下的实体分类数据，来自于json
 */
export interface EntityLevelData {
  map_level_id: string;
  categories: EntityCategoryData[];
}

/**
 * 地图数据，来自于json
 */
export interface EntityJsonData {
  map_id: MapIndex;
  levels: EntityLevelData[];
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
export interface EntityInfoData<T extends EntityInfoKey = EntityInfoKey> {
  category: EntityCategoryData['category'] | typeof ElectricPoleKey | typeof CustomPointKey;
  entityInfo: {
    point: T;
    pic: string;
  };
}

/**
 * 实体信息数据JSON，来自于json
 */
export type EntityInfoDataJson = Record<EntityInfoKey, EntityInfoData>;

/**
 * 实体信息项数据，用于EntityLayer的数据返回
 */
export interface EntityInfoItemData<T extends EntityData | ElectricPoleData | CustomPointData = EntityData> {
  uniqueKey: string;
  category: EntityCategoryData['category'] | typeof ElectricPoleKey | typeof CustomPointKey;
  entityDataIdKey: T['entityDataIdKey'];
  entityInfo: EntityInfoData<T['entityDataIdKey']>['entityInfo'];
  visible: boolean;
  data: T[];
  mapIndex: MapIndex;
  count: number;
  markedCount: number;
  selectedCount: number;
}

export type ElectricPoleMapData = Record<MapIndex, ElectricPoleDataList>;

export type CustomPointMapData = Record<MapIndex, CustomPointDataList>;
