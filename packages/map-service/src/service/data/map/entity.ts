import type { EntityData, MapData } from '@endfieldmap/map-core';
import type { IEntityMarkService } from '@endfieldmap/map-service/@types/preset_base';
import { AdapterRegistry } from '@endfieldmap/map-service/service/adapter_registry';
import type { I18nService } from '@endfieldmap/map-service/service/i18n';
import { SERVICE_EVENT, serviceEmitter } from '@endfieldmap/map-service/service/service_emitter';
import { logger } from '@endfieldmap/tools';

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
  i18nService: I18nService;
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

  /** 标记单个实体。返回持久化是否成功；失败时渲染已更新但会显式告警（刷新后丢失）。 */
  public async markEntity(
    mapId: MapData['id'],
    id: EntityData['levelLogicId'],
    marked: boolean
  ): Promise<boolean> {
    this.deps.adapterRegistry.adapter.entityController.setMarked(mapId, id, marked);
    try {
      await this.deps.entityMarkService.setMarkData(mapId, id, marked);
      return true;
    } catch (error) {
      this.reportMarkPersistFailure(error, 'markEntity');
      return false;
    }
  }

  /**
   * 批量标记：controller 逐个更新（同步、廉价），持久化走一次 bulkUpsert，避免整组标记时逐条读写 DB。
   * 返回持久化是否成功；失败时显式告警，不再无感知吞掉（弹窗/AI 应答报成功但落库失败）。
   */
  public async markEntities(
    mapId: MapData['id'],
    ids: EntityData['levelLogicId'][],
    marked: boolean
  ): Promise<boolean> {
    ids.forEach((id) => {
      this.deps.adapterRegistry.adapter.entityController.setMarked(mapId, id, marked);
    });
    try {
      await this.deps.entityMarkService.setMarkDataBulk(mapId, ids, marked);
      return true;
    } catch (error) {
      this.reportMarkPersistFailure(error, 'markEntities');
      return false;
    }
  }

  /** 渲染与内存已更新而落库失败时显式告警：刷新后本次标记会丢失，不能无感知吞掉 */
  private reportMarkPersistFailure(error: unknown, scope: string): void {
    logger.error('[EntityDataService] persist mark failed', { scope, error });
    serviceEmitter.fire(SERVICE_EVENT.ALERT_SHOW, {
      content: this.translate('error:entity.mark_persist_failed', {
        defaultValue: '标记保存失败，刷新后可能丢失本次标记，请重试。',
      }),
      hideCancel: true,
    });
  }

  private get translate() {
    return this.deps.i18nService.translate;
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
