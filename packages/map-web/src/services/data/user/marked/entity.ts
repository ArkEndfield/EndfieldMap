import type { EntityData, MapData } from '@endfieldmap/map-core';

import { DataService } from '@/services/data';

export class EntityMarkService {
  private get db() {
    return DataService.dbStorage.database.entityMark;
  }

  public static createId(mapId: MapData['id'], id: EntityData['levelLogicId']) {
    return `${mapId}|${id}`;
  }

  public getAllMapMarkData() {
    return this.db.find().exec();
  }

  public async setMarkData(mapId: MapData['id'], entityId: EntityData['levelLogicId'], marked: boolean) {
    const idString = EntityMarkService.createId(mapId, entityId);
    return this.db.upsert({ id: idString, mapId, entityId, marked });
  }

  public addScribe(callback: (mapId: MapData['id'], id: EntityData['levelLogicId'], marked: boolean) => void) {
    this.db.$.subscribe((changeEvent) => {
      switch (changeEvent.operation) {
        case 'INSERT':
        case 'UPDATE':
          callback(changeEvent.documentData.mapId, changeEvent.documentData.entityId, changeEvent.documentData.marked);
          break;
        case 'DELETE':
          callback(changeEvent.documentData.mapId, changeEvent.documentData.entityId, false);
          break;
      }
    });
  }
}
