import type { EntityData, MapData } from '@endfieldmap/map-core';
import type { VisibilityDataSchemaType } from '@endfieldmap/map-service/service/db/export';
import { BaseUserDataService, type BaseUserDataServiceConfig } from '@endfieldmap/map-service/service/user/data/_base';

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

  private displayedVisibility = new Map<string, { mapId: string; entityKey: string; visible: boolean }>();

  public override updateDB(): void {
    this.registerDBSubscriptions();
  }

  protected registerDBSubscriptions(): void {
    this.clearSubscriptions();
    this.subscriptions.push(
      this.db.find().$.subscribe((allDocs) => {
        const docs = allDocs
          .filter((doc) => !doc.entityKey.includes(':'))
          .map((doc) => ({
            id: doc.id,
            mapId: doc.mapId,
            entityKey: doc.entityKey,
            visible: doc.visible,
          }));
        const next = new Map(docs.map((doc) => [doc.id, doc]));
        for (const [id, previous] of this.displayedVisibility) {
          if (!next.has(id)) this.executeCallbacks(previous.mapId, previous.entityKey, true);
        }
        for (const doc of docs) {
          if (this.displayedVisibility.get(doc.id)?.visible !== doc.visible) {
            this.executeCallbacks(doc.mapId, doc.entityKey, doc.visible);
          }
        }
        this.displayedVisibility = next;
      })
    );
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

  private displayedVisibility = new Map<string, { mapId: string; entityKey: string; visible: boolean }>();

  public override updateDB(): void {
    this.registerDBSubscriptions();
  }

  protected registerDBSubscriptions(): void {
    this.clearSubscriptions();
    this.subscriptions.push(
      this.db.find().$.subscribe((allDocs) => {
        const docs = allDocs
          .filter((doc) => doc.entityKey.startsWith(this.keyPrefix))
          .map((doc) => ({
            id: doc.id,
            mapId: doc.mapId,
            entityKey: this.stripPrefix(doc.entityKey),
            visible: doc.visible,
          }));
        const next = new Map(docs.map((doc) => [doc.id, doc]));
        for (const [id, previous] of this.displayedVisibility) {
          if (!next.has(id)) this.executeCallbacks(previous.mapId, previous.entityKey, true);
        }
        for (const doc of docs) {
          if (this.displayedVisibility.get(doc.id)?.visible !== doc.visible) {
            this.executeCallbacks(doc.mapId, doc.entityKey, doc.visible);
          }
        }
        this.displayedVisibility = next;
      })
    );
  }

  public async clearAllData() {
    const docs = await this.db.find().exec();
    const toRemove = docs.filter((d) => d.entityKey.startsWith(this.keyPrefix));
    await Promise.all(toRemove.map((d) => d.remove()));
  }
}
