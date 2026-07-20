import type { ChestRewardSchemaType } from '@endfieldmap/map-service';
import type { AssetService } from '@endfieldmap/map-service/service/asset';
import { createGameDataLoader } from '@endfieldmap/map-service/service/data/game/game_data_cache';
import type { ItemDataService } from '@endfieldmap/map-service/service/data/game/item_data';
import type { DatabaseService } from '@endfieldmap/map-service/service/db';
import type { JSONLoader } from '@endfieldmap/tools';

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
  private readonly ensureCached = createGameDataLoader<ChestRewardSchemaType>({
    key: 'chest_reward',
    collection: () => this.databaseService.gameDatabase.gameChestReward,
    load: async () => {
      const data = await this.jsonLoader.loadJSON<Record<string, Omit<ChestRewardSchemaType, 'id'>>>(
        `${this.assetService.url.entityData}/reward_table.json`
      );
      return Object.entries(data || {}).map(([id, reward]) => ({ id, ...reward }));
    },
  });

  constructor(config: ChestRewardDataConfig<T, R>) {
    this.jsonLoader = config.jsonLoader;
    this.databaseService = config.databaseService;
    this.assetService = config.assetService;
    this.itemDataService = config.itemDataService;
  }

  /**
   * 确保奖励表已缓存到本地。多次调用共用同一个 Promise，
   * 既可在启动后空闲时预热，也可由首个读取方按需触发。
   */
  public init(): Promise<void> {
    return this.ensureCached();
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

    await this.init();
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
