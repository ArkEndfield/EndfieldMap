
import { ElectricPoleIdKey, ElectricPoleKey, type MapIndex } from '@endfieldmap/map-core/const/map';
import { ElectricPoleDataInstance } from '@endfieldmap/map-core/data/electric_pole/electric_pole_data_instance';
import { ElectricPoleDataManager } from '@endfieldmap/map-core/data/electric_pole/electric_pole_data_manager';
import type { ElectricPoleData, ElectricPoleMapData } from '@endfieldmap/map-core/types/entity';
import { IdGenerator } from '@endfieldmap/map-core/utils/id_generator';
import { calculateXYZDistance, crd2xyz, logger } from '@endfieldmap/tools';
import { action, computed, observable } from 'mobx';
import type { Coordinate } from 'ol/coordinate';

/**
 * 电线杆地图数据管理器
 * 管理所有地图的电线杆数据
 */
export class ElectricPoleMapDataManager {
  /** 地图数据管理器集合 */
  @observable
  accessor mapManagers: Map<MapIndex, ElectricPoleDataManager> = new Map();

  /** 当前地图索引 */
  @observable
  accessor currentMapIndex: MapIndex | null = null;

  /** 电线杆是否可见 */
  @observable
  accessor visible: boolean = true;

  /** 覆盖区域是否可见 */
  @observable
  accessor zoneVisible: boolean = true;

  /**
   * 获取或创建地图数据管理器
   */
  public getOrCreateManager(mapIndex: MapIndex): ElectricPoleDataManager {
    let manager = this.mapManagers.get(mapIndex);
    if (!manager) {
      manager = new ElectricPoleDataManager({ mapIndex });
      this.mapManagers.set(mapIndex, manager);
    }
    return manager;
  }

  /**
   * 获取地图数据管理器
   */
  public getManager(mapIndex: MapIndex): ElectricPoleDataManager | undefined {
    return this.mapManagers.get(mapIndex);
  }

  /**
   * 获取地图数据管理器（如果不存在则创建）
   */
  public getMapManager(mapIndex: MapIndex): ElectricPoleDataManager {
    return this.getOrCreateManager(mapIndex);
  }

  /**
   * 切换当前地图
   */
  @action
  public switchMap(mapIndex: MapIndex): ElectricPoleDataManager {
    this.currentMapIndex = mapIndex;
    return this.getOrCreateManager(mapIndex);
  }

  /**
   * 获取当前地图数据管理器
   */
  @computed
  get currentManager(): ElectricPoleDataManager | undefined {
    if (!this.currentMapIndex) {
      return undefined;
    }
    return this.mapManagers.get(this.currentMapIndex);
  }

  /**
   * 获取当前地图的所有实例
   */
  @computed
  get currentInstances(): ElectricPoleDataInstance[] {
    return this.currentManager?.instances ?? [];
  }

  /**
   * 获取当前地图的所有数据
   */
  @computed
  get currentData(): ElectricPoleData[] {
    return this.currentManager?.exportData ?? [];
  }

  /**
   * 获取所有地图的数据（用于导出）
   */
  @computed
  get allData(): Partial<Record<MapIndex, ElectricPoleData[]>> {
    const data: Partial<Record<MapIndex, ElectricPoleData[]>> = {};
    for (const [mapIndex, manager] of this.mapManagers) {
      data[mapIndex] = manager.exportData;
    }
    return data;
  }

  /**
   * 初始化电线杆数据（会重新生成ID）
   */
  @action
  public initData(data: ElectricPoleMapData): void {
    // 全局已使用的ID集合
    const globalUsedIds = new Set<number>();

    // 收集现有ID
    for (const [, manager] of this.mapManagers) {
      for (const instance of manager.instances) {
        globalUsedIds.add(instance.id);
      }
    }

    for (const [mapIndexStr, poleList] of Object.entries(data)) {
      if (!poleList) continue;
      const mapIndex = mapIndexStr as MapIndex;

      // 构建ID映射
      const idMap = new Map<number, number>();
      for (const pole of poleList) {
        const oldId = pole.levelLogicId;
        const newId = this.generateId(globalUsedIds);
        idMap.set(oldId, newId);
        globalUsedIds.add(newId);
      }

      // 重映射数据
      const remappedList: ElectricPoleData[] = poleList.map((pole) => {
        const newId = idMap.get(pole.levelLogicId)!;
        let newConnectTo: number | null = null;

        if (pole.properties.connectTo !== null) {
          const mappedTo = idMap.get(pole.properties.connectTo);
          if (mappedTo !== undefined) {
            newConnectTo = mappedTo;
          } else {
            logger.warn('[ElectricPoleMapDataManager] connectTo target not found after remap', {
              mapIndex,
              from: pole.levelLogicId,
              to: pole.properties.connectTo,
            });
          }
        }

        return {
          ...pole,
          levelLogicId: newId,
          properties: {
            ...pole.properties,
            connectTo: newConnectTo,
          },
        };
      });

      // 创建管理器并初始化数据
      const manager = new ElectricPoleDataManager({
        mapIndex,
        initialData: remappedList,
      });
      this.mapManagers.set(mapIndex, manager);
    }
  }

