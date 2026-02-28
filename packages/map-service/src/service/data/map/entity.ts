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
    this.deps.entityMarkService.addScribe((mapId, id, marked) => {
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
