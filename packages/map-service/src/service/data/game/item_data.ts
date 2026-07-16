import type { AssetService } from '@endfieldmap/map-service/service/asset';
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

  constructor(config: ItemDataConfig<T, R>) {
    this.jsonLoader = config.jsonLoader;
    this.databaseService = config.databaseService;
    this.assetService = config.assetService;
  }

  public async init() {
    const data = await this.jsonLoader.loadJSON<Record<string, ItemSchemaType>>(
      `${this.assetService.url.itemData}/item_table.json`
    );
    const items = Object.entries(data || {}).map(([id, item]) => ({
      ...item,
      id, // 用 JSON key 覆盖 item 内部的 id，确保主键唯一
    }));
    if (items.length > 0) {
      await this.databaseService.gameDatabase.gameItem.bulkUpsert(items);
    }
  }

  private async getItemDataFromDB(id: string) {
    return await this.databaseService.gameDatabase.gameItem
      .findOne({
        selector: { id },
      })
      .exec();
  }

  public async getItemData(item_id: string) {
    const _itemData = await this.getItemDataFromDB(item_id);
    const itemData = { ..._itemData?.toJSON() };
    if (itemData?.iconId) {
      const name = itemData.iconId;
      if (name) itemData.iconId = `${this.assetService.url.itemImage}/${name}.png`;
    }
    return itemData;
  }
}
