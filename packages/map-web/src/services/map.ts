import {
  EndfieldMapAdapter,
  type EntityInfoDataJson,
  type EntityJsonDataList,
  type MapDataJson,
} from '@endfieldmap/map-core';
import { logger } from '@endfieldmap/tools';
import { service } from '@/services';
import { LoadingStageId } from '@/const/loading';
import { initCursorEventListeners } from '@/services/cursor';
import { StorageService } from '@/services/data/storage';
import { MapDataService } from '@/services/data/map';
import { isDev } from '@/services/env';
import { initActiveFeatureEventListeners } from '@/services/features/active_feature';
import { initHoverFeatureEventListeners } from '@/services/features/hover_feature';
import { initContextMenuEventListeners } from '@/services/context_menu';
import { loadingManager } from '@/services/loading';
import { sentryReporter } from '@/services/logger';

const assets = service.assetService.url;

const translateAreaName = (name: string): string => {
  return service.i18nService.translate(name, { ns: 'lang', defaultValue: name });
};

export class MapService {
  public adapter: EndfieldMapAdapter | null = null;
  public mapDataService: MapDataService | null = null;
  public initPromise: Promise<{ adapter: EndfieldMapAdapter; mapDataService: MapDataService } | undefined> | null =
    null;
  public mapData: MapDataJson | null = null;

  public static instance: MapService | null = null;

  private constructor(public container: HTMLElement) {
    // TODO: 后面删掉，部署无妨
    // @ts-expect-error 方便线上调试用
    window.mapService = this;
  }

  public static getInstance(container: HTMLElement) {
    if (MapService.instance) return MapService.instance;
    MapService.instance = new MapService(container);
    return MapService.instance;
  }

  async init() {
    if (this.initPromise) return this.initPromise;
    this.initPromise = this._init();
    return this.initPromise;
  }

  private async loadMapData(retry_times: number = 0): Promise<MapDataJson> {
    try {
      const mapData = await service.jsonLoader.loadJSON<MapDataJson>(`${assets.mapData}/map_data.json`);
      if (mapData) return mapData;
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

  private async loadEntityData(retry_times: number = 0): Promise<[EntityJsonDataList, EntityInfoDataJson]> {
    try {
      const [jsonData, infoData] = await Promise.all([
        service.jsonLoader.loadJSON<EntityJsonDataList>(`${assets.entityData}/level_entities_categorized.json`),
        service.jsonLoader.loadJSON<EntityInfoDataJson>(`${assets.entityData}/entity_info.json`),
      ]);
      if (jsonData && infoData) return [jsonData, infoData];
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

  private async _init() {
    try {
      await service.init();
      await StorageService.initStorage();

      const [mapData, [entityJsonData, entityInfoData]] = await Promise.all([
        this.loadMapData(),
        this.loadEntityData(),
      ]);
      this.mapData = mapData;
      // LOADING 初始化数据服务
      loadingManager.updateStageProgress(LoadingStageId.STORAGE, 10);
      // LOADING
      loadingManager.completeStage(LoadingStageId.STORAGE);

      // LOADING
      loadingManager.updateStageProgress(LoadingStageId.MAP_ADAPTER, 20);

      this.adapter = new EndfieldMapAdapter({
        container: this.container,
        data: this.mapData,
        asset: assets,
        consolaReporter: sentryReporter,
        isDev: isDev,
      });

      // 注入实体数据
      this.adapter.entityController.loadData(entityJsonData, entityInfoData);

      this.adapter.areaNameController.registerNameFunction(translateAreaName);

      // 初始化鼠标指针样式监听器
      initCursorEventListeners(this.adapter);

      // LOADING
      loadingManager.completeStage(LoadingStageId.MAP_ADAPTER);

      loadingManager.updateStageProgress(LoadingStageId.MAP_RENDER, 10);
      this.mapDataService = await MapDataService.createInstance(this.adapter!, service.jsonLoader);
      loadingManager.completeStage(LoadingStageId.MAP_RENDER);
      loadingManager.completeStage(LoadingStageId.ENTITY_RENDER);
      // 初始化激活feature事件监听器，用于设置和清除激活的feature
      initActiveFeatureEventListeners(this.adapter!, this.mapDataService);

      // 初始化激活feature事件监听器，用于设置和清除激活的feature
      initContextMenuEventListeners(this.adapter!, this.mapDataService);

      // 初始化hover事件监听器，用于设置和清除hover的feature
      initHoverFeatureEventListeners(this.adapter!, this.mapDataService);
      return {
        adapter: this.adapter,
        mapDataService: this.mapDataService,
      };
    } catch (e) {
      loadingManager.setError(e as Error);
      logger.error('加载错误', e);
    }
  }
}
