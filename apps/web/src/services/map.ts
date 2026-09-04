import '@/services/logger';

import { EndfieldMapAdapter } from '@endfieldmap/map-adapter-ol';
import { logger } from '@endfieldmap/tools';
import { reaction } from 'mobx';

import { LoadingStageId } from '@/const/loading';
import { service } from '@/services';
import { initContextMenuEventListeners } from '@/services/context_menu';
import { initCursorEventListeners } from '@/services/cursor';
import { StorageService } from '@/services/data/storage';
import { isDev } from '@/services/env';
import { initActiveFeatureEventListeners } from '@/services/features/active_feature';
import { initHoverFeatureEventListeners } from '@/services/features/hover_feature';
import { initGroupContextMenu } from '@/services/group_context_menu';
import { loadingManager } from '@/services/loading';
import { initServiceEventBridge } from '@/services/service_event_bridge';
import { applyShareLinkParams, initShareLink } from '@/services/share_link';
import uiManager from '@/services/ui_manager';

const assets = service.assetService.url;

const translateAreaName = (name: string): string => {
  return service.i18nService.translate(name, { ns: 'lang', defaultValue: name });
};

/** 等主线程闲下来再跑，别和首屏渲染抢 CPU */
function whenIdle(callback: () => void): void {
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(() => callback(), { timeout: 5_000 });
  } else {
    setTimeout(callback, 1_000);
  }
}

// dev 构建暴露到 window 的调试手柄（console 里直接操作地图实例）。
declare global {
  interface Window {
    mapService?: MapService;
  }
}

export class MapService {
  public adapter: EndfieldMapAdapter | null = null;
  public initPromise: Promise<{ adapter: EndfieldMapAdapter } | undefined> | null = null;
  private eventDisposers: Array<() => void> = [];

  constructor(public container: HTMLElement) {
    if (isDev) {
      window.mapService = this;
    }
  }
  async init() {
    if (this.initPromise) return this.initPromise;
    this.initPromise = this._init();
    return this.initPromise;
  }

  private async _init(): Promise<{ adapter: EndfieldMapAdapter } | undefined> {
    try {
      initServiceEventBridge();

      // 地图 / 实体 JSON 只依赖网络，与数据库、i18n、本地迁移都无关。
      // 先并行发起，别再排在存储初始化后面白等（实测省下约 1.7s）。
      const mapDataReady = service.dataService.mapDataService.initData();
      // 在被 await 之前先兜住 rejection，避免上游先抛错时变成 unhandled rejection
      mapDataReady.catch(() => undefined);

      await service.init();
      loadingManager.updateStageProgress(LoadingStageId.STORAGE, 40);

      await StorageService.initStorage();
      loadingManager.updateStageProgress(LoadingStageId.STORAGE, 70);

      // 云端同步不进首屏关键路径。地图渲染只依赖本地 RxDB 数据，
      // 复制本身就是 live 增量推送，后端慢/冷启动时在这里 await 会把
      // 进度条卡在 STORAGE 段（用户看到的「卡 40%」），最长 10s+10s。
      // 顶栏用户名 / 云端标记随后台同步到达后由 mobx 自动刷新。
      if (service.userService.auth.isLogin) {
        void service.userService
          .updateUidList(false)
          .then(() => service.userService.data.syncService.awaitInitialReplication())
          .catch((syncError) => {
            logger.warn('[MapService] Sync init failed, continuing with cached data', syncError);
          });
      }

      // LOADING 存储与用户数据就绪
      loadingManager.completeStage(LoadingStageId.STORAGE);

      await mapDataReady;

      const { mapData, entityData } = service.dataService.mapDataService;

      if (!mapData || !entityData) {
        throw new Error('加载地图数据或实体数据失败');
      }

      // LOADING
      loadingManager.updateStageProgress(LoadingStageId.MAP_ADAPTER, 20);

      this.adapter = new EndfieldMapAdapter({
        container: this.container,
        data: mapData,
        asset: assets,
        isDev: isDev,
      });

      const adapterRegistered = service.registerAdapter(this.adapter);

      // LOADING 底图就绪，接下来是实体渲染（首屏最后一段重活）
      loadingManager.completeStage(LoadingStageId.MAP_ADAPTER);
      loadingManager.completeStage(LoadingStageId.MAP_RENDER);

      // 注入实体数据
      this.adapter.entityController.loadData(entityData[0], entityData[1]);

      // 分层功能开关同步到标点的分层角标
      this.eventDisposers.push(
        reaction(
          () => uiManager.enableTier.value,
          (enabled) => this.adapter!.entityController.setTierBadgeEnabled(enabled),
          { fireImmediately: true }
        )
      );

      // grid_tiers 数据在 registerAdapter 内异步注册，完成后刷新一次分层角标
      void adapterRegistered.then(() => this.adapter!.entityController.applyTierBadges());

      this.adapter.areaNameController.registerNameFunction(translateAreaName);
      // 按当前视图缩放同步一次区域名（避免初始缩放较小时仍显示详细名）
      this.adapter.renderAreaName();

      // 初始化鼠标指针样式监听器
      this.eventDisposers.push(initCursorEventListeners(this.adapter));

      loadingManager.completeStage(LoadingStageId.ENTITY_RENDER);
      // 初始化激活feature事件监听器，用于设置和清除激活的feature
      this.eventDisposers.push(initActiveFeatureEventListeners(this.adapter!));

      // 电线杆移动：需先进入移动模式，hover 到杆上 pointerdown 即拖拽，松手校验并持久化，失败则回退
      const electricPoleDataService = service.dataService.mapDataService.electricPoleDataService;
      this.adapter.initPoleDrag({
        canDragPole: () => electricPoleDataService.isMoving,
        onEnd: async (instance, newCoord) => {
          try {
            await electricPoleDataService.moveElectricPole(instance, newCoord);
          } catch {
            this.adapter!.revertPoleDrag();
          }
        },
      });

      // 初始化激活feature事件监听器，用于设置和清除激活的feature
      this.eventDisposers.push(initContextMenuEventListeners(this.adapter!));

      // 侧边栏分组右键菜单项（一键标记 / 跳转最近未标记点位）
      this.eventDisposers.push(initGroupContextMenu());

      // 初始化hover事件监听器，用于设置和清除hover的feature
      this.eventDisposers.push(initHoverFeatureEventListeners(this.adapter!));

      initShareLink();
      await applyShareLinkParams();

      // 首屏已经完成，趁空闲把弹窗要用的游戏静态数据表补进 IndexedDB。
      // 不 await：失败或未跑完时，读取方自己会触发加载。
      whenIdle(() => {
        void service.dataService.prefetchGameData();
      });

      return {
        adapter: this.adapter,
      };
    } catch (e) {
      loadingManager.setError(e as Error);
      logger.error('加载错误', e);
    }
  }
}
