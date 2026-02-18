import { type JSONLoader } from '@endfieldmap/tools';

import { service } from '@/services';

const assetPath = service.assetService.url;

export class LangHashDataService {
  private jsonLoader: JSONLoader;
  private langHashData: Record<string, string> | null = null;

  constructor(jsonLoader: JSONLoader) {
    this.jsonLoader = jsonLoader;
  }

  public async init() {
    const langHashData = await this.jsonLoader.loadJSON<Record<string, string>>(`${assetPath.langHash}/lang_hash.json`);
    this.langHashData = langHashData;
    return langHashData;
  }

  public getHash(key: string | undefined): string | null {
    if (!key) return null;
    return this.langHashData?.[key] || null;
  }
}
