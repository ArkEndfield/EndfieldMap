import type { JSONLoader } from '@endfieldmap/tools';

import type { GuideInfoDetail } from '@endfieldmap/map-service/@types/guide';
import type { GuideSchemaType } from '@endfieldmap/map-service/service/db/schema/game_data/guide';
import type { DatabaseService } from '@endfieldmap/map-service/service/db';
import type { AssetService } from '@endfieldmap/map-service/service/asset';

export interface GuideDataServiceConfig<T, R> {
  jsonLoader: JSONLoader;
  databaseService: DatabaseService<T, R>;
  assetService: AssetService;
}

export class GuideDataService<T, R> {
  private jsonLoader: JSONLoader;
  private databaseService: DatabaseService<T, R>;
  private assetService: AssetService;

  constructor(config: GuideDataServiceConfig<T, R>) {
    this.jsonLoader = config.jsonLoader;
    this.databaseService = config.databaseService;
    this.assetService = config.assetService;
  }

  public async init() {
    const data = await this.jsonLoader.loadJSON<Record<string, Omit<GuideSchemaType, 'id'>>>(
      `${this.assetService.url.entityData}/guide.json`
    );
    const guides = Object.entries(data || {}).map(([id, guide]) => ({
      id,
      ...guide,
    }));
    if (guides.length > 0) {
      await this.databaseService.gameDatabase.gameGuide.bulkUpsert(guides);
    }
  }

  private async getGuideDataFromDB(id: string) {
    return await this.databaseService.gameDatabase.gameGuide
      .findOne({
        selector: { id },
      })
      .exec();
  }

  public async getGuide(id: number): Promise<GuideInfoDetail | undefined> {
    const data = await this.getGuideDataFromDB(id.toString());
    return data?.toJSON() as GuideInfoDetail | undefined;
  }
}
