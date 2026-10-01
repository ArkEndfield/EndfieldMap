import type { EntityData, MapData } from '@endfieldmap/map-core';
import { BaseUserDataService, type BaseUserDataServiceConfig } from '@endfieldmap/map-service/service/user/data/_base';

export type EntityMarkCallback = (mapId: MapData['id'], id: EntityData['levelLogicId'], marked: boolean) => void;

export class EntityMarkService<T, R> extends BaseUserDataService<EntityMarkCallback, T, R> {
  protected callbacks: EntityMarkCallback[] = [];
  private displayedMarks = new Map<string, { mapId: string; entityId: number; marked: boolean }>();
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

  public async setMarkDataBulk(mapId: MapData['id'], entityIds: EntityData['levelLogicId'][], marked: boolean) {
    if (!entityIds.length) return;
    const now = Date.now();
    const idStrings = entityIds.map((entityId) => EntityMarkService.createId(mapId, entityId));
    const existingDocs = await this.db.find({ selector: { id: { $in: idStrings } } }).exec();
    const createdAtById = new Map(existingDocs.map((doc) => [doc.id, doc.createdAt]));
    return this.db.bulkUpsert(
      idStrings.map((id, index) => ({
        id,
        mapId,
        entityId: entityIds[index],
        marked,
        createdAt: createdAtById.get(id) ?? now,
        updatedAt: now,
      }))
    );
  }

  public addSubscribe(callback: EntityMarkCallback) {
    this.callbacks.push(callback);
    this.registerDBSubscriptions();
  }

  public override updateDB(): void {
    this.registerDBSubscriptions();
  }

  protected registerDBSubscriptions(): void {
    this.clearSubscriptions();
    this.subscriptions.push(
      this.db.find().$.subscribe((docs) => {
        const next = new Map(docs.map((doc) => [doc.id, doc]));
        for (const [id, previous] of this.displayedMarks) {
          if (!next.has(id)) this.executeCallbacks(previous.mapId, previous.entityId, false);
        }
        for (const doc of docs) {
          if (this.displayedMarks.get(doc.id)?.marked !== doc.marked) {
            this.executeCallbacks(doc.mapId, doc.entityId, doc.marked);
          }
        }
        this.displayedMarks = next;
      })
    );
  }

  public clearAllData() {
    return this.db.find().remove();
  }
}
