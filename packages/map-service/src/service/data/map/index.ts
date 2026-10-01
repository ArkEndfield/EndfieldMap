import type { EntityInfoDataJson, EntityJsonDataList, MapDataJson } from '@endfieldmap/map-core';
import type { DataInstance } from '@endfieldmap/map-core/types/event';
import { AdapterRegistry } from '@endfieldmap/map-service/service/adapter_registry';
import type { AssetService } from '@endfieldmap/map-service/service/asset';
import { CustomPointDataService } from '@endfieldmap/map-service/service/data/map/custom_point';
import { ElectricPoleDataService } from '@endfieldmap/map-service/service/data/map/electric_pole';
import { EntityDataService } from '@endfieldmap/map-service/service/data/map/entity';
import { GridTiersDataService } from '@endfieldmap/map-service/service/data/map/grid_tiers';
import { MapStateDataService } from '@endfieldmap/map-service/service/data/map/map_state';
import { RouteDataService } from '@endfieldmap/map-service/service/data/map/route';
import type { I18nService } from '@endfieldmap/map-service/service/i18n';
import { PresetService } from '@endfieldmap/map-service/service/preset_service';
import { serviceEmitter } from '@endfieldmap/map-service/service/service_emitter';
import { SERVICE_EVENT } from '@endfieldmap/map-service/service/service_emitter';
import type { SklandRouteService } from '@endfieldmap/map-service/service/skland_route';
import type { UserService } from '@endfieldmap/map-service/service/user';
import { type JSONLoader, logger } from '@endfieldmap/tools';

export interface MapDataServiceDeps<T, R> {
  i18nService: I18nService;
  assetService: AssetService;
  presetService: PresetService;
  jsonLoader: JSONLoader;
  adapterRegistry: AdapterRegistry;
  userService: UserService<T, R>;
  sklandRouteService: SklandRouteService;
}

/**
 * 地图数据服务
 */
export class MapDataService<T, R> {
  private readonly jsonLoader: JSONLoader;
  private readonly deps: MapDataServiceDeps<T, R>;

  public entityDataService: EntityDataService;
  public electricPoleDataService: ElectricPoleDataService;
  public customPointDataService: CustomPointDataService;
  public routeDataService: RouteDataService<T, R>;
  public mapStateDataService: MapStateDataService;
  public gridTiersDataService: GridTiersDataService;

  public mapData: MapDataJson | null = null;
  public entityData: [EntityJsonDataList, EntityInfoDataJson] | null = null;

  constructor(deps: MapDataServiceDeps<T, R>) {
    const { userService, i18nService, presetService, jsonLoader, adapterRegistry } = deps;
    this.jsonLoader = jsonLoader;
    this.deps = deps;
    const baseDeps = {
      adapterRegistry,
      i18nService,
      isUserLoggedIn: () => userService.auth.isLogin,
    };

    this.entityDataService = new EntityDataService({
      adapterRegistry,
      entityMarkService: userService.data.entityMarkService,
      entityVisibilityService: userService.data.entityVisibilityService,
    });
    this.electricPoleDataService = new ElectricPoleDataService({
      ...baseDeps,
      electricPoleVisibilityService: userService.data.electricPoleVisibilityService,
      electricPolePresetDataService: userService.data.electricPolePresetDataService,
      presetService: presetService,
    });
    this.customPointDataService = new CustomPointDataService({
      ...baseDeps,
      customPointVisibilityService: userService.data.customPointVisibilityService,
      customPointPresetDataService: userService.data.customPointPresetDataService,
      presetService: presetService,
    });
    this.routeDataService = new RouteDataService({
      adapterRegistry,
      i18nService,
      routeUserDataService: userService.data.routeUserDataService,
      sklandRouteService: deps.sklandRouteService,
    });

    this.mapStateDataService = new MapStateDataService(adapterRegistry);
    this.gridTiersDataService = new GridTiersDataService(this.jsonLoader, adapterRegistry, deps.assetService);
  }

  public async init() {
    const initTasks = [
      () => this.entityDataService.init(),
      () => this.electricPoleDataService.init(),
      () => this.customPointDataService.init(),
      () => this.routeDataService.init(),
      () => this.gridTiersDataService.init(),
      () => this.mapStateDataService.init(),
    ];

    const totalTasks = initTasks.length;
    let completedTasks = 0;

    const trackedPromises = initTasks.map((task) =>
      task().then((result) => {
        completedTasks++;
        const progress = 10 + (completedTasks / totalTasks) * 80;
        serviceEmitter.fire(SERVICE_EVENT.LOADING_PROGRESS, {
          stageId: 'MAP_RENDER',
          progress,
        });
        return result;
      })
    );

    await Promise.all(trackedPromises);
  }

  public async initData() {
    await Promise.all([
      this.loadMapData(),
      this.loadEntityData(),
    ]);
  }

  public stopAllOperation() {
    this.customPointDataService.stopAllOperation();
    this.electricPoleDataService.stopAllOperation();
    this.routeDataService.stopAllOperation();
  }

