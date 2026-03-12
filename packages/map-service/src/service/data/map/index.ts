import type { EntityInfoDataJson, EntityJsonDataList, MapDataJson } from '@endfieldmap/map-core';
import { AdapterRegistry } from '@endfieldmap/map-service/service/adapter_registry';
import type { AssetService } from '@endfieldmap/map-service/service/asset';
import { CustomPointDataService } from '@endfieldmap/map-service/service/data/map/custom_point';
import { ElectricPoleDataService } from '@endfieldmap/map-service/service/data/map/electric_pole';
import { EntityDataService } from '@endfieldmap/map-service/service/data/map/entity';
import { GridTiersDataService } from '@endfieldmap/map-service/service/data/map/grid_tiers';
import { MapStateDataService } from '@endfieldmap/map-service/service/data/map/map_state';
import type { I18nService } from '@endfieldmap/map-service/service/i18n';
import { PresetService } from '@endfieldmap/map-service/service/preset_service';
import { serviceEmitter } from '@endfieldmap/map-service/service/service_emitter';
import { SERVICE_EVENT } from '@endfieldmap/map-service/service/service_emitter';
import type { UserService } from '@endfieldmap/map-service/service/user';
import { type JSONLoader,logger } from '@endfieldmap/tools';

export interface MapDataServiceDeps<T, R> {
  i18nService: I18nService;
  assetService: AssetService;
  presetService: PresetService;
  jsonLoader: JSONLoader;
  adapterRegistry: AdapterRegistry;
  userService: UserService<T, R>;
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

    this.mapStateDataService = new MapStateDataService(adapterRegistry);
    this.gridTiersDataService = new GridTiersDataService(this.jsonLoader, adapterRegistry, deps.assetService);
  }

  public async init() {
    const initTasks = [
      () => this.entityDataService.init(),
      () => this.electricPoleDataService.init(),
      () => this.customPointDataService.init(),
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
