import { EndfieldMapAdapter } from '@endfieldmap/map-adapter-ol';
import { logger } from '@endfieldmap/tools';

import { LoadingStageId } from '@/const/loading';
import { service } from '@/services';
import { initContextMenuEventListeners } from '@/services/context_menu';
import { initCursorEventListeners } from '@/services/cursor';
import { StorageService } from '@/services/data/storage';
import { isDev } from '@/services/env';
import { initActiveFeatureEventListeners } from '@/services/features/active_feature';
import { initHoverFeatureEventListeners } from '@/services/features/hover_feature';
import { loadingManager } from '@/services/loading';
import { sentryReporter } from '@/services/logger';
import { initServiceEventBridge } from '@/services/service_event_bridge';

const assets = service.assetService.url;

const translateAreaName = (name: string): string => {
  return service.i18nService.translate(name, { ns: 'lang', defaultValue: name });
};

export class MapService {
  public adapter: EndfieldMapAdapter | null = null;
  public initPromise: Promise<{ adapter: EndfieldMapAdapter } | undefined> | null =
    null;

  constructor(public container: HTMLElement) {
    // TODO: 后面删掉，部署无妨
    // @ts-expect-error 方便线上调试用
    window.mapService = this;
  }
  async init() {
    if (this.initPromise) return this.initPromise;
    this.initPromise = this._init();
    return this.initPromise;
  }

  private async _init(): Promise<{ adapter: EndfieldMapAdapter } | undefined> {
    try {
      initServiceEventBridge();
      await service.init();
      await StorageService.initStorage();

      await service.dataService.mapDataService.initData();
      
      const { mapData, entityData } = service.dataService.mapDataService;

      if (!mapData || !entityData) {
        throw new Error('加载地图数据或实体数据失败');
      }

      // LOADING 初始化数据服务
      loadingManager.updateStageProgress(LoadingStageId.STORAGE, 10);
      // LOADING
      loadingManager.completeStage(LoadingStageId.STORAGE);

      // LOADING
      loadingManager.updateStageProgress(LoadingStageId.MAP_ADAPTER, 20);

      this.adapter = new EndfieldMapAdapter({
        container: this.container,
        data: mapData,
        asset: assets,
        consolaReporter: sentryReporter,
        isDev: isDev,
      });

      service.registerAdapter(this.adapter);

      // 注入实体数据
      this.adapter.entityController.loadData(entityData[0], entityData[1]);

      this.adapter.areaNameController.registerNameFunction(translateAreaName);

      // 初始化鼠标指针样式监听器
      initCursorEventListeners(this.adapter);

      // LOADING
      loadingManager.completeStage(LoadingStageId.MAP_ADAPTER);

      loadingManager.updateStageProgress(LoadingStageId.MAP_RENDER, 10);
      loadingManager.completeStage(LoadingStageId.MAP_RENDER);
      loadingManager.completeStage(LoadingStageId.ENTITY_RENDER);
      // 初始化激活feature事件监听器，用于设置和清除激活的feature
      initActiveFeatureEventListeners(this.adapter!);

      // 初始化激活feature事件监听器，用于设置和清除激活的feature
      initContextMenuEventListeners(this.adapter!);

      // 初始化hover事件监听器，用于设置和清除hover的feature
      initHoverFeatureEventListeners(this.adapter!);
      return {
        adapter: this.adapter,
      };
    } catch (e) {
      loadingManager.setError(e as Error);
      logger.error('加载错误', e);
    }
  }
}
