import type { JSONLoader } from '@endfieldmap/tools';

import type { GuideInfoDetail } from '@/@types/guide';
import type { GuideSchemaType } from '@/services/data/db/schema/game_data/guide';
import { DataService } from '@/services/data/index';
import { getAssetUrls } from '@/utils/url';

const assetPath = getAssetUrls();

export class GuideDataService {
  private jsonLoader: JSONLoader;

  constructor(jsonLoader: JSONLoader) {
    this.jsonLoader = jsonLoader;
  }

  public async init() {
    const data = await this.jsonLoader.loadJSON<Record<string, Omit<GuideSchemaType, 'id'>>>(
      `${assetPath.entityData}/guide.json`
    );
    const guides = Object.entries(data || {}).map(([id, guide]) => ({
      id,
      ...guide,
    }));
    if (guides.length > 0) {
      await DataService.dbStorage.gameDatabase.gameGuide.bulkUpsert(guides);
    }
  }

  private async getGuideDataFromDB(id: string) {
    return await DataService.dbStorage.gameDatabase.gameGuide
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
