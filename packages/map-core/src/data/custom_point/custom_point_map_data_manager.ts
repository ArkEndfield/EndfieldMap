import { CustomPointKey, type MapIndex } from '@endfieldmap/map-core/const/map';
import { getDefaultCustomPointType } from '@endfieldmap/map-core/data/custom_point/custom_point_config';
import { CustomPointDataInstance } from '@endfieldmap/map-core/data/custom_point/custom_point_data_instance';
import { CustomPointDataManager } from '@endfieldmap/map-core/data/custom_point/custom_point_data_manager';
import type { CustomPointData, CustomPointMapData, CustomPointTypeId } from '@endfieldmap/map-core/types/entity';
import { IdGenerator } from '@endfieldmap/map-core/utils/id_generator';
import { calculateXYZDistance, crd2xyz, logger } from '@endfieldmap/tools';
import { action, computed, observable } from 'mobx';
import type { Coordinate } from 'ol/coordinate';

/**
 * 自定义标点地图数据管理器
 * 管理所有地图的自定义标点数据
 */
export class CustomPointMapDataManager {
  /** 地图数据管理器集合 */
  @observable
  accessor mapManagers: Map<MapIndex, CustomPointDataManager> = new Map();

  /** 当前地图索引 */
  @observable
  accessor currentMapIndex: MapIndex | null = null;

  /** 自定义标点是否可见 */
  @observable
  accessor visible: boolean = true;

  /**
   * 获取或创建地图数据管理器
   */
  public getOrCreateManager(mapIndex: MapIndex): CustomPointDataManager {
    let manager = this.mapManagers.get(mapIndex);
    if (!manager) {
      manager = new CustomPointDataManager({ mapIndex });
      this.mapManagers.set(mapIndex, manager);
    }
    return manager;
  }

  /**
   * 获取地图数据管理器
   */
  public getManager(mapIndex: MapIndex): CustomPointDataManager | undefined {
    return this.mapManagers.get(mapIndex);
  }

  /**
   * 获取地图数据管理器（如果不存在则创建）
   */
  public getMapManager(mapIndex: MapIndex): CustomPointDataManager {
    return this.getOrCreateManager(mapIndex);
  }

  /**
   * 切换当前地图
   */
  @action
  public switchMap(mapIndex: MapIndex): CustomPointDataManager {
    this.currentMapIndex = mapIndex;
    return this.getOrCreateManager(mapIndex);
  }

  /**
   * 获取当前地图数据管理器
   */
  @computed
  get currentManager(): CustomPointDataManager | undefined {
    if (!this.currentMapIndex) {
      return undefined;
    }
    return this.mapManagers.get(this.currentMapIndex);
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
  get allData(): Partial<Record<MapIndex, CustomPointData[]>> {
    const data: Partial<Record<MapIndex, CustomPointData[]>> = {};
    for (const [mapIndex, manager] of this.mapManagers) {
      data[mapIndex] = manager.exportData;
    }
    return data;
  }

  /**
   * 初始化自定义标点数据（会重新生成ID）
   */
  @action
  public initData(data: CustomPointMapData): void {
    // 全局已使用的ID集合
    const globalUsedIds = new Set<number>();

    // 收集现有ID
    for (const [, manager] of this.mapManagers) {
      for (const instance of manager.instances) {
        globalUsedIds.add(instance.id);
      }
    }

    for (const [mapIndexStr, pointList] of Object.entries(data)) {
      if (!pointList) continue;
      const mapIndex = mapIndexStr as MapIndex;

      // 构建ID映射
      const idMap = new Map<number, number>();
      for (const point of pointList) {
        const oldId = point.levelLogicId;
        const newId = this.generateId(globalUsedIds);
        idMap.set(oldId, newId);
        globalUsedIds.add(newId);
      }

      // 重映射数据
      const remappedList: CustomPointData[] = pointList.map((point) => {
        const newId = idMap.get(point.levelLogicId)!;
        return {
          ...point,
          levelLogicId: newId,
        };
      });

      // 创建管理器并初始化数据
      const manager = new CustomPointDataManager({
        mapIndex,
        initialData: remappedList,
      });
      this.mapManagers.set(mapIndex, manager);
    }
  }

  /**
   * 加载自定义标点数据（不重新生成ID）
   */
  @action
  public loadData(data: CustomPointMapData): void {
    for (const [mapIndexStr, pointList] of Object.entries(data)) {
      if (!pointList) continue;
      const mapIndex = mapIndexStr as MapIndex;

      const manager = new CustomPointDataManager({
        mapIndex,
        initialData: pointList,
      });
      this.mapManagers.set(mapIndex, manager);
    }
  }

  /**
   * 重置所有数据
   */
  @action
  public resetAllData(data: CustomPointMapData): void {
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
  public loadMapData(mapIndex: MapIndex, data: CustomPointData[]): void {
    const manager = this.getOrCreateManager(mapIndex);
    // 清空现有数据
    manager.clear();
    // 添加新数据
    manager.addBatch(data);
  }

  /**
   * 导出所有数据
   */
  public exportAllData(): CustomPointMapData {
    return this.allData;
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
   * 创建自定义标点
   */
  @action
  public createCustomPoint(
    mapIndex: MapIndex,
    position: Coordinate,
    typeId?: CustomPointTypeId
  ): CustomPointDataInstance {
    const manager = this.getOrCreateManager(mapIndex);
    const xyzPosition = crd2xyz(position, mapIndex);

    // 检查重复（0.5 单位内认为是重复点击）
    const duplicateRadius = 0.5;
    for (const instance of manager.instances) {
      const distance = calculateXYZDistance(xyzPosition, instance.position);
      if (distance < duplicateRadius) {
        throw new Error(`Duplicate custom point at position (distance: ${distance})`);
      }
    }

    const effectiveTypeId = typeId ?? (getDefaultCustomPointType().id as CustomPointTypeId);

    const data: CustomPointData = {
      levelLogicId: this.generateId(),
      entityDataIdKey: effectiveTypeId,
      templateId: CustomPointKey,
      entityType: '#CustomPoint',
      position: xyzPosition,
      properties: {},
    };

    const instance = manager.add(data);
    return instance;
  }

  /**
   * 添加自定义标点
   */
  @action
  public addCustomPoint(mapIndex: MapIndex, data: CustomPointData): CustomPointDataInstance | null {
    const manager = this.getOrCreateManager(mapIndex);

    try {
      const instance = manager.add(data);
      return instance;
    } catch (error) {
      logger.error('[CustomPointMapDataManager] Failed to add custom point', error);
      return null;
    }
  }

  /**
   * 删除自定义标点
   */
  @action
  public deleteCustomPoint(mapIndex: MapIndex, id: number): boolean {
    const manager = this.getManager(mapIndex);
    if (!manager) {
      return false;
    }

    const result = manager.remove(id);
    return result;
  }

  /**
   * 生成唯一ID
   */
  private generateId(usedIds?: Set<number>): number {
    const existingIds = usedIds ?? new Set(this.currentData.map((d) => d.levelLogicId));
    const MIN_ID = 200_000_000;
    const MAX_ID = 300_000_000;
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

}
