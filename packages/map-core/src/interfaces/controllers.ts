import type { ElectricPoleDeviceKey } from '@endfieldmap/map-core/const/electric_pole';
import type { MarkedFeatureFilterMode } from '@endfieldmap/map-core/const/map';
import type { EntityDataInstance, EntityGroupManager, EntityMapDataManager } from '@endfieldmap/map-core/data/entity';
import type { CustomPointDataInstance } from '@endfieldmap/map-core/data/entity/custom_point';
import type { CustomPointMapDataManager } from '@endfieldmap/map-core/data/entity/custom_point/custom_point_map_data_manager';
import type { ElectricPoleDataInstance } from '@endfieldmap/map-core/data/entity/electric_pole';
import type { ElectricPoleMapDataManager } from '@endfieldmap/map-core/data/entity/electric_pole/electric_pole_map_data_manager';
import type { MapDataManager } from '@endfieldmap/map-core/data/map/map';
import type { TierDataManager } from '@endfieldmap/map-core/data/tier';
import type { IMapView } from '@endfieldmap/map-core/interfaces/map_view';
import type { MapCoordinate } from '@endfieldmap/map-core/types/coordinate';
import type {
  CustomPointData,
  CustomPointNodeData,
  CustomPointTypeId,
  ElectricPoleData,
  ElectricPoleNodeData,
  EntityData,
  EntityInfoDataJson,
  EntityInfoStats,
  EntityJsonDataList,
} from '@endfieldmap/map-core/types/entity';
import type { DataInstance } from '@endfieldmap/map-core/types/event';
import type { MapData } from '@endfieldmap/map-core/types/map';
import type { RouteRenderItem } from '@endfieldmap/map-core/types/route';
import type { GridTierItem } from '@endfieldmap/map-core/types/tier';

/**
 * 地图控制器接口
 */
export interface IMapController {
  readonly dataManager: MapDataManager;
  readonly view?: IMapView;

  setCenter(center: MapCoordinate): void;
  getCenter(): MapCoordinate | undefined;
  moveViewCenter(center: MapCoordinate, zoom?: number): void;
  setZoom(zoom: number): void;
  setAdjustView?(adjust: boolean): void;
  renderMap(id: string): void;
  dispose(): void;
}

/**
 * 实体控制器接口
 */
export interface IEntityController {
  readonly dataManager: EntityMapDataManager;

  get currentStats(): EntityInfoStats[];
  getMapGroupManagerList(mapId: MapData['id']): EntityGroupManager[];
  getInstanceById(mapId: MapData['id'], id: number): EntityDataInstance | undefined;
  getMapLevelIds(mapId: MapData['id']): string[];
  getSelectedLevelIds(mapId: MapData['id']): string[];
  setSelectedLevels(mapId: MapData['id'], levelIds: string[]): void;
  setLevelSelected(mapId: MapData['id'], levelId: string, selected: boolean): void;
  resetSelectedLevels(mapId: MapData['id']): void;
  loadData(jsonData: EntityJsonDataList, infoData: EntityInfoDataJson): void;
  setClusterEnable(enable: boolean): void;
  setMarked(mapId: MapData['id'], levelLogicId: EntityData['levelLogicId'], marked: boolean): void;
  setEntityVisibility(mapId: MapData['id'], levelLogicId: EntityData['levelLogicId'], visible: boolean): void;
  setAllEntityVisible(visible: boolean): void;
  setGroupVisibility(mapId: MapData['id'], entityKey: EntityData['entityDataIdKey'], visible: boolean): void;
  setMarkedFilterMode(mode: MarkedFeatureFilterMode): void;
  setSelected(mapId: MapData['id'], levelLogicId: EntityData['levelLogicId'], selected: boolean): void;
  batchSetSelected(
    items: Array<{ mapId: MapData['id']; levelLogicId: EntityData['levelLogicId']; selected: boolean }>
  ): void;
  setActive(mapId: MapData['id'], levelLogicId: EntityData['levelLogicId'], active: boolean): void;
  importVisibility(
    data: Array<{ entityKey: EntityData['entityDataIdKey']; mapId: MapData['id']; visible: boolean }>
  ): Promise<number>;
  importMarked(
    data: Array<{ entityId: EntityData['levelLogicId']; mapId: MapData['id']; marked: boolean }>
  ): Promise<number>;
}

