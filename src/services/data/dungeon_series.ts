import type { DungeonSeriesData } from '@eftypes/dungeon_series';
import type { DealedRewardItem } from '@eftypes/reward';
import { type JSONLoader, StorageKey, type StorageManager } from '@endfieldmap/tools';

import { assetsHost } from '@/services/env';
import { getAssetUrls } from '@/utils/url';

import { ChestRewardDataService } from './chest_reward';

export class DungeonSeriesDataService {
  private jsonLoader: JSONLoader;
  private storage: StorageManager;
  private inited: boolean;
  private loadingPromise: Promise<Record<string, DungeonSeriesData>> | null = null;
  private chestRewardDataService: ChestRewardDataService;

  constructor(jsonLoader: JSONLoader, storage: StorageManager, chestRewardDataService: ChestRewardDataService) {
    this.jsonLoader = jsonLoader;
    this.storage = storage;
    this.chestRewardDataService = chestRewardDataService;
    this.inited = false;
  }

  public async getDungeonSeriesData() {
    if (this.inited) {
      const data = await this.storage.permanentGet<Record<string, DungeonSeriesData>>(StorageKey.DUNGEON_SERIES);
      if (!data) {
        throw new Error('Dungeon Series data not found');
      } else {
        return data;
      }
    }

    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = (async () => {
      const assetPath = getAssetUrls(assetsHost);
      const dungeonSeriesData = await this.jsonLoader.loadJSON<Record<string, DungeonSeriesData>>(
        `${assetPath.entityData}/dungeon_series.json`
      );
      this.storage.permanentSet(StorageKey.DUNGEON_SERIES, dungeonSeriesData);
      this.inited = true;
      this.loadingPromise = null;
      return dungeonSeriesData;
    })();

    return this.loadingPromise;
  }

  public async getDungeonSeriesDataById(id?: string) {
    if (!id) return;
    const dungeonSeriesData = await this.getDungeonSeriesData();
    return dungeonSeriesData[id];
  }

  public async getDungeonRewards(dungeion_series_id?: string) {
    if (!dungeion_series_id) return {};
    const dungeonSeries = await this.getDungeonSeriesDataById(dungeion_series_id);
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

  public async getIncludeDungeonCount(dungeion_series_id?: string) {
    if (!dungeion_series_id) return 0;
    const dungeonSeries = await this.getDungeonSeriesDataById(dungeion_series_id);
    if (!dungeonSeries || !dungeonSeries.includeDungeon) return 0;
    return dungeonSeries.includeDungeon.length;
  }
}
