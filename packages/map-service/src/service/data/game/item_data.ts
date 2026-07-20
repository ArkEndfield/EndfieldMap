import type { AssetService } from '@endfieldmap/map-service/service/asset';
import { createGameDataLoader } from '@endfieldmap/map-service/service/data/game/game_data_cache';
import type { DatabaseService } from '@endfieldmap/map-service/service/db';
import type { ItemSchemaType } from '@endfieldmap/map-service/service/db/schema/game_data/item';
import { type JSONLoader } from '@endfieldmap/tools';

export interface ItemDataConfig<T, R> {
  jsonLoader: JSONLoader;
  databaseService: DatabaseService<T, R>;
  assetService: AssetService;
}

export class ItemDataService<T, R> {
  private jsonLoader: JSONLoader;
  private databaseService: DatabaseService<T, R>;
  private assetService: AssetService;
  private readonly ensureCached = createGameDataLoader<ItemSchemaType>({
    key: 'item',
    collection: () => this.databaseService.gameDatabase.gameItem,
    load: async () => {
      const data = await this.jsonLoader.loadJSON<Record<string, ItemSchemaType>>(
        `${this.assetService.url.itemData}/item_table.json`
      );
      return Object.entries(data || {}).map(([id, item]) => ({
        ...item,
        id, // 用 JSON key 覆盖 item 内部的 id，确保主键唯一
      }));
    },
  });

  constructor(config: ItemDataConfig<T, R>) {
    this.jsonLoader = config.jsonLoader;
    this.databaseService = config.databaseService;
    this.assetService = config.assetService;
  }

  /**
   * 确保物品表已缓存到本地。多次调用共用同一个 Promise，
   * 既可在启动后空闲时预热，也可由首个读取方按需触发。
   */
  public init(): Promise<void> {
    return this.ensureCached();
  }

  private async getItemDataFromDB(id: string) {
    return await this.databaseService.gameDatabase.gameItem
      .findOne({
        selector: { id },
      })
      .exec();
  }

  public async getItemData(item_id: string) {
    await this.init();
    const _itemData = await this.getItemDataFromDB(item_id);
    const itemData = { ..._itemData?.toJSON() };
    if (itemData?.iconId) {
      const name = itemData.iconId;
      if (name) itemData.iconId = `${this.assetService.url.itemImage}/${name}.png`;
    }
    return itemData;
  }
}
