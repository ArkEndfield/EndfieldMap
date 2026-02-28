import type { EntityData, MapData } from '@endfieldmap/map-core';
import type { VisibilityDataSchemaType } from '@endfieldmap/map-service/service/db/export';
import { BaseUserDataService, type BaseUserDataServiceConfig } from '@endfieldmap/map-service/service/user/data/_base';
import { logger } from '@endfieldmap/tools';

export type EntityVisibilityCallback = (
  mapId: MapData['id'],
  entityKey: EntityData['entityDataIdKey'],
  visible: boolean
) => void;

export class EntityVisibilityService<T, R> extends BaseUserDataService<EntityVisibilityCallback, T, R> {
  constructor(config: BaseUserDataServiceConfig<T, R>) {
    super(config);
  }

  private get db() {
    return this.databaseService.database.entityVisibility;
  }

  public static createId(mapId: MapData['id'], entityKey: string) {
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

  public addSubscribe(callback: EntityVisibilityCallback) {
    this.callbacks.push(callback);
    this.registerDBSubscriptions();
  }

  protected registerDBSubscriptions(): void {
    this.clearSubscriptions();

    const sub = this.db.$.subscribe((changeEvent) => {
      const entityKey = changeEvent.documentData.entityKey;
      if (entityKey.includes(':')) return;

      for (const callback of this.callbacks as EntityVisibilityCallback[]) {
        try {
          switch (changeEvent.operation) {
            case 'INSERT':
            case 'UPDATE':
              callback(
                changeEvent.documentData.mapId,
                entityKey as EntityData['entityDataIdKey'],
                changeEvent.documentData.visible
              );
              break;
            case 'DELETE':
              callback(changeEvent.documentData.mapId, entityKey as EntityData['entityDataIdKey'], false);
              break;
          }
        } catch (e) {
          logger.warn('Entity visibility callback error', e);
        }
      }
    });

    this.subscriptions.push(sub);
  }

  public async clearAllData() {
    await this.db.find().remove();
  }
}

export type ScopedVisibilityCallback = (mapId: MapData['id'], entityKey: string, visible: boolean) => void;

export class ScopedEntityVisibilityService<T, R> extends BaseUserDataService<ScopedVisibilityCallback, T, R> {
  private readonly keyPrefix: string;

  constructor(config: BaseUserDataServiceConfig<T, R>, keyPrefix: string) {
    super(config);
    this.keyPrefix = keyPrefix;
  }

  private get db() {
    return this.databaseService.database.entityVisibility;
  }

  private scopedKey(entityKey: string): string {
    return this.keyPrefix + entityKey;
  }

  private stripPrefix(scopedKey: string): string {
    return scopedKey.startsWith(this.keyPrefix) ? scopedKey.slice(this.keyPrefix.length) : scopedKey;
  }

  public async getAllMapVisibilityData(): Promise<VisibilityDataSchemaType[]> {
    const docs = await this.db.find().exec();
    const result: VisibilityDataSchemaType[] = [];
    for (const d of docs) {
      if (!d.entityKey.startsWith(this.keyPrefix)) continue;
      const entityKey = this.stripPrefix(d.entityKey);
      result.push({
        id: EntityVisibilityService.createId(d.mapId, entityKey),
        entityKey,
        mapId: d.mapId,
        visible: d.visible,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      });
    }
    return result;
  }

  public async setVisibilityData(mapId: MapData['id'], entityKey: string, visible: boolean) {
    const scoped = this.scopedKey(entityKey);
    const idString = EntityVisibilityService.createId(mapId, scoped);
    const now = Date.now();
    const doc = await this.db.findOne({ selector: { id: idString } }).exec();
    if (doc) {
      return doc.update({ $set: { visible, updatedAt: now } });
    }
    return this.db.insert({
      id: idString,
      mapId,
      entityKey: scoped,
      visible,
      createdAt: now,
      updatedAt: now,
    });
  }

  public addSubscribe(callback: ScopedVisibilityCallback) {
    this.callbacks.push(callback);
    this.registerDBSubscriptions();
  }

  protected registerDBSubscriptions(): void {
    this.clearSubscriptions();

    const sub = this.db.$.subscribe((changeEvent) => {
      const data = changeEvent.documentData;
      if (!data.entityKey.startsWith(this.keyPrefix)) return;
      const entityKey = this.stripPrefix(data.entityKey);
      for (const callback of this.callbacks as ScopedVisibilityCallback[]) {
        try {
          switch (changeEvent.operation) {
            case 'INSERT':
            case 'UPDATE':
              callback(data.mapId, entityKey, data.visible);
              break;
            case 'DELETE':
              callback(data.mapId, entityKey, false);
              break;
          }
        } catch (e) {
          logger.warn('Scoped visibility callback error', e);
        }
      }
    });

    this.subscriptions.push(sub);
  }

  public async clearAllData() {
    const docs = await this.db.find().exec();
    const toRemove = docs.filter((d) => d.entityKey.startsWith(this.keyPrefix));
    await Promise.all(toRemove.map((d) => d.remove()));
  }
}
