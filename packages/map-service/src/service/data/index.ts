import { AdapterRegistry } from '@endfieldmap/map-service/service/adapter_registry';
import type { AssetService } from '@endfieldmap/map-service/service/asset';
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
import { PresetService } from '@endfieldmap/map-service/service/preset_service';
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
}

export class DataService<T, R> {
  private config: DataServiceConfig<T, R>;

  public deltaRobotService: DeltaRobotService<T, R>;
  public itemDataService: ItemDataService<T, R>;
  public chestRewardDataService: ChestRewardDataService<T, R>;
  public dungeonSeriesDataService: DungeonSeriesDataService<T, R>;
  public noteDataService: NoteDataService;
  public guideDataService: GuideDataService<T, R>;
  public swiperDataService: SwiperDataService;
  public mapDataService: MapDataService<T, R>;

  constructor(config: DataServiceConfig<T, R>) {
    this.config = config;
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
    this.mapDataService = new MapDataService({
      adapterRegistry: this.config.adapterRegistry,
      assetService: this.config.assetService,
      i18nService: this.config.i18nService,
      jsonLoader: this.config.jsonLoader,
      userService: this.config.userService,
      presetService: this.config.presetService,
    });
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
