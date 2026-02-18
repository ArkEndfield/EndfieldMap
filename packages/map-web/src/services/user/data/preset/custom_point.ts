import type { MapData } from '@endfieldmap/map-core';
import { logger } from '@endfieldmap/tools';
import type { RxCollection } from 'rxdb';

import type { CustomPointPreset } from '@/@types/custom_point';
import { service } from '@/services';
import type { CustomPointNodeSchemaType } from '@endfieldmap/map-service';
import { BasePresetService, type NodeSelector } from '@/services/user/data/preset/_base';

export class CustomPointPresetDataService extends BasePresetService<CustomPointPreset, CustomPointNodeSchemaType> {
  protected get presetDB() {
    return service.databaseService.database.customPointPreset;
  }

  protected get nodesDB(): RxCollection<CustomPointNodeSchemaType> {
    return service.databaseService.database.customPointNode as RxCollection<CustomPointNodeSchemaType>;
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
