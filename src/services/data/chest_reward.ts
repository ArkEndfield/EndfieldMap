import type {
  DealedRewardItem,
  DealedRewardItemWithCount,
  DealedRewardItemWithoutCount,
  RewardItem,
} from '@eftypes/reward';
import { type JSONLoader, StorageKey, type StorageManager } from '@endfieldmap/tools';

import { ItemDataService } from '@/services/data/item';
import { assetsHost } from '@/services/env';
import { isRewardWithCountType } from '@/utils/reward';
import { getAssetUrls } from '@/utils/url';

export class ChestRewardDataService {
  private inited: boolean;
  private jsonLoader: JSONLoader;
  private storage: StorageManager;
  private itemDataService: ItemDataService;
  private loadingPromise: Promise<Record<string, RewardItem>> | null = null;

  constructor(jsonLoader: JSONLoader, storage: StorageManager, itemDataService: ItemDataService) {
    this.jsonLoader = jsonLoader;
    this.storage = storage;
    this.itemDataService = itemDataService;
    this.inited = false;
  }

  public async getRewardsData() {
    if (this.inited) {
      const data = await this.storage.permanentGet<Record<string, RewardItem>>(StorageKey.CHEST_REWARD);
      if (!data) {
        throw new Error('Reward data not found');
      } else {
        return data;
      }
    }

    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = (async () => {
      const assetPath = getAssetUrls(assetsHost);
      const rewardData = await this.jsonLoader.loadJSON<Record<string, RewardItem>>(
        `${assetPath.entityData}/chest_reward.json`
      );
      this.storage.permanentSet(StorageKey.CHEST_REWARD, rewardData);
      this.inited = true;
      this.loadingPromise = null;
      return rewardData;
    })();

    return this.loadingPromise;
  }

  public async getRewards(reward_id?: string): Promise<DealedRewardItem[]> {
    if (!reward_id) return [];

    const allRewards = await this.getRewardsData();
    const rewardItem = allRewards[reward_id];

    if (!rewardItem) return [];

    if (isRewardWithCountType(rewardItem)) {
      const promises = rewardItem.itemBundles.map(async (itemBundle) => {
        const icon = await this.itemDataService.getItemIcon(itemBundle.id);
        return {
          type: 'withCount' as const,
          id: itemBundle.id,
          icon: icon || '',
          count: itemBundle.count,
        } satisfies DealedRewardItemWithCount;
      });
      return Promise.all(promises);
    } else {
      const promises = rewardItem.itemIds.map(async (id) => {
        const icon = await this.itemDataService.getItemIcon(id);
        return {
          type: 'withoutCount' as const,
          id,
          icon: icon || '',
        } satisfies DealedRewardItemWithoutCount;
      });
      return Promise.all(promises);
    }
  }
}
