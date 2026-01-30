import { type EndfieldMapAdapter, type EntityData, type MapData } from '@endfieldmap/map-core';

import { userService } from '@/services/user';

/**
 * 实体数据管理器
 */
export class EntityDataService {
  private adapter: EndfieldMapAdapter;

  constructor(adapter: EndfieldMapAdapter) {
    this.adapter = adapter;
  }

  public async initFromStorage() {
    const markData = await userService.data.entityMarkService.getAllMapMarkData();
    const visibilityData = await userService.data.entityVisibilityService.getAllMapVisibilityData();

    // 导入可见性数据
    if (visibilityData.length > 0) {
      await this.adapter.entityController.importVisibility(visibilityData);
    }
    // 导入标记数据
    if (markData.length > 0) {
      await this.adapter.entityController.importMarked(markData);
    }
    this.initSubscriptions();
  }

  /**
   * 初始化数据订阅
   */
  private initSubscriptions() {
    // 订阅标记数据变化
    userService.data.entityMarkService.addScribe((mapId, id, marked) => {
      this.adapter.entityController.setMarked(mapId, id, marked);
    });

    // 订阅可见性数据变化
    userService.data.entityVisibilityService.addSubscribe((mapId, entityKey, visible) => {
      this.adapter.entityController.setVisibility(mapId, entityKey, visible);
    });
  }

  public markEntity(mapId: MapData['id'], id: EntityData['levelLogicId'], marked: boolean) {
    this.adapter.entityController.setMarked(mapId, id, marked);
    userService.data.entityMarkService.setMarkData(mapId, id, marked);
  }

  public setEntityGroupVisibility(mapId: MapData['id'], entityKey: EntityData['entityDataIdKey'], visible: boolean) {
    this.adapter.entityController.setVisibility(mapId, entityKey, visible);
    userService.data.entityVisibilityService.setVisibilityData(mapId, entityKey, visible);
  }

  public resetAllVisibility() {
    userService.data.entityVisibilityService.clearAllData();
  }

  /**
   * 清理资源
   */
  public dispose() {}
}
