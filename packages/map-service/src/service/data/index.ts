import type { AdapterRegistry } from '@endfieldmap/map-service/service/adapter_registry';
import type { AssetService } from '@endfieldmap/map-service/service/asset';
import { AnnouncementDataService } from '@endfieldmap/map-service/service/data/announcement';
import { BalloonService } from '@endfieldmap/map-service/service/data/game/balloon';
import { ChestRewardDataService } from '@endfieldmap/map-service/service/data/game/chest_reward';
import { DeltaRobotService } from '@endfieldmap/map-service/service/data/game/delta_robot';
import { DungeonSeriesDataService } from '@endfieldmap/map-service/service/data/game/dungeon_series';
import { ItemDataService } from '@endfieldmap/map-service/service/data/game/item_data';
import { NoteDataService } from '@endfieldmap/map-service/service/data/game/note_data';
import { GuideDataService } from '@endfieldmap/map-service/service/data/guide';
import { MapDataService } from '@endfieldmap/map-service/service/data/map';
import { SwiperDataService } from '@endfieldmap/map-service/service/data/swiper';
import type { DatabaseService } from '@endfieldmap/map-service/service/db';
import type { I18nService } from '@endfieldmap/map-service/service/i18n';
import type { PresetService } from '@endfieldmap/map-service/service/preset_service';
import type { ServerService } from '@endfieldmap/map-service/service/server';
import type { UserService } from '@endfieldmap/map-service/service/user';
import type { JSONLoader } from '@endfieldmap/tools';

export interface DataServiceConfig<T, R> {
  assetService: AssetService;
  i18nService: I18nService;
  jsonLoader: JSONLoader;
  userService: UserService<T, R>;
  databaseService: DatabaseService<T, R>;
  presetService: PresetService;
  adapterRegistry: AdapterRegistry;
  serverService: ServerService;
}

export class DataService<T, R> {
  public balloonService: BalloonService;
  public deltaRobotService: DeltaRobotService<T, R>;
  public itemDataService: ItemDataService<T, R>;
  public chestRewardDataService: ChestRewardDataService<T, R>;
  public dungeonSeriesDataService: DungeonSeriesDataService<T, R>;
  public noteDataService: NoteDataService;
  public guideDataService: GuideDataService;
  public swiperDataService: SwiperDataService;
  public mapDataService: MapDataService<T, R>;
  public announcementDataService: AnnouncementDataService;

  constructor(config: DataServiceConfig<T, R>) {
    this.balloonService = new BalloonService({
      assetService: config.assetService,
      jsonLoader: config.jsonLoader,
    });
    this.deltaRobotService = new DeltaRobotService({
      assetService: config.assetService,
      jsonLoader: config.jsonLoader,
      databaseService: config.databaseService,
    });
    this.itemDataService = new ItemDataService({
      assetService: config.assetService,
      jsonLoader: config.jsonLoader,
      databaseService: config.databaseService,
    });
    this.chestRewardDataService = new ChestRewardDataService({
      assetService: config.assetService,
      jsonLoader: config.jsonLoader,
      databaseService: config.databaseService,
      itemDataService: this.itemDataService,
    });
    this.dungeonSeriesDataService = new DungeonSeriesDataService({
      assetService: config.assetService,
      jsonLoader: config.jsonLoader,
      databaseService: config.databaseService,
      chestRewardDataService: this.chestRewardDataService,
    });
    this.noteDataService = new NoteDataService({
      assetService: config.assetService,
      jsonLoader: config.jsonLoader,
    });
    this.guideDataService = new GuideDataService({
      serverService: config.serverService,
    });
    this.swiperDataService = new SwiperDataService({
      serverService: config.serverService,
    });
    this.mapDataService = new MapDataService({
      adapterRegistry: config.adapterRegistry,
      assetService: config.assetService,
      i18nService: config.i18nService,
      jsonLoader: config.jsonLoader,
      userService: config.userService,
      presetService: config.presetService,
    });
    this.announcementDataService = new AnnouncementDataService({
      serverService: config.serverService,
    });
  }

  /**
   * 启动期初始化。
   *
   * 只等待 UI 会同步读取的小体量数据（noteData）。物品 / 奖励 / 副本三张表
   * 体积大且要写 IndexedDB，但只在打开弹窗时才被读到，因此不放在关键路径上：
   * 它们由 `prefetchGameData` 在首屏渲染完成后补齐，也会被各自的读取方法
   * 按需触发（`init` 内部做了 Promise 去重，不会重复加载）。
   */
  public async init() {
    await this.noteDataService.init();
  }

  /**
   * 预热游戏静态数据表。失败不影响主流程——真正需要时读取方法会再试一次。
   */
  public async prefetchGameData(): Promise<void> {
    await Promise.allSettled([
      this.itemDataService.init(),
      this.chestRewardDataService.init(),
      this.dungeonSeriesDataService.init(),
    ]);
  }
}
