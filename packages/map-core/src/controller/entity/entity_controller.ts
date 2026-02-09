import { Disposer } from '@endfieldmap/map-core/commom/disposer';
import { MAP_EVENT } from '@endfieldmap/map-core/const/event';
import { MarkedFeatureFilterMode } from '@endfieldmap/map-core/const/map';
import { EntityMapDataManager } from '@endfieldmap/map-core/data/entity';
import type { EndfieldMapAsset } from '@endfieldmap/map-core/data/asset';
import type { MapDataManager } from '@endfieldmap/map-core/data/map/map';
import type { EndfieldMapEmitter } from '@endfieldmap/map-core/event/emitter';
import type { EndfieldMap } from '@endfieldmap/map-core/render/olmap';
import { EntityRender } from '@endfieldmap/map-core/render/renderer/entity/entity';
import type { EntityData, EntityInfoDataJson, EntityJsonDataList, MapData } from '@endfieldmap/map-core/types';
import { action, reaction } from 'mobx';

export interface EntityControllerConfig {
  mapDataManager: MapDataManager;
  mapInstance: EndfieldMap;
  asset: EndfieldMapAsset;
  emitter: EndfieldMapEmitter;
}

/**
 * Entity控制器
 * 负责协调EntityDataManager和EntityRenderer
 * 提供给UI层访问数据的接口
 */
export class EntityController extends Disposer {
  /** 数据管理器 */
  public readonly dataManager: EntityMapDataManager;

  /** 当前缩放级别 */
  private currentZoom: number = 3;

  public render: EntityRender;

  private mapDataManager: MapDataManager;

  private emitter: EndfieldMapEmitter;

  constructor(config: EntityControllerConfig) {
    super();
    this.mapDataManager = config.mapDataManager;
    this.emitter = config.emitter;
    this.dataManager = new EntityMapDataManager(config.mapDataManager);
    this.render = new EntityRender({
      dataManager: this.dataManager,
      mapDataManager: config.mapDataManager,
      mapInstance: config.mapInstance,
      asset: config.asset,
    });

    this.registerEventHandlers();
  }

  /**
   * 注册事件处理器
   */
  private registerEventHandlers(): void {
    // 监听缩放变化
    this.emitter.on(MAP_EVENT.ZOOM_CHANGE, (zoom) => {
      this.currentZoom = zoom;
      this.updateClusterDistance();
    });

    // 监听地图切换
    this.disposers.push(
      reaction(
        () => this.mapDataManager.currentMapId,
        async () => {
          // load data
          if (!this.dataManager.dataLoaded) {
            // data not loaded, wait or ignore
            return;
          }
          this.render.render();

          // 应用marked过滤模式
          this.applyMarkedFilterMode();

          // 更新聚合距离
          this.updateClusterDistance(true);
        },
        { fireImmediately: true }
      )
    );
  }

  public loadData(jsonData: EntityJsonDataList, infoData: EntityInfoDataJson) {
    this.dataManager.loadData(jsonData, infoData);
    this.render.render();
    this.applyMarkedFilterMode();
    this.updateClusterDistance(true);
  }

  /**
   * 是否应该启用聚合
   */
  private shouldCluster(zoom: number): boolean {
    return !this.dataManager.disableCluster && zoom < 4;
  }

  /**
   * 更新聚合距离
   */
  private updateClusterDistance(force: boolean = false): void {
    const shouldCluster = this.shouldCluster(this.currentZoom);
    const newDistance = shouldCluster ? this.dataManager.clusterDistance : 0;

    if (force || newDistance !== this.dataManager.lastClusterDistance) {
      this.dataManager.lastClusterDistance = newDistance;
      this.render.setClusterDistance(newDistance);
    }
  }

  /**
   * 设置是否启用聚合
   */
  public setClusterEnable(enable: boolean): void {
    const newDisableCluster = !enable;
    if (this.dataManager.disableCluster === newDisableCluster) {
      return;
    }
    this.dataManager.setDisableCluster(newDisableCluster);
    this.updateClusterDistance();
  }

  /**
   * 应用marked过滤模式到渲染器
   */
  private applyMarkedFilterMode(): void {
    this.render.updateMarkedFilterMode(this.dataManager.markedFilterMode);
  }

  /**
   * 设置Marked
   */
  public setMarked(mapId: MapData['id'], levelLogicId: EntityData['levelLogicId'], marked: boolean): void {
    this.dataManager.setMarked(mapId, levelLogicId, marked);
  }

  /**
   * 设置实体组可见性
   */
  public setVisibility(mapId: MapData['id'], entityKey: EntityData['entityDataIdKey'], visible: boolean): void {
    this.dataManager.setVisibility(mapId, entityKey, visible);
  }

  /**
   * 设置marked过滤模式
   */
  @action
  public setMarkedFilterMode(mode: MarkedFeatureFilterMode): void {
    if (this.dataManager.markedFilterMode === mode) {
      return;
    }
    this.dataManager.setMarkedFilterMode(mode);

    // 应用到当前渲染器
    this.applyMarkedFilterMode();
  }

  // #region 数据导入导出
  /**
   * 导入可见性数据
   */
  public async importVisibility(
    data: {
      entityKey: EntityData['entityDataIdKey'];
      mapId: MapData['id'];
      visible: boolean;
    }[]
  ): Promise<number> {
    let count = 0;
    for (const item of data) {
      this.dataManager.setVisibility(item.mapId, item.entityKey, item.visible);
      count++;
    }
    return count;
  }

  public async importMarked(
    data: {
      entityId: EntityData['levelLogicId'];
      mapId: MapData['id'];
      marked: boolean;
    }[]
  ): Promise<number> {
    let count = 0;
    for (const item of data) {
      this.dataManager.setMarked(item.mapId, item.entityId, item.marked);
      if (item.marked) {
        count++;
      }
    }
    return count;
  }
  // #endregion
}
