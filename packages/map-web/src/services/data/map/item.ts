import { type JSONLoader } from '@endfieldmap/tools';

import type { ItemSchemaType } from '@endfieldmap/map-service';
import { service } from '@/services';
import { getAssetUrls } from '@/utils/url';

const assetPath = getAssetUrls();

export class ItemDataService {
  private jsonLoader: JSONLoader;

  constructor(jsonLoader: JSONLoader) {
    this.jsonLoader = jsonLoader;
  }

  public async init() {
    const data = await this.jsonLoader.loadJSON<Record<string, ItemSchemaType>>(
      `${assetPath.itemData}/item_table.json`
    );
    const items = Object.values(data || {});
    if (items.length > 0) {
      await service.databaseService.gameDatabase.gameItem.bulkUpsert(items);
    }
  }

  private async getItemDataFromDB(id: string) {
    return await service.databaseService.gameDatabase.gameItem
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
      if (name) itemData.iconId = `${assetPath.itemImage}/${name}.png`;
    }
    return itemData;
  }
}
