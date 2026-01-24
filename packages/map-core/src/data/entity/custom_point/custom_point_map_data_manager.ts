import { Disposer } from '@endfieldmap/map-core/commom/disposer';
import { CustomPointDataInstance } from '@endfieldmap/map-core/data/entity/custom_point/custom_point_data_instance';
import { CustomPointDataManager } from '@endfieldmap/map-core/data/entity/custom_point/custom_point_data_manager';
import { MapDataManager } from '@endfieldmap/map-core/data/map/map';
import type { MapData } from '@endfieldmap/map-core/types';
import type { CustomPointData, CustomPointMapData } from '@endfieldmap/map-core/types/entity';
import { action, computed, observable } from 'mobx';

/**
 * 自定义标点地图数据管理器
 * 管理所有地图的自定义标点数据
 */
export class CustomPointMapDataManager extends Disposer {
  /** 地图数据管理器集合 */
  @observable
  accessor mapManagers: Map<MapData['id'], CustomPointDataManager> = new Map();

  /** 自定义标点是否可见 */
  @observable
  accessor visible: boolean = true;

  constructor() {
    super();
    this.initData();
  }

  private initData() {
    const mapData = MapDataManager.getInstance();
    const mapIds = mapData.mapIds;
    for (const mapId of mapIds) {
      const manager = new CustomPointDataManager({ mapId });
      this.mapManagers.set(mapId, manager);
    }
  }

  /**
   * 获取地图数据管理器
   * 如果不存在则自动创建
   */
  public getMapManager(mapId: MapData['id']): CustomPointDataManager {
    let manager = this.mapManagers.get(mapId);
    if (!manager) {
      manager = new CustomPointDataManager({ mapId });
      this.mapManagers.set(mapId, manager);
    }
    return manager;
  }

  /**
   * 切换当前地图
   */
  @action
  public switchMap(mapId: MapData['id']): CustomPointDataManager {
    return this.getMapManager(mapId);
  }

  /**
   * 获取当前地图数据管理器
   */
  @computed
  get currentManager(): CustomPointDataManager {
    const mapData = MapDataManager.getInstance();
    const currentMapId = mapData.currentMapId;
    return this.getMapManager(currentMapId);
  }

  /**
   * 获取当前地图的所有实例
   */
  @computed
  get currentInstances(): CustomPointDataInstance[] {
    return this.currentManager?.instances ?? [];
  }

  /**
   * 获取当前地图的所有数据
   */
  @computed
  get currentData(): CustomPointData[] {
    return this.currentManager?.exportData ?? [];
  }

  /**
   * 获取所有地图的数据（用于导出）
   */
  @computed
  get allData(): Record<MapData['id'], CustomPointData[]> {
    const data: Record<MapData['id'], CustomPointData[]> = {};
    for (const [mapId, manager] of this.mapManagers) {
      data[mapId] = manager.exportData;
    }
    return data;
  }

  /**
   * 加载自定义标点数据（不重新生成ID）
   */
  @action
  public loadData(data: CustomPointMapData): void {
    for (const [mapId, pointList] of Object.entries(data)) {
      if (!pointList) continue;
      const manager = new CustomPointDataManager({
        mapId,
        initialData: pointList,
      });
      this.mapManagers.set(mapId, manager);
    }
  }

  /**
   * 加载单个地图的数据
   */
  @action
  public loadMapData(mapId: MapData['id'], data: CustomPointData[]): void {
    const manager = this.getMapManager(mapId);
    // 清空现有数据
    manager.clear();
    // 添加新数据
    manager.addBatch(data);
  }

  /**
   * 设置是否可见
   * @param visible 是否可见
   */
  @action
  public setVisible(visible: boolean): void {
    this.visible = visible;
  }
}