  /**
   * 移动到指定 entity
   * @param entityId entity的id
   * @param autoToggleVisible 是否自动将该类entity设为visible（如果用户筛选entity的时候取消了显示，就自动打开，可选，默认为true）
   * @param autoSetActive 是否将该entity设为 active_feature（这样就会自动打开弹窗，可选，默认为false）
   * @param animationTime 移动视图animate的时间（可选，默认为1s）
   * @param zoom 是否同时调整缩放（默认为undefined，即没有值，如果有值就同时设置缩放）
   */
  public async moveToEntity(
    entityId: string | number,
    autoToggleVisible: boolean = true,
    autoSetActive: boolean = false,
    animationTime: number = 1000,
    zoom?: number
  ): Promise<boolean> {
    const id = typeof entityId === 'string' ? parseInt(entityId, 10) : entityId;
    if (isNaN(id)) {
      logger.warn('[MapDataService] Invalid entity ID:', entityId);
      return false;
    }

    const adapter = this.deps.adapterRegistry.adapter;
    if (!adapter) return false;

    // 通过注册表在所有已注册实体类型中搜索
    const mapIds = adapter.mapController.dataManager.mapIds;
    const targetInstance = adapter.entityRegistry.searchById(mapIds, id);

    if (!targetInstance) {
      logger.warn(`[moveToEntity] Entity ${id} not found.`);
      return false;
    }

    await this.moveToEntityInstance(targetInstance, autoToggleVisible, autoSetActive, animationTime, zoom);
    return true;
  }

  /**
   * 移动到指定 entity 实例
   * @param instance entity实例
   * @param autoToggleVisible 是否自动将该类entity设为visible（如果用户筛选entity的时候取消了显示，就自动打开，可选，默认为true）
   * @param autoSetActive 是否将该entity设为 active_feature（这样就会自动打开弹窗，可选，默认为false）
   * @param animationTime 移动视图animate的时间（可选，默认为1s）
   * @param zoom 是否同时调整缩放（默认为undefined，即没有值，如果有值就同时设置缩放）
   */
  public async moveToEntityInstance(
    instance: DataInstance,
    autoToggleVisible: boolean = true,
    autoSetActive: boolean = false,
    animationTime: number = 1000,
    zoom?: number
  ) {
    const targetMapId = instance.mapId;
    const adapter = this.deps.adapterRegistry.adapter;

    // 切换地图
    if (this.mapStateDataService.currentMap.value !== targetMapId) {
      this.mapStateDataService.setCurrentMap(targetMapId);
    }

    // 自动切换可见性
    if (autoToggleVisible) {
      if (instance.entityType === '#ElectricPole') {
        this.electricPoleDataService.changeVisibility(true);
        this.electricPoleDataService.changeZoneVisibility(true);
      } else if (instance.entityType === '#CustomPoint') {
        this.customPointDataService.changeVisibility(true);
      } else {
        // ordinary entity
        const entityKey = 'entityDataIdKey' in instance ? instance.entityDataIdKey : undefined;
        if (entityKey) {
          this.entityDataService.setEntityGroupVisibility(instance.mapId, entityKey, true);
        }
      }
    }

    // 自动激活特征
    if (autoSetActive && adapter) {
      adapter.activeFeatureController.setActiveFeature(instance);
    }

    // 移动地图
    const center = instance.coordinates;
    if (center && adapter) {
      const view = adapter.mapController.view;
      if (view) {
        if (zoom !== undefined) {
          this.mapStateDataService.setMapZoom(targetMapId, zoom);
        }
        view.animate({
          center,
          zoom: zoom ?? view.getZoom(),
          duration: animationTime,
        });
      }
    }
  }

  private async loadMapData(retry_times: number = 0): Promise<void> {
    try {
      const mapData = await this.jsonLoader.loadJSON<MapDataJson>(`${this.deps.assetService.url.mapData}/map_data.json`);
      if (mapData) {
        this.mapData = mapData;
        return;
      }
      throw new Error('加载地图数据失败');
    } catch (error) {
      logger.error('加载地图数据失败', error);
      if (retry_times < 3) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return this.loadMapData(retry_times + 1);
      }
      throw error;
    }
  }

  private async loadEntityData(retry_times: number = 0): Promise<void> {
    try {
      const [jsonData, infoData] = await Promise.all([
        this.jsonLoader.loadJSON<EntityJsonDataList>(`${this.deps.assetService.url.entityData}/level_entities_categorized_with_region.json`),
        this.jsonLoader.loadJSON<EntityInfoDataJson>(`${this.deps.assetService.url.entityData}/entity_info.json`),
      ]);
      if (jsonData && infoData) {
        this.entityData = [jsonData, infoData];
        return;
      }
      throw new Error('加载实体数据失败');
    } catch (error) {
      logger.error('加载实体数据失败', error);
      if (retry_times < 3) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return this.loadEntityData(retry_times + 1);
      }
      throw error;
    }
  }
}
