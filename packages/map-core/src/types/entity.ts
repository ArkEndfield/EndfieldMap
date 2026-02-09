import type { ElectricPoleDeviceKey } from '@endfieldmap/map-core/const/electric_pole';
import type { CustomPointKey, ElectricPoleIdKey, ElectricPoleKey, NoteKey } from '@endfieldmap/map-core/const/map';
import type { MapDataManager } from '@endfieldmap/map-core/data/map/map';
import type { MapData } from '@endfieldmap/map-core/types/map';
import type { Position } from '@endfieldmap/map-core/types/position';

/**
 * 自定义标点类型ID
 */
export type CustomPointTypeId =
  | 'custom_point_1'
  | 'custom_point_2'
  | 'custom_point_3'
  | 'custom_point_4'
  | 'custom_point_5'
  | 'custom_point_6'
  | 'custom_point_7';

/**
 * 基础实体数据接口（用于泛型约束）
 */
export interface BaseEntityData {
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
  /** 属性 */
  properties: Record<string, unknown>;
}

export interface BaseEntityDataWithInfo extends BaseEntityData {
  /** Entity信息 */
  entityInfo?: EntityInfoData;
}

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
  system_inst_key?: string;
  /** 允许任意其他属性 */
  [key: string]: unknown;
}

/**
 * 实体数据
 */
export interface EntityData extends BaseEntityDataWithInfo {
  /** 属性 */
  properties: EnityProperties;
  /** 进度锁定条件？ */
  progressLockCondition: object;
  /** 组件 */
  componentProperties: Record<string, unknown>;
}

/**
 * 电线杆数据
 */
export interface ElectricPoleData extends BaseEntityDataWithInfo {
  entityDataIdKey: typeof ElectricPoleIdKey;
  entityType: '#ElectricPole';
  templateId: typeof ElectricPoleKey;
  properties: EnityProperties & {
    /** 电线杆子类型 key（电线杆 / 中继器 / 滑索等） */
    deviceKey?: ElectricPoleDeviceKey;
    /**
     * 发出的连线（目标对象 ID 列表）
     * - 用于根据“谁发出”来计算距离限制
     */
    connections?: Array<EntityData['levelLogicId']>;
    name?: string;
  };
}

/**
 * 自定义标点数据
 */
export interface CustomPointData extends BaseEntityDataWithInfo {
  entityDataIdKey: CustomPointTypeId;
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
  | 'trchest'
  | 'dnarrative'
  | 'dungeon'
  | 'enemy'
  | 'ether'
  | 'mineral'
  | 'narrative'
  | 'plant'
  | 'settlement'
  | 'spcstone'
  | 'system'
  | 'special'
  | typeof ElectricPoleKey
  | typeof CustomPointKey
  | typeof NoteKey;

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
  map_id: MapData['id'];
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
  category: Category;
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
 * T 泛型支持 EntityData、ElectricPoleData、CustomPointData
 */
export interface EntityInfoItemData<T extends BaseEntityData = EntityData> {
  uniqueKey: string;
  category: Category;
  entityDataIdKey: T['entityDataIdKey'];
  entityInfo: EntityInfoData<T['entityDataIdKey']>['entityInfo'];
  visible: boolean;
  data: T[];
  mapId: MapData['id'];
  count: number;
  markedCount: number;
  selectedCount: number;
}

/**
 * Entity数据实例配置
 */
export interface EntityDataInstanceConfig {
  data: EntityData;
  mapId: MapData['id'];
  mapDataManager: MapDataManager;
}

/**
 * 自定义标点数据实例配置
 */
export interface CustomPointDataInstanceConfig {
  data: CustomPointData;
  mapId: MapData['id'];
  mapDataManager: MapDataManager;
}

/**
 * 电线杆数据实例配置
 */
export interface ElectricPoleDataInstanceConfig {
  data: ElectricPoleData;
  mapId: MapData['id'];
  mapDataManager: MapDataManager;
}

/**
 * Entity数据管理器配置（新架构）
 */
export interface EntityDataManagerConfig {
  mapId: MapData['id'];
  entityInfo: EntityInfoData;
  mapDataManager: MapDataManager;
}

/**
 * 自定义标点数据管理器配置
 */
export interface CustomPointDataManagerConfig {
  mapId: MapData['id'];
  initialData?: CustomPointData[];
  mapDataManager: MapDataManager;
}

/**
 * 电线杆数据管理器配置
 */
export interface ElectricPoleDataManagerConfig {
  mapId: MapData['id'];
  initialData?: ElectricPoleData[];
  mapDataManager: MapDataManager;
}

/**
 * Entity组数据管理器配置
 * 管理同一entityDataIdKey的所有entity
 */
export interface EntityGroupManagerConfig {
  mapId: MapData['id'];
  entityDataIdKey: string;
  entityInfo: EntityInfoData;
  category: Category;
  initialData?: EntityData[];
  mapDataManager: MapDataManager;
}

/**
 * Entity信息统计（新架构）
 */
export interface EntityInfoStats {
  uniqueKey: string;
  category: Category;
  entityDataIdKey: string;
  entityInfo: EntityInfoData['entityInfo'];
  visible: boolean;
  count: number;
  markedCount?: number;
  selectedCount?: number;
  mapId?: MapData['id'];
}

/**
 * 自定义标点地图数据类型
 */
export type CustomPointMapData = Partial<Record<MapData['id'], CustomPointData[]>>;

/**
 * 电线杆地图数据类型
 */
export type ElectricPoleMapData = Partial<Record<MapData['id'], ElectricPoleData[]>>;

/**
 * 带 mapId 的电线杆节点数据（用于数据库格式）
 */
export interface ElectricPoleNodeData extends Omit<ElectricPoleData, 'entityDataIdKey' | 'templateId' | 'entityType'> {
  entityDataIdKey: string;
  entityType: string;
  templateId: string;
  mapId: MapData['id'];
}

/**
 * 带 mapId 的自定义标点节点数据（用于数据库格式）
 */
export interface CustomPointNodeData extends Omit<CustomPointData, 'entityDataIdKey' | 'templateId' | 'entityType'> {
  entityDataIdKey: string;
  entityType: string;
  templateId: string;
  mapId: MapData['id'];
}

/**
 * 自定义标点类型配置
 */
export interface CustomPointTypeConfig {
  id: CustomPointTypeId;
  icon: string;
}
