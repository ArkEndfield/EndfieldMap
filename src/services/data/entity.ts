import type { StorageData, EntityVisibility, FeatureMarked, MapIndex, EntityData } from '@endfieldmap/map-core';
import { StorageKey, debounce, type StorageManager } from '@endfieldmap/tools';

/**
 * 实体数据管理器
 */
export class EntityDataService {
  public entityVisibilityData: StorageData<EntityVisibility> = {};
  public featureMarkedData: StorageData<FeatureMarked> = {};
  private storage: StorageManager;
  private DEBOUNCE_INTERVAL = 1000;

  constructor(storage: StorageManager) {
    this.storage = storage;
  }

  public async initFromStorage() {
    this.entityVisibilityData = (await this.storage.permanentGet(StorageKey.LAYERS_VISIBILITY)) || {};
    this.featureMarkedData = (await this.storage.permanentGet(StorageKey.MARKED_FEATURES)) || {};
  }

  public async saveToStorage() {
    await Promise.all([
      this.storage.permanentSet(StorageKey.LAYERS_VISIBILITY, this.entityVisibilityData),
      this.storage.permanentSet(StorageKey.MARKED_FEATURES, this.featureMarkedData),
    ]);
  }

  public updateEntityVisibility(mapIndex: MapIndex, entityDataIdKey: EntityData['entityDataIdKey'], visible: boolean) {
    if (!this.entityVisibilityData[mapIndex]) {
      this.entityVisibilityData[mapIndex] = {};
    }
    this.entityVisibilityData[mapIndex][entityDataIdKey] = visible;
    this.saveEntityVisibilityToStorageDebounced();
  }

  public updateFeatureMarked(mapIndex: MapIndex, levelLogicId: EntityData['levelLogicId'], marked: boolean) {
    if (!this.featureMarkedData[mapIndex]) {
      this.featureMarkedData[mapIndex] = {};
    }
    this.featureMarkedData[mapIndex][levelLogicId] = marked;
    this.saveFeatureMarkedToStorageDebounced();
  }

  public async saveEntityVisibilityToStorage() {
    return await this.storage.permanentSet(StorageKey.LAYERS_VISIBILITY, this.entityVisibilityData);
  }

  public async saveFeatureMarkedToStorage() {
    return await this.storage.permanentSet(StorageKey.MARKED_FEATURES, this.featureMarkedData);
  }

  get saveEntityVisibilityToStorageDebounced() {
    return debounce(this.saveEntityVisibilityToStorage.bind(this), this.DEBOUNCE_INTERVAL);
  }

  get saveFeatureMarkedToStorageDebounced() {
    return debounce(this.saveFeatureMarkedToStorage.bind(this), this.DEBOUNCE_INTERVAL);
  }
}
