import { Disposer } from '@endfieldmap/map-core/commom/disposer';
import { MAP_EVENT } from '@endfieldmap/map-core/const/event';
import { MarkedFeatureFilterMode } from '@endfieldmap/map-core/const/map';
import { EntityMapDataManager } from '@endfieldmap/map-core/data/entity';
import { MapDataManager } from '@endfieldmap/map-core/data/map/map';
import mapEventEmitter from '@endfieldmap/map-core/event/emitter';
import { EntityRender } from '@endfieldmap/map-core/render/renderer/entity/entity';
import type {
  Category,
  EntityData,
  EntityInfoDataJson,
  EntityJsonDataList,
  MapData,
} from '@endfieldmap/map-core/types';
import type { EntityVisibility, FeatureMarked, StorageData } from '@endfieldmap/map-core/types/data';
import { action, reaction } from 'mobx';

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

  constructor() {
    super();
    this.dataManager = new EntityMapDataManager();
    this.render = new EntityRender(this.dataManager);

    this.registerEventHandlers();
  }

  /**
   * 注册事件处理器
   */
  private registerEventHandlers(): void {
    const mapDataManager = MapDataManager.getInstance();
    // 监听缩放变化
    mapEventEmitter.on(MAP_EVENT.ZOOM_CHANGE, (zoom) => {
      this.currentZoom = zoom;
      this.updateClusterDistance();
    });

    // 监听地图切换
    this.disposers.push(
      reaction(
        () => mapDataManager.currentMapId,
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

  // #region 可见性操作

  /**
   * 显示实体
   */
  public showEntity(entityDataIdKey: string) {
    const manager = this.dataManager.currentGroupManagers.find((m) => m.entityDataIdKey === entityDataIdKey);
    if (!manager) return;

    manager.setGroupVisible(true);
  }

  public hideCategoryEntities(category: Category) {
    const manager = this.dataManager.currentGroupManagers.find((m) => m.entityDataIdKey === category);
    if (!manager) return;

    manager.setGroupVisible(false);
  }

  public showCategoryEntities(category: Category) {
    const manager = this.dataManager.currentGroupManagers.find((m) => m.entityDataIdKey === category);
    if (!manager) return;

    manager.setGroupVisible(true);
  }

  public toggleEntityVisible(entityDataIdKey: EntityData['entityDataIdKey']) {
    const manager = this.dataManager.currentGroupManagers.find((m) => m.entityDataIdKey === entityDataIdKey);
    if (!manager) return;

    manager.setGroupVisible(!manager.groupVisible);
  }

  public hideAllEntities() {
    this.dataManager.currentGroupManagers.forEach((manager) => {
      manager.setGroupVisible(false);
    });
  }
  // #endregion

  // #region Marked过滤

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
  // #endregion

  // #region 数据导入导出
  /**
   * 导入可见性数据
   */
  public async importVisibility(data: StorageData<EntityVisibility>): Promise<number> {
    // this.pendingVisibility = data;
    // 转换为data manager期望的类型
    const fullData: Record<MapData['id'], Record<string, boolean>> = {} as Record<
      MapData['id'],
      Record<string, boolean>
    >;
    for (const [key, value] of Object.entries(data)) {
      if (value) {
        fullData[key as MapData['id']] = value;
      }
    }
    return this.dataManager.importVisibilityData(fullData);
  }

  /**
   * 导入标记数据
   */
  public async importMarked(data: StorageData<FeatureMarked>): Promise<number> {
    // this.pendingMarked = data;
    // 转换为data manager期望的类型
    const fullData: Record<MapData['id'], Record<number, boolean>> = {} as Record<
      MapData['id'],
      Record<number, boolean>
    >;
    for (const [key, value] of Object.entries(data)) {
      if (value) {
        fullData[key as MapData['id']] = value;
      }
    }
    return this.dataManager.importMarkedData(fullData);
  }
  // #endregion
}
