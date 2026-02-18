import { type JSONLoader } from '@endfieldmap/tools';

import type { AssetService } from '@endfieldmap/map-service/service/asset';

export interface LangHashServiceConfig {
  jsonLoader: JSONLoader;
  assetService: AssetService;
}

export class LangHashService {
  private jsonLoader: JSONLoader;
  private assetService: AssetService;
  private langHashData: Record<string, string> | null = null;

  constructor(config: LangHashServiceConfig) {
    this.jsonLoader = config.jsonLoader;
    this.assetService = config.assetService;
  }

  public async init() {
    const langHashData = await this.jsonLoader.loadJSON<Record<string, string>>(
      `${this.assetService.url.langHash}/lang_hash.json`
    );
    this.langHashData = langHashData;
    return langHashData;
  }

  public getHash(key: string | undefined): string | null {
    if (!key) return null;
    return this.langHashData?.[key] || null;
  }
}
