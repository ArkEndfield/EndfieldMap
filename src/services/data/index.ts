import {
  type EndfieldMapAdapter,
  type EntityVisibilityChangeEventDetail,
  type FeatureStateChangeEventDetail,
  MAP_EVENT,
  MarkedFeatureFilterMode,
} from '@endfieldmap/map-core';
import {
  type Coordinate,
  type DataState,
  debounce,
  getMapCenter,
  JSONLoader,
  LocalStorageDB,
  LocalStorageKey,
  MapIndex,
  StorageManager,
} from '@endfieldmap/tools';
import { action } from 'mobx';

import { DEBOUNCE_INTERVAL } from '@/const/data';
import { ChestRewardDataService } from '@/services/data/chest_reward';
import { CustomPointDataService } from '@/services/data/custom_point';
import { DungeonSeriesDataService } from '@/services/data/dungeon_series';
import { ElectricPoleDataService } from '@/services/data/electric_pole';
import { EntityDataService } from '@/services/data/entity';
import { GuideDataService } from '@/services/data/guide';
import { ItemDataService } from '@/services/data/item';

import { SwiperDataService } from './swiper';

/**
 * 数据服务
 */
class DataService {
  public storage: StorageManager;
  public jsonLoader: JSONLoader;
  public initialized: boolean = false;
  private adapter: EndfieldMapAdapter | null = null;

  public entityDataService: EntityDataService;
  public electricPoleDataService: ElectricPoleDataService;
  public customPointDataService: CustomPointDataService;
  public itemDataService: ItemDataService;
  public dungeonSeriesDataService: DungeonSeriesDataService;
  public chestRewardDataService: ChestRewardDataService;
  public guideDataService: GuideDataService;
  public swiperDataService: SwiperDataService;

  constructor() {
    this.storage = new StorageManager({
      name: 'endfieldmap',
      version: 1,
      description: 'EndfieldMap Storage',
    });
    this.jsonLoader = new JSONLoader({
      storage: this.storage,
    });
    this.entityDataService = new EntityDataService(this.storage);
    this.electricPoleDataService = new ElectricPoleDataService(this.storage);
    this.customPointDataService = new CustomPointDataService(this.storage);

    this.itemDataService = new ItemDataService(this.jsonLoader, this.storage);
    this.chestRewardDataService = new ChestRewardDataService(this.jsonLoader, this.storage, this.itemDataService);
    this.dungeonSeriesDataService = new DungeonSeriesDataService(
      this.jsonLoader,
      this.storage,
      this.chestRewardDataService
    );
    this.guideDataService = new GuideDataService(this.jsonLoader, this.storage);
    this.swiperDataService = new SwiperDataService();

    this.initDataServices();
  }

  private async initDataServices() {
    this.itemDataService.getItemData();
    this.chestRewardDataService.getRewardsData();
    this.dungeonSeriesDataService.getDungeonSeriesData();
    this.guideDataService.getGuidesData();
  }

  public async init() {
    if (this.initialized) return;
    await this.storage.init();
    await this.entityDataService.initFromStorage();
    // 初始化电线杆预设数据（仅从 Storage 读取，不依赖 adapter）
    await this.electricPoleDataService.initFromStorage();
    // 初始化自定义标点预设数据（仅从 Storage 读取，不依赖 adapter）
    await this.customPointDataService.initFromStorage();
    this.initialized = true;
  }

  public registerAdapter(adapter: EndfieldMapAdapter) {
    this.adapter = adapter;
    this.initDataEventListeners();
    // 注册 electric pole 适配器，并在内部应用当前预设数据
    this.electricPoleDataService.registerAdapter(adapter);
    // 注册 custom point 适配器，并在内部应用当前预设数据
    this.customPointDataService.registerAdapter(adapter);
  }

  public initDataEventListeners() {
    if (!this.adapter) return;
    this.adapter.event.on(MAP_EVENT.ENTITY_VISIBILITY_CHANGE, (event: EntityVisibilityChangeEventDetail) => {
      const currentMap = this.adapter!.currentMapIndex;
      for (const layer of event.layers) {
        this.entityDataService.updateEntityVisibility(currentMap, layer.entityDataIdKey, layer.visible);
      }
    });

    this.adapter.event.on(MAP_EVENT.FEATURE_STATE_CHANGE, (event: FeatureStateChangeEventDetail) => {
      const currentMap = this.adapter!.currentMapIndex;
      if (event.property === 'marked') {
        this.entityDataService.updateFeatureMarked(currentMap, event.feature.data.levelLogicId, event.newValue);
      }
    });

    this.adapter.event.on(
      MAP_EVENT.ZOOM_CHANGE,
      debounce((zoom: number) => {
        const currentMap = this.adapter!.currentMapIndex;
        this.setMapZoom(currentMap, zoom);
      }, DEBOUNCE_INTERVAL)
    );

    this.adapter.event.on(
      MAP_EVENT.MAP_CENTER_CHANGE,
      debounce((center?: Coordinate) => {
        if (!center) return;
        const currentMap = this.adapter!.currentMapIndex;
        this.setMapCenter(currentMap, center);
      }, DEBOUNCE_INTERVAL)
    );
  }

