import type { ItemData } from '@eftypes/item';
import { type JSONLoader, StorageKey, type StorageManager } from '@endfieldmap/tools';

import { getAssetUrls } from '@/utils/url';

export class ItemDataService {
  private jsonLoader: JSONLoader;
  private storage: StorageManager;
  private inited: boolean;
  private loadingPromise: Promise<Record<string, ItemData>> | null = null;

  constructor(jsonLoader: JSONLoader, storage: StorageManager) {
    this.jsonLoader = jsonLoader;
    this.storage = storage;
    this.inited = false;
  }

  public async getItemData() {
    if (this.inited) {
      const data = await this.storage.permanentGet<Record<string, ItemData>>(StorageKey.ITEM_DATA);
      if (!data) {
        throw new Error('Item data not found');
      } else {
        return data;
      }
    }

    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = (async () => {
      const assetPath = getAssetUrls();
      const itemData = await this.jsonLoader.loadJSON<Record<string, ItemData>>(`${assetPath.itemData}/item_data.json`);
      this.storage.permanentSet(StorageKey.ITEM_DATA, itemData);
      this.inited = true;
      this.loadingPromise = null;
      return itemData;
    })();

    return this.loadingPromise;
  }

  public async getItemDataById(id: string) {
    const itemData = await this.getItemData();
    return itemData[id];
  }

  public async getItemIcon(item_id: string) {
    const assetPath = getAssetUrls();
    const itemData = await this.getItemDataById(item_id);
    if (itemData?.iconId) {
      const name = itemData.iconId;
      if (name) return `${assetPath.itemImage}/${name}.png`;
    }
    return null;
  }
}
