import type { JSONLoader } from '@endfieldmap/tools';

import type { ChestRewardSchemaType } from '@endfieldmap/map-service';
import type { DatabaseService } from '@endfieldmap/map-service/service/db';
import type { AssetService } from '@endfieldmap/map-service/service/asset';
import type { ItemDataService } from '@endfieldmap/map-service/service/data/game/item_data';

export interface ChestRewardDataConfig<T, R> {
  jsonLoader: JSONLoader;
  databaseService: DatabaseService<T, R>;
  assetService: AssetService;
  itemDataService: ItemDataService<T, R>;
}

export interface DealedRewardItemWithCount {
  type: 'withCount';
  id: string;
  name: string;
  icon: string;
  count: number;
}

export interface DealedRewardItemWithoutCount {
  type: 'withoutCount';
  id: string;
  name: string;
  icon: string;
}

export type DealedRewardItem = DealedRewardItemWithCount | DealedRewardItemWithoutCount;

export class ChestRewardDataService<T, R> {
  private jsonLoader: JSONLoader;
  private databaseService: DatabaseService<T, R>;
  private assetService: AssetService;
  private itemDataService: ItemDataService<T, R>;

  constructor(config: ChestRewardDataConfig<T, R>) {
    this.jsonLoader = config.jsonLoader;
    this.databaseService = config.databaseService;
    this.assetService = config.assetService;
    this.itemDataService = config.itemDataService;
  }

  public async init() {
    const data = await this.jsonLoader.loadJSON<Record<string, Omit<ChestRewardSchemaType, 'id'>>>(
      `${this.assetService.url.entityData}/reward_table.json`
    );
    const rewards = Object.entries(data || {}).map(([id, reward]) => ({
      id,
      ...reward,
    }));
    if (rewards.length > 0) {
      await this.databaseService.gameDatabase.gameChestReward.bulkUpsert(rewards);
    }
  }

  private async getRewardDataFromDB(id: string) {
    return await this.databaseService.gameDatabase.gameChestReward
      .findOne({
        selector: { id },
      })
      .exec();
  }

  public async getRewards(reward_id?: string): Promise<DealedRewardItem[]> {
    if (!reward_id) return [];

    const _rewardData = await this.getRewardDataFromDB(reward_id);
    const rewardItem = _rewardData?.toJSON();

    if (!rewardItem) return [];

    if (Array.isArray(rewardItem.itemBundles) && rewardItem.itemBundles.length > 0) {
      const promises = rewardItem.itemBundles.map(async (itemBundle) => {
        const item = await this.itemDataService.getItemData(itemBundle.id);
        return {
          type: 'withCount' as const,
          id: itemBundle.id,
          name: item.name || '',
          icon: item.iconId || '',
          count: itemBundle.count,
        } satisfies DealedRewardItemWithCount;
      });
      return Promise.all(promises);
    } else {
      const promises = rewardItem.itemIds!.map(async (id) => {
        const item = await this.itemDataService.getItemData(id);
        return {
          type: 'withoutCount' as const,
          id,
          name: item.name || '',
          icon: item.iconId || '',
        } satisfies DealedRewardItemWithoutCount;
      });
      return Promise.all(promises);
    }
  }
}
