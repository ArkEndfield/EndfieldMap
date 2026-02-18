import type { JSONLoader } from '@endfieldmap/tools';

import type { ChestRewardSchemaType } from '@endfieldmap/map-service';
import { service } from '@/services';
import { ItemDataService } from '@/services/data/map/item';

const assetPath = service.assetService.url;

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

export class ChestRewardDataService {
  private jsonLoader: JSONLoader;
  private itemDataService: ItemDataService;

  constructor(jsonLoader: JSONLoader, itemDataService: ItemDataService) {
    this.jsonLoader = jsonLoader;
    this.itemDataService = itemDataService;
  }

  public async init() {
    const data = await this.jsonLoader.loadJSON<Record<string, Omit<ChestRewardSchemaType, 'id'>>>(
      `${assetPath.entityData}/reward_table.json`
    );
    const rewards = Object.entries(data || {}).map(([id, reward]) => ({
      id,
      ...reward,
    }));
    if (rewards.length > 0) {
      await service.databaseService.gameDatabase.gameChestReward.bulkUpsert(rewards);
    }
  }

  private async getRewardDataFromDB(id: string) {
    return await service.databaseService.gameDatabase.gameChestReward
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
