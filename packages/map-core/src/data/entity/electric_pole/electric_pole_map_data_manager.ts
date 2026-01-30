import { Disposer } from '@endfieldmap/map-core/commom/disposer';
import type { ElectricPoleDeviceKey } from '@endfieldmap/map-core/const/electric_pole';
import { ElectricPoleDataInstance } from '@endfieldmap/map-core/data/entity/electric_pole/electric_pole_data_instance';
import { ElectricPoleDataManager } from '@endfieldmap/map-core/data/entity/electric_pole/electric_pole_data_manager';
import { MapDataManager } from '@endfieldmap/map-core/data/map/map';
import type { MapData } from '@endfieldmap/map-core/types';
import type { ElectricPoleData, ElectricPoleMapData } from '@endfieldmap/map-core/types/entity';
import { action, computed, observable } from 'mobx';

/**
 * 电线杆地图数据管理器
 * 管理所有地图的电线杆数据
 */
export class ElectricPoleMapDataManager extends Disposer {
  /** 地图数据管理器集合 */
  @observable
  accessor mapManagers: Map<MapData['id'], ElectricPoleDataManager> = new Map();

  /** 电线杆是否可见 */
  @observable
  accessor visible: boolean = true;

  /** 覆盖区域是否可见 */
  @observable
  accessor zoneVisible: boolean = true;

  constructor() {
    super();
    this.initData();
  }

  private initData() {
    const mapData = MapDataManager.getInstance();
    const mapIds = mapData.mapIds;
    for (const mapId of mapIds) {
      const manager = new ElectricPoleDataManager({ mapId });
      this.mapManagers.set(mapId, manager);
    }
  }

  /**
   * 获取地图数据管理器
   * 如果不存在则自动创建
   */
  public getMapManager(mapId: MapData['id']): ElectricPoleDataManager {
    let manager = this.mapManagers.get(mapId);
    if (!manager) {
      manager = new ElectricPoleDataManager({ mapId });
      this.mapManagers.set(mapId, manager);
    }
    return manager;
  }

  /**
   * 切换当前地图
   */
  @action
  public switchMap(mapId: MapData['id']): ElectricPoleDataManager {
    return this.getMapManager(mapId);
  }

  /**
   * 获取当前地图数据管理器
   */
  @computed
  get currentManager(): ElectricPoleDataManager | undefined {
    const mapDataInstance = MapDataManager.getInstance();
    const currentMapId = mapDataInstance.currentMapId;
    return this.getMapManager(currentMapId);
  }

  /**
   * 获取当前地图的所有实例
   */
  @computed
  get currentInstances(): ElectricPoleDataInstance[] {
    return this.currentManager?.instances ?? [];
  }

  /**
   * 加载电线杆数据（不重新生成ID）
   */
  @action
  public loadData(data: ElectricPoleMapData): void {
    for (const [mapId, poleList] of Object.entries(data)) {
      if (!poleList) continue;
      const manager = new ElectricPoleDataManager({
        mapId,
        initialData: poleList,
      });
      this.mapManagers.set(mapId, manager);
    }
  }

  /**
   * 清空所有地图的数据
   */
  @action
  public clearAllMaps(): void {
    this.mapManagers.forEach((manager) => {
      manager.clear();
    });
  }

  /**
   * 加载单个地图的数据
   */
  @action
  public loadMapData(mapId: MapData['id'], data: ElectricPoleData[]): void {
    const manager = this.getMapManager(mapId);
    // 清空现有数据
    manager.clear();
    // 添加新数据
    manager.addBatch(data);
    // 同步连接关系
    manager.syncAllConnections();
  }

  @action
  setVisible(visible: boolean): void {
    this.visible = visible;
  }

  @action
  setZoneVisible(visible: boolean): void {
    this.zoneVisible = visible;
  }

  /**
   * 设置指定设备类型的可见性（当前地图）
   */
  @action
  setDeviceVisible(deviceKey: ElectricPoleDeviceKey, visible: boolean): void {
    const manager = this.currentManager;
    if (manager) {
      manager.setDeviceVisible(deviceKey, visible);
    }
  }

  /**
   * 设置指定地图的指定设备类型的可见性
   */
  @action
  setMapDeviceVisible(mapId: MapData['id'], deviceKey: ElectricPoleDeviceKey, visible: boolean): void {
    const manager = this.getMapManager(mapId);
    manager.setDeviceVisible(deviceKey, visible);
  }

  /**
   * 获取指定设备类型的可见性（当前地图）
   */
  getDeviceVisible(deviceKey: ElectricPoleDeviceKey): boolean {
    return this.currentManager?.getDeviceVisible(deviceKey) ?? true;
  }

  /**
   * 导入可见性数据
   */
  @action
  public importVisibilityData(data: { mapId: MapData['id']; entityKey: string; visible: boolean }[]): void {
    for (const item of data) {
      const { mapId, entityKey, visible } = item;

      // 确保 Manager 存在（即使没有电线杆数据，也应该保存设置）
      const manager = this.getMapManager(mapId);

      // 这里的 entityKey 其实就是 ElectricPoleDeviceKey
      manager.setDeviceVisible(entityKey as ElectricPoleDeviceKey, visible);
    }
  }
}
