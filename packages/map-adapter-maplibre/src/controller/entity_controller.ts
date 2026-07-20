import type {
  EntityData,
  EntityDataInstance,
  EntityGroupManager,
  EntityInfoDataJson,
  EntityInfoStats,
  EntityJsonDataList,
  IEntityController,
  MapData,
  MapDataManager,
} from '@endfieldmap/map-core';
import { EntityMapDataManager, MarkedFeatureFilterMode } from '@endfieldmap/map-core';
import { action, computed } from 'mobx';

export interface EntityControllerConfig {
  mapDataManager: MapDataManager;
}

export class EntityController implements IEntityController {
  public readonly dataManager: EntityMapDataManager;

  private readonly mapDataManager: MapDataManager;

  constructor(config: EntityControllerConfig) {
    this.mapDataManager = config.mapDataManager;
    this.dataManager = new EntityMapDataManager(config.mapDataManager);
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

  getMapLevelIds(mapId: MapData['id']): string[] {
    return this.dataManager.getMapLevelIds(mapId);
  }

  getSelectedLevelIds(mapId: MapData['id']): string[] {
    return [...this.dataManager.getSelectedLevelIds(mapId)];
  }

  @action
  setSelectedLevels(mapId: MapData['id'], levelIds: string[]): void {
    this.dataManager.setSelectedLevels(mapId, levelIds);
  }

  @action
  setLevelSelected(mapId: MapData['id'], levelId: string, selected: boolean): void {
    this.dataManager.setLevelSelected(mapId, levelId, selected);
  }

  @action
  resetSelectedLevels(mapId: MapData['id']): void {
    this.dataManager.resetSelectedLevels(mapId);
  }

  loadData(jsonData: EntityJsonDataList, infoData: EntityInfoDataJson): void {
    this.dataManager.loadData(jsonData, infoData);
  }

  @action
  setClusterEnable(enable: boolean): void {
    this.dataManager.setDisableCluster(!enable);
  }

  @action
  setMarked(mapId: MapData['id'], levelLogicId: EntityData['levelLogicId'], marked: boolean): void {
    this.dataManager.setMarked(mapId, levelLogicId, marked);
  }

  @action
  setEntityVisibility(mapId: MapData['id'], levelLogicId: EntityData['levelLogicId'], visible: boolean): void {
    const instance = this.dataManager.getInstanceById(mapId, levelLogicId);
    if (instance) {
      instance.setVisible(visible);
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
  }

  @action
  setGroupVisibility(mapId: MapData['id'], entityKey: EntityData['entityDataIdKey'], visible: boolean): void {
    this.dataManager.setGroupVisibility(mapId, entityKey, visible);
  }

  @action
  setMarkedFilterMode(mode: MarkedFeatureFilterMode): void {
    if (this.dataManager.markedFilterMode === mode) return;
    this.dataManager.setMarkedFilterMode(mode);
  }

  @action
  setSelected(mapId: MapData['id'], levelLogicId: EntityData['levelLogicId'], selected: boolean): void {
    const instance = this.dataManager.getInstanceById(mapId, levelLogicId);
    if (instance) {
      instance.setSelected(selected);
    }
  }

  @action
  batchSetSelected(
    items: Array<{ mapId: MapData['id']; levelLogicId: EntityData['levelLogicId']; selected: boolean }>
  ): void {
    for (const item of items) {
      const instance = this.dataManager.getInstanceById(item.mapId, item.levelLogicId);
      if (instance && instance.selected !== item.selected) {
        instance.setSelected(item.selected);
      }
    }
  }

  @action
  setActive(mapId: MapData['id'], levelLogicId: EntityData['levelLogicId'], active: boolean): void {
    const instance = this.dataManager.getInstanceById(mapId, levelLogicId);
    if (instance) {
      instance.setActive(active);
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

  isFeatureRenderable(instance: EntityDataInstance): boolean {
    return (
      instance.visible &&
      this.isFeatureVisibleByFilter(instance.marked) &&
      // 用 mapLevelId 而非 data.mapLevelId：后者会 toJS 深拷贝整个实体数据，
      // 而这里是逐实体跑满全图的热路径
      this.dataManager.isLevelSelected(instance.mapId, instance.mapLevelId)
    );
  }

  @computed
  get currentVisibleInstances(): EntityDataInstance[] {
    if (!this.dataManager.dataLoaded) return [];
    const mapId = this.mapDataManager.currentMapId;
    const managers = this.dataManager.getMapGroupManagerList(mapId);
    const result: EntityDataInstance[] = [];

    for (const manager of managers) {
      if (!manager.groupVisible) continue;
      for (const instance of manager.instances) {
        if (!this.isFeatureRenderable(instance)) continue;
        result.push(instance);
      }
    }
    return result;
  }

  dispose(): void {
    // no-op
  }
}
