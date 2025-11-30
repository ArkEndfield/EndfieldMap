import type { GuideInfoDetail } from '@eftypes/guide';
import { type JSONLoader, StorageKey, type StorageManager } from '@endfieldmap/tools';

import { assetsHost } from '@/services/env';
import { getAssetUrls } from '@/utils/url';

export class GuideDataService {
  private jsonLoader: JSONLoader;
  private storage: StorageManager;
  private inited: boolean;
  private loadingPromise: Promise<Record<string, GuideInfoDetail>> | null = null;

  constructor(jsonLoader: JSONLoader, storage: StorageManager) {
    this.jsonLoader = jsonLoader;
    this.storage = storage;
    this.inited = false;
  }

  public async getGuidesData() {
    if (this.inited) {
      const data = await this.storage.permanentGet<Record<number, GuideInfoDetail>>(StorageKey.GUIDE);
      if (!data) {
        throw new Error('Guides data not found');
      } else {
        return data;
      }
    }

    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = (async () => {
      const assetPath = getAssetUrls(assetsHost);
      const guidesData = await this.jsonLoader.loadJSON<Record<string, GuideInfoDetail>>(
        `${assetPath.entityData}/guide.json`
      );
      this.storage.permanentSet(StorageKey.GUIDE, guidesData);
      this.inited = true;
      this.loadingPromise = null;
      return guidesData;
    })();

    return this.loadingPromise;
  }

  public async getGuide(id: number) {
    const guideData = await this.getGuidesData();
    return guideData[id];
  }
}
