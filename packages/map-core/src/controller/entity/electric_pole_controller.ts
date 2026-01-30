import { Disposer } from '@endfieldmap/map-core/commom/disposer';
import {
  DEFAULT_ELECTRIC_POLE_DEVICE_KEY,
  type ElectricPoleDeviceKey,
  getElectricPoleDeviceConfig,
} from '@endfieldmap/map-core/const/electric_pole';
import { ElectricPoleIdKey, ElectricPoleKey } from '@endfieldmap/map-core/const/map';
import type { ElectricPoleDataInstance } from '@endfieldmap/map-core/data/entity/electric_pole';
import { ElectricPoleMapDataManager } from '@endfieldmap/map-core/data/entity/electric_pole/electric_pole_map_data_manager';
import { MapDataManager } from '@endfieldmap/map-core/data/map/map';
import { ElectricPoleRender } from '@endfieldmap/map-core/render/renderer/entity/electric_pole';
import type { ElectricPoleData, ElectricPoleMapData, ElectricPoleNodeData, MapData } from '@endfieldmap/map-core/types';
import { IdGenerator } from '@endfieldmap/map-core/utils/id_generator';
import { calculateXYZDistance, logger } from '@endfieldmap/tools';
import { action, reaction } from 'mobx';
import type { Coordinate } from 'ol/coordinate';

/**
 * 电线杆控制器
 * 负责协调ElectricPoleDataManager和ElectricPoleRenderer
 */
export class ElectricPoleController extends Disposer {
  /** 数据管理器 */
  public readonly dataManager: ElectricPoleMapDataManager;

  /** 渲染器缓存 */
  private render: ElectricPoleRender;

  constructor() {
    super();
    this.dataManager = new ElectricPoleMapDataManager();
    this.render = new ElectricPoleRender(this.dataManager);
    this.initListeners();
  }

  private initListeners() {
    const mapDataManager = MapDataManager.getInstance();
    // mobx 监听 currentMap
    const disposer = reaction(
      () => mapDataManager.currentMapId,
      (mapId) => {
        this.render.render(mapId);
      },
      { fireImmediately: true }
    );
    this.disposers.push(disposer);
  }

  get currentRenderer() {
    return this.render.currentElectricPoleInstance.pole;
  }

  get currentZoneRenderer() {
    return this.render.currentElectricPoleInstance.zone;
  }

  // #region 数据操作

  /**
   * 加载电线杆数据（数组格式）
   * 每条数据需包含 mapId 字段
   */
  @action
  public loadElectricPoleData(data: ElectricPoleNodeData[]): void {
    // 先清空所有地图的数据
    this.dataManager.clearAllMaps();
    // 按 mapId 分组
    const groupedData: ElectricPoleMapData = {};
    for (const node of data) {
      const { mapId, ...poleData } = node;
      if (!groupedData[mapId]) {
        groupedData[mapId] = [];
      }
      groupedData[mapId]!.push(poleData as ElectricPoleData);
    }

    // 加载分组后的数据
    for (const [mapId, list] of Object.entries(groupedData)) {
      const poleList = list as ElectricPoleData[];
      this.dataManager.loadMapData(mapId, poleList);
      this.syncConnectionsForMap(mapId);
    }    
  }

  /**
   * 同步指定地图的连接关系
   */
  private syncConnectionsForMap(mapId: MapData['id']): void {
    const manager = this.dataManager.getMapManager(mapId);
    manager.syncAllConnections();
  }

