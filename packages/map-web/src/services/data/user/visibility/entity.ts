import type { EntityData, MapData } from '@endfieldmap/map-core';

import { DataService } from '@/services/data';

export class EntityVisibilityService {
  private get db() {
    return DataService.dbStorage.database.entityVisibility;
  }

  public static createId(mapId: MapData['id'], entityKey: EntityData['entityDataIdKey']) {
    return `${mapId}|${entityKey}`;
  }

  public getAllMapVisibilityData() {
    return this.db.find().exec();
  }

  public async setVisibilityData(mapId: MapData['id'], entityKey: EntityData['entityDataIdKey'], visible: boolean) {
    const idString = EntityVisibilityService.createId(mapId, entityKey);
    const now = Date.now();
    const doc = await this.db.findOne({ selector: { id: idString } }).exec();
    if (doc) {
      return doc.update({ $set: { visible, updatedAt: now } });
    }
    return this.db.insert({ id: idString, mapId, entityKey, visible, createdAt: now, updatedAt: now });
  }

  public addSubscribe(
    callback: (mapId: MapData['id'], entityKey: EntityData['entityDataIdKey'], visible: boolean) => void
  ) {
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

  public async clearAllData() {
    await this.db.find().remove();
  }
}
