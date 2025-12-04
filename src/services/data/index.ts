import {
  type EndfieldMapAdapter,
  type EntityVisibilityChangeEventDetail,
  type FeatureStateChangeEventDetail,
  MAP_EVENT,
} from '@endfieldmap/map-core';
import { JSONLoader, StorageManager } from '@endfieldmap/tools';

import { ChestRewardDataService } from '@/services/data/chest_reward';
import { CustomPointDataService } from '@/services/data/custom_point';
import { DungeonSeriesDataService } from '@/services/data/dungeon_series';
import { ElectricPoleDataService } from '@/services/data/electric_pole';
import { EntityDataService } from '@/services/data/entity';
import { GuideDataService } from '@/services/data/guide';
import { ItemDataService } from '@/services/data/item';
import { SwiperDataService } from '@/services/data/swiper';
import { MapStateDataService } from '@/services/data/map_state';

/**
 * 数据服务
 */
export class DataService {
  public static storage = new StorageManager({
    name: 'endfieldmap',
    version: 1,
    description: 'EndfieldMap Storage',
  });
  public static jsonLoader = new JSONLoader({
    storage: this.storage,
  });
  public static instance?: DataService;

  private adapter: EndfieldMapAdapter;

  public entityDataService: EntityDataService;
  public electricPoleDataService: ElectricPoleDataService;
  public customPointDataService: CustomPointDataService;
  public itemDataService: ItemDataService;
  public dungeonSeriesDataService: DungeonSeriesDataService;
  public chestRewardDataService: ChestRewardDataService;
  public guideDataService: GuideDataService;
  public mapStateDataService: MapStateDataService;
  public swiperDataService: SwiperDataService;

  constructor(adapter: EndfieldMapAdapter) {
    this.adapter = adapter;
    this.entityDataService = new EntityDataService(DataService.storage, adapter);
    this.electricPoleDataService = new ElectricPoleDataService(DataService.storage, adapter);
    this.customPointDataService = new CustomPointDataService(DataService.storage, adapter);

    this.itemDataService = new ItemDataService(DataService.jsonLoader, DataService.storage);
    this.chestRewardDataService = new ChestRewardDataService(
      DataService.jsonLoader,
      DataService.storage,
      this.itemDataService
    );
    this.dungeonSeriesDataService = new DungeonSeriesDataService(
      DataService.jsonLoader,
      DataService.storage,
      this.chestRewardDataService
    );
    this.guideDataService = new GuideDataService(DataService.jsonLoader, DataService.storage);
    this.mapStateDataService = new MapStateDataService(adapter);
    this.swiperDataService = new SwiperDataService();
  }

  public static async initStorage() {
    await DataService.storage.init();
  }

  public static async createInstance(adapter: EndfieldMapAdapter) {
    if (DataService.instance) return DataService.instance;
    const instance = new DataService(adapter);
    await instance.init();
    return instance;
  }

  public async init() {
    await Promise.all([
      // 初始化 entity 数据
      this.entityDataService.initFromStorage(),
      // 初始化电线杆预设数据
      this.electricPoleDataService.initFromStorage(),
      // 初始化自定义标点预设数据
      this.customPointDataService.initFromStorage(),
      // 初始化 item 数据（游戏物品）
      this.itemDataService.getItemData(),
      // 初始化宝箱奖励数据
      this.chestRewardDataService.getRewardsData(),
      // 初始化副本奖励数据
      this.dungeonSeriesDataService.getDungeonSeriesData(),
      // 初始化攻略数据
      this.guideDataService.getGuidesData(),
    ]);
    this.initDataEventListeners();
  }

  public initDataEventListeners() {
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
  }
}
