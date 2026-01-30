import type { JSONLoader } from '@endfieldmap/tools';

import type { DungeonSeriesSchemaType } from '@/services/data/db/schema/game_data/dungeon_series';
import { DataService } from '@/services/data/index';
import type { DealedRewardItem } from '@/services/data/map/chest_reward';
import { ChestRewardDataService } from '@/services/data/map/chest_reward';
import { getAssetUrls } from '@/utils/url';

const assetPath = getAssetUrls();

export class DungeonSeriesDataService {
  private jsonLoader: JSONLoader;
  private chestRewardDataService: ChestRewardDataService;

  constructor(jsonLoader: JSONLoader, chestRewardDataService: ChestRewardDataService) {
    this.jsonLoader = jsonLoader;
    this.chestRewardDataService = chestRewardDataService;
  }

  public async init() {
    const [_, data] = await Promise.all([
      DataService.dbStorage.database.gameDungeonSeries.find().remove(),
      this.jsonLoader.loadJSON<Record<string, Omit<DungeonSeriesSchemaType, 'id'>>>(
        `${assetPath.entityData}/dungeon_series.json`
      ),
    ]);
    for (const [id, dungeonSeries] of Object.entries(data || {})) {
      await DataService.dbStorage.database.gameDungeonSeries.upsert({
        id,
        ...dungeonSeries,
      });
    }
  }

  private async getDungeonSeriesDataFromDB(id: string) {
    return await DataService.dbStorage.database.gameDungeonSeries
      .findOne({
        selector: { id },
      })
      .exec();
  }

  public async getDungeonSeriesDataById(id?: string) {
    if (!id) return;
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
