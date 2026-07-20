import type { DungeonSeriesSchemaType } from '@endfieldmap/map-service';
import type { AssetService } from '@endfieldmap/map-service/service/asset';
import type { ChestRewardDataService,DealedRewardItem } from '@endfieldmap/map-service/service/data/game/chest_reward';
import { createGameDataLoader } from '@endfieldmap/map-service/service/data/game/game_data_cache';
import type { DatabaseService } from '@endfieldmap/map-service/service/db';
import type { JSONLoader } from '@endfieldmap/tools';

export interface DungeonSeriesDataConfig<T, R> {
  jsonLoader: JSONLoader;
  databaseService: DatabaseService<T, R>;
  assetService: AssetService;
  chestRewardDataService: ChestRewardDataService<T, R>;
}

export class DungeonSeriesDataService<T, R> {
  private jsonLoader: JSONLoader;
  private databaseService: DatabaseService<T, R>;
  private assetService: AssetService;
  private chestRewardDataService: ChestRewardDataService<T, R>;
  private readonly ensureCached = createGameDataLoader<DungeonSeriesSchemaType>({
    key: 'dungeon_series',
    collection: () => this.databaseService.gameDatabase.gameDungeonSeries,
    load: async () => {
      const data = await this.jsonLoader.loadJSON<Record<string, DungeonSeriesSchemaType>>(
        `${this.assetService.url.entityData}/dungeon_series.json`
      );
      return Object.values(data || {});
    },
  });

  constructor(config: DungeonSeriesDataConfig<T, R>) {
    this.jsonLoader = config.jsonLoader;
    this.databaseService = config.databaseService;
    this.assetService = config.assetService;
    this.chestRewardDataService = config.chestRewardDataService;
  }

  /**
   * 确保副本系列表已缓存到本地。多次调用共用同一个 Promise，
   * 既可在启动后空闲时预热，也可由首个读取方按需触发。
   */
  public init(): Promise<void> {
    return this.ensureCached();
  }

  private async getDungeonSeriesDataFromDB(id: string) {
    return await this.databaseService.gameDatabase.gameDungeonSeries
      .findOne({
        selector: { id },
      })
      .exec();
  }

  public async getDungeonSeriesDataById(id?: string) {
    if (!id) return;
    await this.init();
    const data = await this.getDungeonSeriesDataFromDB(id);
    return data?.toJSON();
  }

  public async getDungeonRewards(system_inst_key?: string) {
    if (!system_inst_key) return {};
    const dungeonSeries = await this.getDungeonSeriesDataById(system_inst_key);
    if (!dungeonSeries) return {};
    const includeDungeon = dungeonSeries.includeDungeon;

    const rewardPromises = includeDungeon
      .filter((dungeon) => dungeon.rewardId || dungeon.firstPassRewardId)
      .map(async (dungeon) => {
        const rewardId = dungeon.rewardId || dungeon.firstPassRewardId;
        if (!rewardId) return null;
        const reward = await this.chestRewardDataService.getRewards(rewardId);
        return { dungeonId: dungeon.dungeonId, reward };
      });

    const results = await Promise.all(rewardPromises);

    const rewards = results.reduce(
      (acc, result) => {
        if (result) {
          acc[result.dungeonId] = result.reward;
        }
        return acc;
      },
      {} as Record<string, DealedRewardItem[]>
    );

    return rewards;
  }

  public async getIncludeDungeonCount(system_inst_key?: string) {
    if (!system_inst_key) return 0;
    const dungeonSeries = await this.getDungeonSeriesDataById(system_inst_key);
    if (!dungeonSeries || !dungeonSeries.includeDungeon) return 0;
    return dungeonSeries.includeDungeon.length;
  }
}
