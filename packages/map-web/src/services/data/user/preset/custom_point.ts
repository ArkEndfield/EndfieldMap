import type { MapData } from '@endfieldmap/map-core';
import { logger } from '@endfieldmap/tools';
import type { RxCollection } from 'rxdb';

import type { CustomPointPreset } from '@/@types/custom_point';
import { DataService } from '@/services/data';
import type { CustomPointNodeSchemaType } from '@/services/data/db/schema/custom_point';
import { BasePresetService, type NodeSelector } from '@/services/data/user/preset/_base';

export class CustomPointPresetDataService extends BasePresetService<CustomPointPreset, CustomPointNodeSchemaType> {
  protected get presetDB() {
    return DataService.dbStorage.database.customPointPreset;
  }

  protected get nodesDB(): RxCollection<CustomPointNodeSchemaType> {
    return DataService.dbStorage.database.customPointNode as RxCollection<CustomPointNodeSchemaType>;
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
}
