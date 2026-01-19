import { type EndfieldMapAdapter } from '@endfieldmap/map-core';
import { JSONLoader, StorageManager } from '@endfieldmap/tools';

import { ChestRewardDataService } from '@/services/data/chest_reward';
import { CustomPointDataService } from '@/services/data/custom_point';
import { DungeonSeriesDataService } from '@/services/data/dungeon_series';
import { ElectricPoleDataService } from '@/services/data/electric_pole';
import { EntityDataService } from '@/services/data/entity';
import { GuideDataService } from '@/services/data/guide';
import { ItemDataService } from '@/services/data/item';
import { LangHashDataService } from '@/services/data/lang_hash';
import { MapStateDataService } from '@/services/data/map_state';
import { SwiperDataService } from '@/services/data/swiper';
import { GridTiersDataService } from '@/services/data/grid_tiers';

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

  public entityDataService: EntityDataService;
  public electricPoleDataService: ElectricPoleDataService;
  public customPointDataService: CustomPointDataService;
  public itemDataService: ItemDataService;
  public dungeonSeriesDataService: DungeonSeriesDataService;
  public chestRewardDataService: ChestRewardDataService;
  public guideDataService: GuideDataService;
  public langHashDataService: LangHashDataService;
  public mapStateDataService: MapStateDataService;
  public swiperDataService: SwiperDataService;
  public gridTiersDataService: GridTiersDataService;

  constructor(adapter: EndfieldMapAdapter) {
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
    this.langHashDataService = new LangHashDataService(DataService.jsonLoader, DataService.storage);
    this.mapStateDataService = new MapStateDataService(adapter);
    this.swiperDataService = new SwiperDataService();
    this.gridTiersDataService = new GridTiersDataService(DataService.jsonLoader, adapter);
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
      // 初始化语言哈希数据
      this.langHashDataService.getLangHashData(),
      // 初始化网格分级数据
      this.gridTiersDataService.init(),
    ]);
  }

  /**
   * 停止所有操作
   * TODO: 更新补充
   */
  public stopAllOperation() {
    this.customPointDataService.stopAllOperation();
    this.electricPoleDataService.stopAllOperation();
  }
}
