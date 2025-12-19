import type {
  EndfieldMapAdapter,
  EntityVisibility,
  FeatureMarked,
  StorageData,
} from '@endfieldmap/map-core';
import { debounce, StorageKey, type StorageManager } from '@endfieldmap/tools';
import { autorun } from 'mobx';

import { DEBOUNCE_INTERVAL } from '@/const/data';

/**
 * 实体数据管理器
 */
export class EntityDataService {
  private storage: StorageManager;
  private adapter: EndfieldMapAdapter;
  private reactionDisposers: Array<() => void> = [];

  constructor(storage: StorageManager, adapter: EndfieldMapAdapter) {
    this.storage = storage;
    this.adapter = adapter;
    this.initAutoSaveReaction();
  }

  public async initFromStorage() {
    const entityVisibilityData = (await this.storage.permanentGet(StorageKey.LAYERS_VISIBILITY)) || {};
    const featureMarkedData = (await this.storage.permanentGet(StorageKey.MARKED_FEATURES)) || {};

    // 直接导入数据，新版 API 内部会处理数据验证
    if (Object.keys(entityVisibilityData).length > 0) {
      await this.adapter.entityController.importVisibility(entityVisibilityData);
    }
    if (Object.keys(featureMarkedData).length > 0) {
      await this.adapter.entityController.importMarked(featureMarkedData);
    }
  }

  public async saveEntityVisibilityToStorage(data: StorageData<EntityVisibility>) {
    return await this.storage.permanentSet(StorageKey.LAYERS_VISIBILITY, data);
  }

  public async saveFeatureMarkedToStorage(data: StorageData<FeatureMarked>) {
    return await this.storage.permanentSet(StorageKey.MARKED_FEATURES, data);
  }

  /**
   * 使用 MobX autorun 监听数据变化并自动保存
   */
  private initAutoSaveReaction() {
    // 监听可见性数据变化
    const visibilityDispose = autorun(() => {
      const visibilityData = JSON.stringify(this.adapter.entityController.dataManager.visibilityData);
      this.debouncedSaveVisibility(visibilityData);
    });

    // 监听标记数据变化
    const markedDispose = autorun(() => {
      const markedData = JSON.stringify(this.adapter.entityController.dataManager.markedData);
      this.debouncedSaveMarked(markedData);
    });

    this.reactionDisposers.push(visibilityDispose, markedDispose);
  }

  /**
   * 防抖保存可见性数据
   */
  private debouncedSaveVisibility = debounce((_serializedData: string) => {
    const visibilityData = this.adapter.entityController.dataManager.visibilityData;
    this.saveEntityVisibilityToStorage(visibilityData);
  }, DEBOUNCE_INTERVAL);

  /**
   * 防抖保存标记数据
   */
  private debouncedSaveMarked = debounce((_serializedData: string) => {
    const markedData = this.adapter.entityController.dataManager.markedData;
    this.saveFeatureMarkedToStorage(markedData);
  }, DEBOUNCE_INTERVAL);

  /**
   * 清理资源
   */
  public dispose() {
    this.reactionDisposers.forEach((dispose) => dispose());
    this.reactionDisposers = [];
  }
}
