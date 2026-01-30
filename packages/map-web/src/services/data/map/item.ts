import { type JSONLoader } from '@endfieldmap/tools';

import type { ItemSchemaType } from '@/services/data/db/schema/game_data/item';
import { DataService } from '@/services/data/index';
import { getAssetUrls } from '@/utils/url';

const assetPath = getAssetUrls();

export class ItemDataService {
  private jsonLoader: JSONLoader;

  constructor(jsonLoader: JSONLoader) {
    this.jsonLoader = jsonLoader;
  }

  public async init() {
    const [_, data] = await Promise.all([
      DataService.dbStorage.database.gameItem.find().remove(),
      this.jsonLoader.loadJSON<Record<string, ItemSchemaType>>(
        `${assetPath.itemData}/item_table.json`
      ),
    ]);
    for (const [_, item] of Object.entries(data || {})) {
      await DataService.dbStorage.database.gameItem.upsert(item);
    }
  }

  // public async getItemData() {
  //   if (this.inited) {
  //     const data = await this.storage.permanentGet<Record<string, ItemSchemaType>>(StorageKey.ITEM_DATA);
  //     if (!data) {
  //       throw new Error('Item data not found');
  //     } else {
  //       return data;
  //     }
  //   }

  //   if (this.loadingPromise) {
  //     return this.loadingPromise;
  //   }

  //   this.loadingPromise = (async () => {
  //     const assetPath = getAssetUrls();
  //     const itemData = await this.jsonLoader.loadJSON<Record<string, ItemSchemaType>>(
  //       `${assetPath.itemData}/item_table.json`
  //     );
  //     this.storage.permanentSet(StorageKey.ITEM_DATA, itemData);
  //     this.inited = true;
  //     this.loadingPromise = null;
  //     return itemData;
  //   })();

  //   return this.loadingPromise;
  // }

  private async getItemDataFromDB(id: string) {
    return await DataService.dbStorage.database.gameItem.findOne({
      selector: { id },
    }).exec();
  }

  public async getItemData(item_id: string) {
    const _itemData = await this.getItemDataFromDB(item_id);
    const itemData = {..._itemData?.toJSON() };
    if (itemData?.iconId) {
      const name = itemData.iconId;
      if (name) itemData.iconId = `${assetPath.itemImage}/${name}.png`;
    }
    return itemData;
  }
}
