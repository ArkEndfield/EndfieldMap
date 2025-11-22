import {
  MAP_EVENT,
  type EndfieldMapAdapter,
  type EntityVisibilityChangeEventDetail,
  type FeatureStateChangeEventDetail,
} from '@endfieldmap/map-core';
import {
  getMapCenter,
  LocalStorageDB,
  LocalStorageKey,
  MapIndex,
  type DataState,
  type Coordinate,
  throttle,
  StorageManager,
  JSONLoader,
} from '@endfieldmap/tools';
import { EntityDataService } from '@/services/data/entity';
import { ElectricPoleDataService } from '@/services/data/electric_pole';
import { THROTTLE_INTERVAL } from '@/const/data';
import { ItemDataService } from '@/services/data/item';
import { DungeonSeriesDataService } from '@/services/data/dungeon_series';
import { ChestRewardDataService } from '@/services/data/chest_reward';
import { GuideDataService } from '@/services/data/guide';

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
  public itemDataService: ItemDataService;
  public dungeonSeriesDataService: DungeonSeriesDataService;
  public chestRewardDataService: ChestRewardDataService;
  public guideDataService: GuideDataService;

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

    this.itemDataService = new ItemDataService(this.jsonLoader, this.storage);
    this.chestRewardDataService = new ChestRewardDataService(this.jsonLoader, this.storage, this.itemDataService);
    this.dungeonSeriesDataService = new DungeonSeriesDataService(
      this.jsonLoader,
      this.storage,
      this.chestRewardDataService
    );
    this.guideDataService = new GuideDataService(this.jsonLoader, this.storage);

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
    this.initialized = true;
  }

  public registerAdapter(adapter: EndfieldMapAdapter) {
    this.adapter = adapter;
    this.initDataEventListeners();
    // 注册 electric pole 适配器，并在内部应用当前预设数据
    this.electricPoleDataService.registerAdapter(adapter);
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
      throttle((zoom: number) => {
        const currentMap = this.adapter!.currentMapIndex;
        this.setMapZoom(currentMap, zoom);
      }, THROTTLE_INTERVAL)
    );

    this.adapter.event.on(
      MAP_EVENT.MAP_CENTER_CHANGE,
      throttle((center?: Coordinate) => {
        if (!center) return;
        const currentMap = this.adapter!.currentMapIndex;
        this.setMapCenter(currentMap, center);
      }, THROTTLE_INTERVAL)
    );

    // 监听电线杆数据变化事件，自动保存到当前预设（节流）
    this.adapter.event.on(MAP_EVENT.ELECTRIC_POLE_CHANGED, () => {
      this.electricPoleDataService.saveCurrentAdapterDataToStorageThrottled();
    });
  }

  public setMapCenter(mapIndex: MapIndex, center: Coordinate) {
    const originData =
      LocalStorageDB.get<DataState<Coordinate>>(LocalStorageKey.MAP_VIEW_STATE) || ({} as DataState<Coordinate>);
    originData[mapIndex] = center;
    LocalStorageDB.set(LocalStorageKey.MAP_VIEW_STATE, originData);
  }

  public setMapZoom(mapIndex: MapIndex, zoom: number) {
    const originData = LocalStorageDB.get<DataState<number>>(LocalStorageKey.MAP_ZOOM) || ({} as DataState<number>);
    originData[mapIndex] = zoom;
    LocalStorageDB.set(LocalStorageKey.MAP_ZOOM, originData);
  }

  public setCurrentMap(mapIndex: MapIndex) {
    LocalStorageDB.set(LocalStorageKey.MAP_CURRENT_MAP, mapIndex);
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
    return {
      zoom,
      center,
      currentMap: currentMap,
    };
  }
}

export const dataService = new DataService();