  /**
   * 设置地图视图中心点
   * @param mapIndex 地图id
   * @param center 中心点
   */
  public setMapCenter(mapIndex: MapIndex, center: Coordinate) {
    const originData =
      LocalStorageDB.get<DataState<Coordinate>>(LocalStorageKey.MAP_VIEW_STATE) || ({} as DataState<Coordinate>);
    originData[mapIndex] = center;
    LocalStorageDB.set(LocalStorageKey.MAP_VIEW_STATE, originData);
  }

  /**
   * 设置地图缩放级别
   * @param mapIndex 地图id
   * @param zoom 缩放级别
   */
  public setMapZoom(mapIndex: MapIndex, zoom: number) {
    const originData = LocalStorageDB.get<DataState<number>>(LocalStorageKey.MAP_ZOOM) || ({} as DataState<number>);
    originData[mapIndex] = zoom;
    LocalStorageDB.set(LocalStorageKey.MAP_ZOOM, originData);
  }

  /**
   * 设置是否开启调整视图防止超出屏幕
   * @param adjust 是否开启
   */
  @action
  public setAdjustView(adjust: boolean) {
    this.adapter?.mapController.mapRenderer.setAdjustView(adjust);
    LocalStorageDB.set(LocalStorageKey.MAP_ADJUST_VIEW, adjust);
  }

  /**
   * 设置当前查看的地图
   * @param mapIndex 地图id
   */
  public setCurrentMap(mapIndex: MapIndex) {
    LocalStorageDB.set(LocalStorageKey.MAP_CURRENT_MAP, mapIndex);
  }

  /**
   * 设置是否开启聚合
   * @param enable 是否开启
   */
  public setEnableCluster(enable: boolean) {
    this.adapter?.setClusterEnable(enable);
    LocalStorageDB.set(LocalStorageKey.CLUSTER_ENABLED, enable);
  }

  /**
   * 设置鼠标悬停检测响应时间
   * @param time 响应时间，单位毫秒，-1表示禁用悬停检测
   */
  @action
  public setHoverTime(time: number) {
    if (time === -1) {
      this.adapter?.setHoverFeatureEnable(false);
      this.adapter?.setHoverDebounceTime(0);
    } else {
      if (!this.adapter?.enableHover) {
        this.adapter?.setHoverFeatureEnable(true);
      }
      this.adapter?.setHoverDebounceTime(time);
    }
    LocalStorageDB.set(LocalStorageKey.HOVER_TIME, time);
  }

  /**
   * 设置标记筛选模式
   * @param filterMode 筛选模式
   */
  public setFilterMarkedMode(filterMode: MarkedFeatureFilterMode) {
    this.adapter?.entityController?.setMarkedFeatureFilter?.(filterMode);
    LocalStorageDB.set(LocalStorageKey.FILTER_MARKED, filterMode);
  }

  /**
   * 从LocalStorage中获取数据
   * @returns 数据
   */
  public getDataFromLocalStorage(mapIdx?: MapIndex) {
    const currentMap = mapIdx || LocalStorageDB.get<MapIndex>(LocalStorageKey.MAP_CURRENT_MAP) || MapIndex.MAP01;
    const zoom = LocalStorageDB.get<DataState<number>>(LocalStorageKey.MAP_ZOOM)?.[currentMap] ?? 3;
    const center =
      LocalStorageDB.get<DataState<Coordinate>>(LocalStorageKey.MAP_VIEW_STATE)?.[currentMap] ??
      getMapCenter(currentMap);

    // 20251125 新增
    const enableCluster = LocalStorageDB.get<boolean>(LocalStorageKey.CLUSTER_ENABLED) ?? true;
    const displayEletricPole = LocalStorageDB.get<boolean>(LocalStorageKey.ELECTRIC_POLE_DISPLAY) ?? true;
    const displayEletricPoleRange = LocalStorageDB.get<boolean>(LocalStorageKey.ELECTRIC_POLE_RANGE_DISPLAY) ?? true;
    const displayCustomPoint = LocalStorageDB.get<boolean>(LocalStorageKey.CUSTOM_POINT_DISPLAY) ?? true;
    const filterMarked =
      LocalStorageDB.get<MarkedFeatureFilterMode>(LocalStorageKey.FILTER_MARKED) ?? MarkedFeatureFilterMode.All;
    const hoverTime = LocalStorageDB.get<number>(LocalStorageKey.HOVER_TIME) ?? 0;

    // 20251130 新增
    const adjustView = LocalStorageDB.get<boolean>(LocalStorageKey.MAP_ADJUST_VIEW) ?? true;

    return {
      zoom,
      center,
      currentMap,
      enableCluster,
      displayEletricPoleRange,
      displayEletricPole,
      displayCustomPoint,
      filterMarked,
      hoverTime,
      adjustView,
    };
  }
}

export const dataService = new DataService();
