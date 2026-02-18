import type { JSONLoader } from '@endfieldmap/tools';

import type { AssetService } from '@endfieldmap/map-service/service/asset';
import type { DatabaseService } from '@endfieldmap/map-service/service/db';
import { ItemDataService } from '@endfieldmap/map-service/service/data/game/item_data';
import { DeltaRobotService } from '@endfieldmap/map-service/service/data/game/delta_robot';
import { ChestRewardDataService } from '@endfieldmap/map-service/service/data/game/chest_reward';
import { DungeonSeriesDataService } from '@endfieldmap/map-service/service/data/game/dungeon_series';
import { NoteDataService } from '@endfieldmap/map-service/service/data/game/note_data';
import { SwiperDataService } from '@endfieldmap/map-service/service/data/swiper';
import { GuideDataService } from '@endfieldmap/map-service/service/data/guide';

export interface DataServiceConfig<T, R> {
  assetService: AssetService;
  jsonLoader: JSONLoader;
  databaseService: DatabaseService<T, R>;
}

export class DataService<T, R> {
  public deltaRobotService: DeltaRobotService<T, R>;
  public itemDataService: ItemDataService<T, R>;
  public chestRewardDataService: ChestRewardDataService<T, R>;
  public dungeonSeriesDataService: DungeonSeriesDataService<T, R>;
  public noteDataService: NoteDataService;
  public guideDataService: GuideDataService<T, R>;
  public swiperDataService: SwiperDataService;

  constructor(config: DataServiceConfig<T, R>) {
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
      assetService: config.assetService,
      jsonLoader: config.jsonLoader,
      databaseService: config.databaseService,
    });
    this.swiperDataService = new SwiperDataService();
  }

  public async init() {
    await Promise.all([
      this.itemDataService.init(),
      this.chestRewardDataService.init(),
      this.dungeonSeriesDataService.init(),
      this.noteDataService.init(),
      this.guideDataService.init(),
    ]);
  }
}
