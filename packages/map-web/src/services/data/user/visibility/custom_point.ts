import type { MapData } from '@endfieldmap/map-core';

import { DataService } from '@/services/data';

export class CustomPointVisibilityService {
  private get db() {
    return DataService.dbStorage.database.customPointVisibility;
  }

  public static createId(mapId: MapData['id'], entityKey: string) {
    return `${mapId}|${entityKey}`;
  }

  public getAllMapVisibilityData() {
    return this.db.find().exec();
  }

  public async setVisibilityData(mapId: MapData['id'], entityKey: string, visible: boolean) {
    const idString = CustomPointVisibilityService.createId(mapId, entityKey);
    const data = await this.db
      .findOne({
        selector: {
          id: idString,
          mapId,
          entityKey,
        },
      })
      .exec();
    if (data) {
      await data.update({
        $set: {
          visible,
        },
      });
      return data;
    }
    return this.db.insert({ id: idString, mapId, entityKey, visible });
  }

  public addSubscribe(callback: (mapId: MapData['id'], entityKey: string, visible: boolean) => void) {
    this.db.$.subscribe((changeEvent) => {
      switch (changeEvent.operation) {
        case 'INSERT':
        case 'UPDATE':
          callback(
            changeEvent.documentData.mapId,
            changeEvent.documentData.entityKey,
            changeEvent.documentData.visible
          );
          break;
        case 'DELETE':
          callback(changeEvent.documentData.mapId, changeEvent.documentData.entityKey, false);
          break;
      }
    });
  }
}
