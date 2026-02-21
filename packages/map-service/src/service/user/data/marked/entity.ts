import type { EntityData, MapData } from '@endfieldmap/map-core';
import { BaseUserDataService, type BaseUserDataServiceConfig } from '@endfieldmap/map-service/service/user/data/_base';
import { logger } from '@endfieldmap/tools';

export type EntityMarkCallback = (mapId: MapData['id'], id: EntityData['levelLogicId'], marked: boolean) => void;

export class EntityMarkService<T, R> extends BaseUserDataService<EntityMarkCallback, T, R> {
  protected callbacks: EntityMarkCallback[] = [];
  constructor(config: BaseUserDataServiceConfig<T, R>) {
    super(config);
  }

  private get db() {
    return this.databaseService.database.entityMark;
  }

  public static createId(mapId: MapData['id'], id: EntityData['levelLogicId']) {
    return `${mapId}|${id}`;
  }

  public getAllMapMarkData() {
    return this.db.find().exec();
  }

  public async setMarkData(mapId: MapData['id'], entityId: EntityData['levelLogicId'], marked: boolean) {
    const idString = EntityMarkService.createId(mapId, entityId);
    const now = Date.now();
    const doc = await this.db.findOne({ selector: { id: idString } }).exec();
    if (doc) {
      return doc.update({ $set: { marked, updatedAt: now } });
    }
    return this.db.insert({ id: idString, mapId, entityId, marked, createdAt: now, updatedAt: now });
  }

  public addSubscribe(callback: EntityMarkCallback) {
    this.callbacks.push(callback);
    this.registerDBSubscriptions();
  }

  protected registerDBSubscriptions(): void {
    this.clearSubscriptions();

    const sub = this.db.$.subscribe((changeEvent) => {
      for (const callback of this.callbacks as EntityMarkCallback[]) {
        try {
          switch (changeEvent.operation) {
            case 'INSERT':
            case 'UPDATE':
              callback(
                changeEvent.documentData.mapId,
                changeEvent.documentData.entityId,
                changeEvent.documentData.marked
              );
              break;
            case 'DELETE':
              callback(changeEvent.documentData.mapId, changeEvent.documentData.entityId, false);
              break;
          }
        } catch (e) {
          logger.error('[EntityMarkService] Callback error', e);
        }
      }
    });

    this.subscriptions.push(sub);
  }

  /** @deprecated Use addSubscribe instead */
  public addScribe(callback: EntityMarkCallback) {
    this.addSubscribe(callback);
  }

  public clearAllData() {
    return this.db.find().remove();
  }
}
