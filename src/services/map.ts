import { EndfieldMapAdapter, type MapDataJson } from '@endfieldmap/map-core';
import { logger } from '@endfieldmap/tools';

import { LoadingStageId } from '@/const/loading';
import { initActiveFeatureEventListeners } from '@/services/active_feature';
import { initCursorEventListeners } from '@/services/cursor';
import { DataService } from '@/services/data';
import { isDev } from '@/services/env';
import { initHoverFeatureEventListeners } from '@/services/hover_feature';
import { loadingManager } from '@/services/loading';
import { sentryReporter } from '@/services/logger';
import { getAssetUrls } from '@/utils/url';

// const MOCK_MAP_DATA: MapDataJson = {
//   version: '1.0.0',
//   data: [
//     {
//       id: 'map01',
//       name: '四号谷地',
//       center: { x: -224, y: 0, z: -64 },
//       scale: 8,
//       offset: { x: 128, y: 0, z: 144 },
//       electricZoneBaseSize: 10,
//       regions: [],
//       zoom: {
//         default: DEFAULT_ZOOM,
//         min: DEFAULT_MIN_ZOOM,
//         max: DEFAULT_MAX_ZOOM,
//       },
//     },
//     {
//       id: 'map02',
//       name: '武陵',
//       center: { x: -1408, y: 0, z: -752 },
//       scale: 16,
//       offset: { x: 104, y: 0, z: 232 },
//       electricZoneBaseSize: 5,
//       regions: [],
//       zoom: {
//         default: DEFAULT_ZOOM,
//         min: DEFAULT_MIN_ZOOM,
//         max: DEFAULT_MAX_ZOOM,
//       },
//     },
//     {
//       id: 'dung01',
//       name: '谷地像差：蚀像寻遗',
//       center: { x: -80, y: 0, z: -80 },
//       scale: 8,
//       offset: { x: 64, y: 0, z: 176 },
//       electricZoneBaseSize: 0,
//       regions: [],
//       zoom: {
//         default: DEFAULT_ZOOM,
//         min: DEFAULT_MIN_ZOOM,
//         max: DEFAULT_MAX_ZOOM,
//       },
//     },
//   ],
// };

const assets = getAssetUrls();

export class MapService {
  public adapter: EndfieldMapAdapter | null = null;
  public dataService: DataService | null = null;
  public initPromise: Promise<{ adapter: EndfieldMapAdapter; dataService: DataService } | undefined> | null = null;
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
      const jsonLoader = DataService.jsonLoader;
      const mapData = await jsonLoader.loadJSON<MapDataJson>(`${assets.mapData}/map_data.json`);
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

  private async _init() {
    try {
      this.mapData = await this.loadMapData();
      // LOADING 初始化数据服务
      loadingManager.updateStageProgress(LoadingStageId.STORAGE, 10);
      await DataService.initStorage();
      // LOADING
      loadingManager.completeStage(LoadingStageId.STORAGE);

      // LOADING
      loadingManager.updateStageProgress(LoadingStageId.MAP_ADAPTER, 20);

      this.adapter = new EndfieldMapAdapter({
        container: this.container,
        data: this.mapData,
        asset: assets,
        jsonLoader: DataService.jsonLoader,
        consolaReporter: sentryReporter,
        isDev: isDev,
      });

      // 初始化鼠标指针样式监听器
      initCursorEventListeners(this.adapter);

      // LOADING
      loadingManager.completeStage(LoadingStageId.MAP_ADAPTER);

      loadingManager.updateStageProgress(LoadingStageId.MAP_RENDER, 10);
      this.dataService = await DataService.createInstance(this.adapter!);
      loadingManager.completeStage(LoadingStageId.MAP_RENDER);
      loadingManager.completeStage(LoadingStageId.ENTITY_RENDER);
      // 初始化激活feature事件监听器，用于设置和清除激活的feature
      initActiveFeatureEventListeners(this.adapter!, this.dataService);

      // 初始化hover事件监听器，用于设置和清除hover的feature
      initHoverFeatureEventListeners(this.adapter!, this.dataService);
      return {
        adapter: this.adapter,
        dataService: this.dataService,
      };
    } catch (e) {
      loadingManager.setError(e as Error);
      logger.error('加载错误', e);
    }
  }
}
