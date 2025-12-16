import { type JSONLoader, StorageKey, type StorageManager } from '@endfieldmap/tools';
import { getAssetUrls } from '@/utils/url';

export class LangHashDataService {
  private inited: boolean;
  private jsonLoader: JSONLoader;
  private storage: StorageManager;
  private loadingPromise: Promise<Record<string, string>> | null = null;
  private langHashData: Record<string, string> | null = null;

  constructor(jsonLoader: JSONLoader, storage: StorageManager) {
    this.jsonLoader = jsonLoader;
    this.storage = storage;
    this.inited = false;
  }

  public async getLangHashData() {
    if (this.inited) {
      const data = await this.storage.permanentGet<Record<string, string>>(StorageKey.LANG_HASH);
      this.langHashData = data;
      if (!data) {
        throw new Error('Lang hash data not found');
      } else {
        return data;
      }
    }

    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = (async () => {
      const assetPath = getAssetUrls();
      const langHashData = await this.jsonLoader.loadJSON<Record<string, string>>(
        `${assetPath.langHash}/lang_hash.json`
      );
      this.storage.permanentSet(StorageKey.LANG_HASH, langHashData);
      this.inited = true;
      this.loadingPromise = null;
      this.langHashData = langHashData;
      return langHashData;
    })();

    return this.loadingPromise;
  }

  public getHash(key: string | undefined): string | null {
    if (!key) return null;
    return this.langHashData?.[key] || null;
  }
}