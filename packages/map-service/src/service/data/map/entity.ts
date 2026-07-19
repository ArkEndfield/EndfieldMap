import type { EntityData, MapData } from '@endfieldmap/map-core';
import type { IEntityMarkService } from '@endfieldmap/map-service/@types/preset_base';
import { AdapterRegistry } from '@endfieldmap/map-service/service/adapter_registry';

export interface IEntityVisibilityService {
  getAllMapVisibilityData(): Promise<{ mapId: string; entityKey: string; visible: boolean }[]>;
  addSubscribe(callback: (mapId: string, entityKey: string, visible: boolean) => void): void;
  setVisibilityData(mapId: string, entityKey: string, visible: boolean): Promise<unknown>;
  clearAllData(): void;
}

export interface EntityDataServiceDeps {
  adapterRegistry: AdapterRegistry;
  entityMarkService: IEntityMarkService;
  entityVisibilityService: IEntityVisibilityService;
}

/**
 * 实体数据管理器
 */
export class EntityDataService {
  private deps: EntityDataServiceDeps;

  constructor(deps: EntityDataServiceDeps) {
    this.deps = deps;
  }

  public async init() {
    await this.initFromStorage();
  }

  public async initFromStorage() {
    const markData = await this.deps.entityMarkService.getAllMapMarkData();
    const visibilityData = await this.deps.entityVisibilityService.getAllMapVisibilityData();

    if (visibilityData.length > 0) {
      await this.deps.adapterRegistry.adapter.entityController.importVisibility(visibilityData);
    }
    if (markData.length > 0) {
      await this.deps.adapterRegistry.adapter.entityController.importMarked(markData);
    }
    this.initSubscriptions();
  }

  private initSubscriptions() {
    this.deps.entityMarkService.addSubscribe((mapId, id, marked) => {
      this.deps.adapterRegistry.adapter.entityController.setMarked(mapId, id, marked);
    });

    this.deps.entityVisibilityService.addSubscribe((mapId, entityKey, visible) => {
      this.deps.adapterRegistry.adapter.entityController.setGroupVisibility(mapId, entityKey, visible);
    });
  }

  public markEntity(mapId: MapData['id'], id: EntityData['levelLogicId'], marked: boolean) {
    this.deps.adapterRegistry.adapter.entityController.setMarked(mapId, id, marked);
    this.deps.entityMarkService.setMarkData(mapId, id, marked);
  }

  /** 批量标记：controller 逐个更新（同步、廉价），持久化走一次 bulkUpsert，避免整组标记时逐条读写 DB */
  public markEntities(mapId: MapData['id'], ids: EntityData['levelLogicId'][], marked: boolean) {
    ids.forEach((id) => {
      this.deps.adapterRegistry.adapter.entityController.setMarked(mapId, id, marked);
    });
    this.deps.entityMarkService.setMarkDataBulk(mapId, ids, marked);
  }

  public setEntityGroupVisibility(mapId: MapData['id'], entityKey: EntityData['entityDataIdKey'], visible: boolean) {
    this.deps.adapterRegistry.adapter.entityController.setGroupVisibility(mapId, entityKey, visible);
    this.deps.entityVisibilityService.setVisibilityData(mapId, entityKey, visible);
  }

  public resetAllVisibility() {
    this.deps.entityVisibilityService.clearAllData();
  }

  public dispose() {
    // subscriptions are managed by the mark/visibility services' lifecycle
  }
}
