import type { EntityData,
EntityDataInstance, EntityGroupManager,   EntityInfoDataJson,
  EntityInfoStats,
  EntityJsonDataList,IEntityController, MapData,MapDataManager } from '@endfieldmap/map-core';
import { EntityMapDataManager,MarkedFeatureFilterMode } from '@endfieldmap/map-core';
import { action, computed, observable, reaction } from 'mobx';

export interface EntityControllerConfig {
  mapDataManager: MapDataManager;
}

/**
 * MapLibre 实体控制器
 *
 * 不直接控制渲染（MapLibre 渲染由 React 组件驱动），
 * 而是管理数据状态并提供计算属性供 React 组件观察
 */
export class EntityController implements IEntityController {
  public readonly dataManager: EntityMapDataManager;

  private readonly mapDataManager: MapDataManager;

  /** 数据版本号，每次状态变更递增，用于触发 React 组件重新计算 GeoJSON */
  @observable accessor dataVersion = 0;

  private disposers: Array<() => void> = [];

  constructor(config: EntityControllerConfig) {
    this.mapDataManager = config.mapDataManager;
    this.dataManager = new EntityMapDataManager(config.mapDataManager);
    this.registerReactions();
  }

  private registerReactions(): void {
    this.disposers.push(
      reaction(
        () => this.mapDataManager.currentMapId,
        () => {
          if (this.dataManager.dataLoaded) {
            this.bumpVersion();
          }
        }
      )
    );
  }

  @action
  private bumpVersion(): void {
    this.dataVersion++;
  }

  get currentStats(): EntityInfoStats[] {
    return this.dataManager.currentStats;
  }

  getMapGroupManagerList(mapId: MapData['id']): EntityGroupManager[] {
    return this.dataManager.getMapGroupManagerList(mapId);
  }

  getInstanceById(mapId: MapData['id'], id: number): EntityDataInstance | undefined {
    return this.dataManager.getInstanceById(mapId, id);
  }

  loadData(jsonData: EntityJsonDataList, infoData: EntityInfoDataJson): void {
    this.dataManager.loadData(jsonData, infoData);
    this.bumpVersion();
  }

  @action
  setClusterEnable(enable: boolean): void {
    this.dataManager.setDisableCluster(!enable);
    this.bumpVersion();
  }

  @action
  setMarked(mapId: MapData['id'], levelLogicId: EntityData['levelLogicId'], marked: boolean): void {
    this.dataManager.setMarked(mapId, levelLogicId, marked);
    this.bumpVersion();
  }

  @action
  setEntityVisibility(mapId: MapData['id'], levelLogicId: EntityData['levelLogicId'], visible: boolean): void {
    const instance = this.dataManager.getInstanceById(mapId, levelLogicId);
    if (instance) {
      instance.setVisible(visible);
      this.bumpVersion();
    }
  }

  @action
  setAllEntityVisible(visible: boolean): void {
    const mapIds = Array.from(this.dataManager.mapData.keys());
    for (const mapId of mapIds) {
      const managers = this.dataManager.getMapGroupManagerList(mapId);
      for (const manager of managers) {
        for (const instance of manager.instances) {
          instance.setVisible(visible);
        }
      }
    }
    this.bumpVersion();
  }

  @action
  setGroupVisibility(mapId: MapData['id'], entityKey: EntityData['entityDataIdKey'], visible: boolean): void {
    this.dataManager.setGroupVisibility(mapId, entityKey, visible);
    this.bumpVersion();
  }

  @action
  setMarkedFilterMode(mode: MarkedFeatureFilterMode): void {
    if (this.dataManager.markedFilterMode === mode) return;
    this.dataManager.setMarkedFilterMode(mode);
    this.bumpVersion();
  }

  @action
  setSelected(mapId: MapData['id'], levelLogicId: EntityData['levelLogicId'], selected: boolean): void {
    const instance = this.dataManager.getInstanceById(mapId, levelLogicId);
    if (instance) {
      instance.setSelected(selected);
      this.bumpVersion();
    }
  }

  @action
  batchSetSelected(
    items: Array<{ mapId: MapData['id']; levelLogicId: EntityData['levelLogicId']; selected: boolean }>
  ): void {
    let changed = false;
    for (const item of items) {
      const instance = this.dataManager.getInstanceById(item.mapId, item.levelLogicId);
      if (instance && instance.selected !== item.selected) {
        instance.setSelected(item.selected);
        changed = true;
      }
    }
    if (changed) {
      this.bumpVersion();
    }
  }

  @action
  setActive(mapId: MapData['id'], levelLogicId: EntityData['levelLogicId'], active: boolean): void {
    const instance = this.dataManager.getInstanceById(mapId, levelLogicId);
    if (instance) {
      instance.setActive(active);
      this.bumpVersion();
    }
  }

  async importVisibility(
    data: Array<{ entityKey: EntityData['entityDataIdKey']; mapId: MapData['id']; visible: boolean }>
  ): Promise<number> {
    let count = 0;
    for (const item of data) {
      this.setGroupVisibility(item.mapId, item.entityKey, item.visible);
      count++;
    }
    return count;
  }

  async importMarked(
    data: Array<{ entityId: EntityData['levelLogicId']; mapId: MapData['id']; marked: boolean }>
  ): Promise<number> {
    let count = 0;
    for (const item of data) {
      this.setMarked(item.mapId, item.entityId, item.marked);
      if (item.marked) count++;
    }
    return count;
  }

  /**
   * 判断实体在当前 markedFilterMode 下是否应可见
   */
  isFeatureVisibleByFilter(marked: boolean): boolean {
    switch (this.dataManager.markedFilterMode) {
      case MarkedFeatureFilterMode.Marked:
        return marked;
      case MarkedFeatureFilterMode.Unmarked:
        return !marked;
      case MarkedFeatureFilterMode.All:
      default:
        return true;
    }
  }

  /**
   * 获取当前地图中可见实体的快照（供 React 组件构建 GeoJSON）
   */
  @computed
  get currentVisibleInstances(): EntityDataInstance[] {
    if (!this.dataManager.dataLoaded) return [];
    const mapId = this.mapDataManager.currentMapId;
    const managers = this.dataManager.getMapGroupManagerList(mapId);
    const result: EntityDataInstance[] = [];

    for (const manager of managers) {
      if (!manager.groupVisible) continue;
      for (const instance of manager.instances) {
        if (!this.isFeatureVisibleByFilter(instance.marked)) continue;
        result.push(instance);
      }
    }
    return result;
  }

  dispose(): void {
    for (const disposer of this.disposers) {
      disposer();
    }
    this.disposers = [];
  }
}
