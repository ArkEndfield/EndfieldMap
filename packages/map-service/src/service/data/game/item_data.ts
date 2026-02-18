import { type JSONLoader } from '@endfieldmap/tools';

import type { ItemSchemaType } from '@endfieldmap/map-service/service/db/schema/game_data/item';
import type { DatabaseService } from '@endfieldmap/map-service/service/db';
import type { AssetService } from '@endfieldmap/map-service/service/asset';

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
    const items = Object.values(data || {});
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
