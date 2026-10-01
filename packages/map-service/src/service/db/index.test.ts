import { createRxDatabase, removeRxDatabase } from 'rxdb/plugins/core';
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { preferences } = vi.hoisted(() => ({ preferences: new Map<string, unknown>() }));
vi.mock('@endfieldmap/tools', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  LocalStorageValue: class<T> {
    constructor(private config: { storageKey: string; initialValue: T }) {}
    get value(): T {
      return (preferences.get(this.config.storageKey) as T) ?? this.config.initialValue;
    }
    set value(value: T) {
      preferences.set(this.config.storageKey, value);
    }
  },
}));

import { EntityMarkService } from '../user/data/marked/entity';
import { EntityVisibilityService } from '../user/data/visibility/entity';
import { DatabaseService } from './index';
import { markDataSchema } from './schema/user_data/mark';

describe('role database isolation', () => {
  let database: DatabaseService<unknown, unknown>;
  beforeEach(() => {
    preferences.clear();
  });
  afterEach(async () => {
    if (database) {
      await database.database.close();
      await database.gameDatabase.close();
      for (const name of [
        DatabaseService.GAME_DB_NAME,
        DatabaseService.USER_DB_NAME,
        DatabaseService.userDatabaseName({ userId: 32, roleId: '0' }),
        DatabaseService.userDatabaseName({ userId: 32, roleId: '1429794416' }),
        DatabaseService.userDatabaseName({ userId: 33, roleId: '0' }),
      ]) {
        await removeRxDatabase(name, database.storage);
      }
    }
  });

  const createService = async () => {
    database = new DatabaseService({ storage: getRxStorageMemory(), isDev: true });
    await database.init();
    return database;
  };

  it('retains source data, omits tombstones when merging, and restores a cached role', async () => {
    const db = await createService();
    const source = db.database;
    const mark = { id: 'm|1', mapId: 'm', entityId: 1, marked: true, createdAt: 1, updatedAt: 2 };
    await source.entityMark.insert({ ...mark, syncScope: 'old-role' });
    await source.entityMark.insert({ ...mark, id: 'm|2', entityId: 2 });
    await (await source.entityMark.findOne('m|2').exec())?.remove();
    const deleted = vi.fn();
    source.entityMark.$.subscribe((event) => {
      if (event.operation === 'DELETE') deleted();
    });

    await db.createUserDB(true, { userId: 32, roleId: '0' });
    expect(deleted).not.toHaveBeenCalled();
    expect((await db.database.entityMark.find().exec()).map((doc) => doc.id)).toEqual(['m|1']);
    expect((await db.database.entityMark.findOne('m|1').exec())?.syncScope).toBeUndefined();
    await db.database.entityMark.insert({ ...mark, id: 'm|3', entityId: 3 });

    await db.createUserDB(false, { userId: 32, roleId: '1429794416' });
    expect(await db.database.entityMark.find().exec()).toHaveLength(0);
    await db.createUserDB(false, { userId: 32, roleId: '0' });
    expect(await db.database.entityMark.find().exec()).toHaveLength(2);
    await db.createUserDB(false, { userId: 33, roleId: '0' });
    expect(await db.database.entityMark.find().exec()).toHaveLength(0);
  });

  it('reopens the selected role after refresh and imports legacy data only once', async () => {
    const db = await createService();
    await db.database.entityMark.insert({
      id: 'm|1',
      mapId: 'm',
      entityId: 1,
      marked: true,
      createdAt: 1,
      updatedAt: 2,
    });
    await db.createUserDB(true, { userId: 32, roleId: '0' }, true);
    await (await db.database.entityMark.findOne('m|1').exec())?.remove();
    await db.database.close();
    await db.gameDatabase.close();
    await createService();
    expect(database.database.name).toBe(DatabaseService.userDatabaseName({ userId: 32, roleId: '0' }));
    expect(await database.database.entityMark.find().exec()).toHaveLength(0);
    await database.createUserDB(false);
    await database.createUserDB(true, { userId: 32, roleId: '0' }, true);
    expect(await database.database.entityMark.find().exec()).toHaveLength(0);
  });

  it('migrates the version 0 schema without losing live documents or tombstones', async () => {
    database = new DatabaseService({ storage: getRxStorageMemory(), isDev: true });
    const legacy = await createRxDatabase({ name: DatabaseService.USER_DB_NAME, storage: database.storage });
    const { syncScope: _scope, ...properties } = structuredClone(markDataSchema.properties);
    const schema = { ...markDataSchema, version: 0, properties };
    await legacy.addCollections({ entityMark: { schema } });
    const mark = { id: 'm|1', mapId: 'm', entityId: 1, marked: true, createdAt: 1, updatedAt: 2 };
    await legacy.entityMark.insert(mark);
    await legacy.entityMark.insert({ ...mark, id: 'm|2', entityId: 2 });
    await (await legacy.entityMark.findOne('m|2').exec())?.remove();
    await legacy.close();
    await database.init();
    expect(database.database.entityMark.schema.version).toBe(1);
    expect(await database.database.entityMark.find().exec()).toHaveLength(1);
    const tombstones = await database.database.entityMark.storageInstance.findDocumentsById(['m|2'], true);
    expect(tombstones[0]._deleted).toBe(true);
  });

  it('refreshes rendered marks and visibility without database deletion events', async () => {
    const db = await createService();
    const marks = new EntityMarkService({ databaseService: db });
    const visibility = new EntityVisibilityService({ databaseService: db });
    const markCallback = vi.fn();
    const visibleCallback = vi.fn();
    marks.addSubscribe(markCallback);
    visibility.addSubscribe(visibleCallback);
    await marks.setMarkData('m', 1, true);
    await visibility.setVisibilityData('m', 'e', false);
    await vi.waitFor(() => expect(markCallback).toHaveBeenCalledWith('m', 1, true));
    await vi.waitFor(() => expect(visibleCallback).toHaveBeenCalledWith('m', 'e', false));
    await db.createUserDB(false, { userId: 32, roleId: '0' });
    marks.updateDB();
    visibility.updateDB();
    await vi.waitFor(() => expect(markCallback).toHaveBeenCalledWith('m', 1, false));
    await vi.waitFor(() => expect(visibleCallback).toHaveBeenCalledWith('m', 'e', true));
    expect(await db.database.entityMark.find().exec()).toHaveLength(0);
  });
});
