import type { MapData } from '@endfieldmap/map-core';
import type { CustomPointPreset } from '@endfieldmap/map-service/@types/custom_point';
import type { CustomPointNodeSchemaType, DatabaseService } from '@endfieldmap/map-service/service/db/export';
import { BasePresetService, type NodeSelector } from '@endfieldmap/map-service/service/user/data/preset/_base';
import { logger } from '@endfieldmap/tools';
import type { RxCollection } from 'rxdb';

export interface CustomPointPresetDataServiceConfig<T, R> {
  databaseService: DatabaseService<T, R>;
}

export class CustomPointPresetDataService<T, R> extends BasePresetService<CustomPointPreset, CustomPointNodeSchemaType> {
  private databaseService: DatabaseService<T, R>;

  constructor(config: CustomPointPresetDataServiceConfig<T, R>) {
    super();
    this.databaseService = config.databaseService;
  }

  protected get presetDB() {
    return this.databaseService.database.customPointPreset;
  }

  protected get nodesDB(): RxCollection<CustomPointNodeSchemaType> {
    return this.databaseService.database.customPointNode as RxCollection<CustomPointNodeSchemaType>;
  }

  public async changeNodeType(mapId: MapData['id'], presetId: string, levelLogicId: number, newType: string) {
    const nodeId = BasePresetService.createId(mapId, presetId, levelLogicId);
    const doc = await this.nodesDB
      .findOne({ selector: { id: nodeId } as NodeSelector<CustomPointNodeSchemaType> })
      .exec();
    if (!doc) {
      logger.warn(`Node not found for typeChange: ${nodeId}`);
      return;
    }

    await doc.update({ $set: { entityDataIdKey: newType } });
  }

  public clearAllData() {
    return this.presetDB.find().remove();
  }
}