  /**
   * 加载电线杆数据（不重新生成ID）
   */
  @action
  public loadData(data: ElectricPoleMapData): void {
    for (const [mapIndexStr, poleList] of Object.entries(data)) {
      if (!poleList) continue;
      const mapIndex = mapIndexStr as MapIndex;

      const manager = new ElectricPoleDataManager({
        mapIndex,
        initialData: poleList,
      });
      this.mapManagers.set(mapIndex, manager);
    }
  }

  /**
   * 重置所有数据
   */
  @action
  public resetAllData(data: ElectricPoleMapData): void {
    this.mapManagers.clear();
    this.currentMapIndex = null;
    this.loadData(data);
  }

  /**
   * 清除所有数据
   */
  @action
  public clearAll(): void {
    this.mapManagers.clear();
    this.currentMapIndex = null;
  }

  /**
   * 加载单个地图的数据
   */
  @action
  public loadMapData(mapIndex: MapIndex, data: ElectricPoleData[]): void {
    const manager = new ElectricPoleDataManager({
      mapIndex,
      initialData: data,
    });
    this.mapManagers.set(mapIndex, manager);
  }

  /**
   * 导出标记数据
   */
  public exportMarkedData(): Record<MapIndex, Record<number, boolean>> {
    const result: Partial<Record<MapIndex, Record<number, boolean>>> = {};

    for (const [mapIndex, manager] of this.mapManagers) {
      const marked: Record<number, boolean> = {};
      for (const instance of manager.instances) {
        if (instance.marked) {
          marked[instance.id] = true;
        }
      }
      if (Object.keys(marked).length > 0) {
        result[mapIndex] = marked;
      }
    }

    return result as Record<MapIndex, Record<number, boolean>>;
  }

  /**
   * 导入标记数据
   */
  public importMarkedData(data: Record<MapIndex, Record<number, boolean>>): number {
    let count = 0;

    for (const [mapIndexStr, markedMap] of Object.entries(data)) {
      const mapIndex = mapIndexStr as MapIndex;
      const manager = this.getManager(mapIndex);

      if (manager && markedMap) {
        for (const [idStr, marked] of Object.entries(markedMap)) {
          const id = Number(idStr);
          const instance = manager.getById(id);
          if (instance && marked) {
            instance.setMarked(true);
            count++;
          }
        }
      }
    }

    return count;
  }

  /**
   * 创建电线杆
   */
  @action
  public createElectricPole(mapIndex: MapIndex, position: Coordinate): ElectricPoleDataInstance {
    const manager = this.getOrCreateManager(mapIndex);
    const xyzPosition = crd2xyz(position, mapIndex);

    // 检查重复（0.5 单位内认为是重复点击）
    const duplicateRadius = 0.5;
    for (const instance of manager.instances) {
      const distance = calculateXYZDistance(xyzPosition, instance.position);
      if (distance < duplicateRadius) {
        throw new Error(`Duplicate electric pole at position (distance: ${distance})`);
      }
    }

    const data: ElectricPoleData = {
      levelLogicId: this.generateId(),
      entityDataIdKey: ElectricPoleIdKey,
      templateId: ElectricPoleKey,
      entityType: '#ElectricPole',
      position: xyzPosition,
      properties: {
        connectTo: null,
      },
    };

    const instance = manager.addWithConnection(data);
    return instance;
  }

  /**
   * 删除电线杆
   */
  @action
  public deleteElectricPole(mapIndex: MapIndex, id: number): boolean {
    const manager = this.getManager(mapIndex);
    if (!manager) {
      return false;
    }

    const result = manager.removeWithCleanup(id);
    return result;
  }

  /**
   * 生成唯一ID
   */
  private generateId(usedIds?: Set<number>): number {
    const existingIds = usedIds ?? new Set(this.currentData.map((d) => d.levelLogicId));
    const MIN_ID = 100_000_000;
    const MAX_ID = 200_000_000;
    return IdGenerator.generate(existingIds, MIN_ID, MAX_ID);
  }

  /**
   * 设置可见性
   */
  @action
  public setVisible(visible: boolean): void {
    this.visible = visible;
  }

  /**
   * 切换可见性
   */
  @action
  public toggleVisible(): void {
    this.visible = !this.visible;
  }

  /**
   * 设置覆盖区域可见性
   */
  @action
  public setZoneVisible(visible: boolean): void {
    this.zoneVisible = visible;
  }

  /**
   * 切换覆盖区域可见性
   */
  @action
  public toggleZoneVisible(): void {
    this.zoneVisible = !this.zoneVisible;
  }
}