  /**
   * 创建电线杆数据
   */
  public createElectricPoleData(
    mapId: MapData['id'],
    position: Coordinate,
    deviceKey: ElectricPoleDeviceKey = DEFAULT_ELECTRIC_POLE_DEVICE_KEY
  ): ElectricPoleData {
    const mapDataInstance = MapDataManager.getInstance();
    const xyzPosition = mapDataInstance.crd2xyz(position, mapId);

    // 检查是否存在重复（0.5 单位内认为是重复点击）
    const manager = this.dataManager.getMapManager(mapId);
    const duplicateRadius = 0.5;

    for (const instance of manager.instances) {
      const distance = calculateXYZDistance(xyzPosition, instance.position);
      if (distance < duplicateRadius) {
        throw new Error(`[ElectricPoleController] Duplicate electric pole at ${position} (distance: ${distance})`);
      }
    }

    // 生成新ID
    const existingIds = new Set(manager.instances.map((instance) => instance.id));
    const levelLogicId = this.generateLevelLogicId(existingIds);

    const createLimit = getElectricPoleDeviceConfig(deviceKey).createLimit;
    if (typeof createLimit === 'number' && Number.isFinite(createLimit)) {
      const count = manager.instances.filter((i) => i.deviceKey === deviceKey).length;
      if (count >= createLimit) {
        throw new Error(
          `[ElectricPoleController] Create limit reached for deviceKey=${deviceKey} (limit: ${createLimit})`
        );
      }
    }

    // 创建数据
    const data: ElectricPoleData = {
      levelLogicId,
      entityDataIdKey: ElectricPoleIdKey,
      templateId: ElectricPoleKey,
      entityType: '#ElectricPole',
      position: xyzPosition,
      properties: {
        deviceKey,
        connections: [],
      },
    };

    return data;
  }

  /**
   * 将电线杆数据添加到管理器中
   */
  public addElectricPoleData(mapId: MapData['id'], data: ElectricPoleData): ElectricPoleDataInstance {
    const manager = this.dataManager.getMapManager(mapId);
    const instance = manager.addWithConnection(data);

    return instance;
  }


  /**
   * 删除电线杆
   */
  public deleteElectricPole(mapId: MapData['id'], id: number): boolean {
    const manager = this.dataManager.getMapManager(mapId);
    const instance = manager.getById(id);

    if (!instance) {
      logger.error('[ElectricPoleController] Instance not found', { mapId, id });
      return false;
    }

    // 清理连接关系 + 从管理器中移除
    return manager.removeWithCleanup(id);
  }

  /**
   * 生成唯一的逻辑ID
   */
  private generateLevelLogicId(usedIds?: Set<number>): number {
    const existingSet = usedIds ?? new Set<number>();

    // 电线杆ID范围：100,000,000 - 200,000,000
    const MIN_ID = 100_000_000;
    const MAX_ID = 200_000_000;

    return IdGenerator.generate(existingSet, MIN_ID, MAX_ID);
  }

  // #endregion

  // #region 可见性

  /**
   * 设置zone可见性
   */
  public setZoneVisible(visible: boolean): void {
    this.dataManager.setZoneVisible(visible);

    this.render.setZoneVisible(visible && this.dataManager.visible);
  }

  /**
   * 设置电线杆整体可见性
   */
  public setVisible(visible: boolean): void {
    this.dataManager.setVisible(visible);

    this.render.setVisible(visible);
  }

  /**
   * 设置指定设备类型的可见性
   */
  public setDeviceVisible(deviceKey: ElectricPoleDeviceKey, visible: boolean): void {
    this.dataManager.setDeviceVisible(deviceKey, visible);
  }

  /**
   * 设置指定地图的指定设备类型的可见性
   */
  public setMapDeviceVisible(mapId: MapData['id'], deviceKey: ElectricPoleDeviceKey, visible: boolean): void {
    this.dataManager.setMapDeviceVisible(mapId, deviceKey, visible);
  }

  /**
   * 获取指定设备类型的可见性
   */
  public getDeviceVisible(deviceKey: ElectricPoleDeviceKey): boolean {
    return this.dataManager.getDeviceVisible(deviceKey);
  }

  /**
   * 导入可见性数据
   */
  public importVisibility(data: { mapId: MapData['id']; entityKey: string; visible: boolean }[]): void {
    this.dataManager.importVisibilityData(data);
  }
  // #endregion
}