/**
 * 电线杆控制器接口
 */
export interface IElectricPoleController {
  readonly dataManager: ElectricPoleMapDataManager;

  loadElectricPoleData(data: ElectricPoleNodeData[]): void;
  createElectricPoleData(
    mapId: MapData['id'],
    position: MapCoordinate,
    deviceKey?: ElectricPoleDeviceKey
  ): ElectricPoleData;
  addElectricPoleData(mapId: MapData['id'], data: ElectricPoleData): ElectricPoleDataInstance;
  connectElectricPoles(mapId: MapData['id'], fromId: number, toId: number): void;
  disconnectElectricPoles(mapId: MapData['id'], fromId: number, toId: number): void;
  deleteElectricPole(mapId: MapData['id'], id: number): boolean;
  updateElectricPolePosition(mapId: MapData['id'], instanceId: number, newCoordinate: MapCoordinate): void;
  setZoneVisible(visible: boolean): void;
  setVisible(visible: boolean): void;
  setDeviceVisible(deviceKey: ElectricPoleDeviceKey, visible: boolean): void;
  setMapDeviceVisible(mapId: MapData['id'], deviceKey: ElectricPoleDeviceKey, visible: boolean): void;
  getDeviceVisible(deviceKey: ElectricPoleDeviceKey): boolean;
  importVisibility(data: Array<{ mapId: MapData['id']; entityKey: string; visible: boolean }>): void;
}

/**
 * 自定义标点控制器接口
 */
export interface ICustomPointController {
  readonly dataManager: CustomPointMapDataManager;

  loadCustomPointData(data: CustomPointNodeData[]): void;
  createCustomPointData(mapId: MapData['id'], position: MapCoordinate, type: CustomPointTypeId): CustomPointData;
  addCustomPointData(mapId: MapData['id'], data: CustomPointData): CustomPointDataInstance;
  deleteCustomPoint(mapId: MapData['id'], id: number): boolean;
  setCustomPointVisible(visible: boolean): void;
  setTypeVisible(typeId: string, visible: boolean): void;
  getTypeVisible(typeId: string): boolean;
  setMapTypeVisible(mapId: MapData['id'], typeId: string, visible: boolean): void;
  importVisibility(data: Array<{ mapId: MapData['id']; entityKey: string; visible: boolean }>): void;
}

/**
 * 地图路线控制器接口。
 *
 * 路线是用户在地图上按顺序串起来的折线（可多段，每段一张地图），与标点/电线杆
 * 无关，因此独立于实体系统：控制器只负责把路线渲染数据交给渲染器，不参与
 * 实体搜索、hover、active feature 等。
 */
export interface IRouteController {
  /** 全量替换当前路线集合（按地图分组渲染）。 */
  setRoutes(routes: RouteRenderItem[]): void;
  /** 整体可见性。 */
  setVisible(visible: boolean): void;
  getVisible(): boolean;
  dispose(): void;
}

/**
 * 分级控制器接口
 */
export interface ITierController {
  readonly tierDataManager: TierDataManager;

  addTier(mapId: MapData['id'], data: GridTierItem): void;
  renderTier(mapId: MapData['id'], center: MapCoordinate, id: string, subId?: string): Promise<void>;
  toggleTier(mapId: MapData['id'], center: MapCoordinate, id: string, subId?: string): Promise<void>;
  clearTier(): void;
  dispose(): void;
}

/**
 * 激活特征控制器接口
 */
export interface IActiveFeatureController {
  activeFeature: DataInstance | null;

  setActiveFeature(feature: DataInstance | null): void;
  clearActiveFeature(): void;
  setEnable(enable: boolean): void;
  dispose(): void;
}

/**
 * Hover 特征控制器接口
 */
export interface IHoverFeatureController {
  hoverFeature: DataInstance | null;

  clearHoverFeature(): void;
  setEnable(enable: boolean): void;
  setDebounceTime(time: number): void;
  dispose(): void;
}

/**
 * Hover 连接控制器接口
 */
export interface IHoverConnectionController {
  clearHoverConnection(): void;
  setEnable(enable: boolean): void;
  setDebounceTime(time: number): void;
  dispose(): void;
}
