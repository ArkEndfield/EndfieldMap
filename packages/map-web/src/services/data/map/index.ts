import type { EndfieldMapAdapter } from '@endfieldmap/map-core';
import type { JSONLoader, StorageManager } from '@endfieldmap/tools';

import { ChestRewardDataService } from '@/services/data/map/chest_reward';
import { CustomPointDataService } from '@/services/data/map/custom_point';
import { DeltaRobotDataService } from '@/services/data/map/delta_robot';
import { DungeonSeriesDataService } from '@/services/data/map/dungeon_series';
import { ElectricPoleDataService } from '@/services/data/map/electric_pole';
import { EntityDataService } from '@/services/data/map/entity';
import { GridTiersDataService } from '@/services/data/map/grid_tiers';
import { GuideDataService } from '@/services/data/map/guide';
import { ItemDataService } from '@/services/data/map/item';
import { LangHashDataService } from '@/services/data/map/lang_hash';
import { MapStateDataService } from '@/services/data/map/map_state';
import { NoteDataService } from '@/services/data/map/note';
import { SwiperDataService } from '@/services/data/map/swiper';

/**
 * 数据服务
 */
export class MapDataService {
  private readonly storage: StorageManager;
  private readonly jsonLoader: JSONLoader;
  public static instance?: MapDataService;

  public entityDataService: EntityDataService;
  public electricPoleDataService: ElectricPoleDataService;
  public customPointDataService: CustomPointDataService;
  public itemDataService: ItemDataService;
  public dungeonSeriesDataService: DungeonSeriesDataService;
  public deltaRobotDataService: DeltaRobotDataService;
  public chestRewardDataService: ChestRewardDataService;
  public guideDataService: GuideDataService;
  public langHashDataService: LangHashDataService;
  public mapStateDataService: MapStateDataService;
  public swiperDataService: SwiperDataService;
  public gridTiersDataService: GridTiersDataService;
  public noteDataService: NoteDataService;

  constructor(adapter: EndfieldMapAdapter, storage: StorageManager, jsonLoader: JSONLoader) {
    this.storage = storage;
    this.jsonLoader = jsonLoader;
    this.entityDataService = new EntityDataService(adapter);
    this.electricPoleDataService = new ElectricPoleDataService(this.storage, adapter);
    this.customPointDataService = new CustomPointDataService(this.storage, adapter);

    this.itemDataService = new ItemDataService(this.jsonLoader);
    this.chestRewardDataService = new ChestRewardDataService(this.jsonLoader, this.itemDataService);
    this.dungeonSeriesDataService = new DungeonSeriesDataService(
      this.jsonLoader,
      this.chestRewardDataService
    );
    this.deltaRobotDataService = new DeltaRobotDataService(this.jsonLoader);
    this.guideDataService = new GuideDataService(this.jsonLoader);
    this.langHashDataService = new LangHashDataService(this.jsonLoader);
    this.mapStateDataService = new MapStateDataService(adapter);
    this.swiperDataService = new SwiperDataService();
    this.gridTiersDataService = new GridTiersDataService(this.jsonLoader, adapter);
    this.noteDataService = new NoteDataService(this.jsonLoader);
  }

  public static async createInstance(adapter: EndfieldMapAdapter, storage: StorageManager, jsonLoader: JSONLoader) {
    if (MapDataService.instance) return MapDataService.instance;
    const instance = new MapDataService(adapter, storage, jsonLoader);
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
      this.itemDataService.init(),
      // 初始化宝箱奖励数据
      this.chestRewardDataService.init(),
      // 初始化副本奖励数据
      this.dungeonSeriesDataService.init(),
      // 初始化攻略数据
      this.guideDataService.init(),
      // 初始化语言哈希数据
      this.langHashDataService.init(),
      // 初始化网格分级数据
      this.gridTiersDataService.init(),
      // 初始化 delta robot 数据
      this.deltaRobotDataService.init(),
      // 初始化情报档案数据
      this.noteDataService.init(),
    ]);
    this.deleteCacheData();
  }

  private deleteCacheData() {
    // TODO: 旧版本数据迁移
    // 先前缓存了 lang_hash，但是现在不需要了，因为其本身就写入内存里了
    this.storage.permanentRemove('lang_hash');
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
