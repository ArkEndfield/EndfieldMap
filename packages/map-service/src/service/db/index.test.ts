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

  it('restoreUserData applies last-write-wins on 409 instead of dropping newer edits', async () => {
    const db = await createService();
    // legacy 持有旧版本
    await db.database.entityMark.insert({
      id: 'm|1', mapId: 'm', entityId: 1, marked: false, createdAt: 1, updatedAt: 10,
    });
    // 角色库通过首次迁移拿到 @10 副本
    await db.createUserDB(true, { userId: 32, roleId: '0' });
    // 回到 legacy 并在登出态继续编辑（updatedAt 前进到 20）
    await db.createUserDB(false);
    await (await db.database.entityMark.findOne('m|1').exec())?.incrementalPatch({
      marked: true,
      updatedAt: 20,
    });
    // 再次迁移：目标角色库已有 @10 旧副本，快照 @20 较新——409 必须被 LWW 覆盖
    await db.createUserDB(true, { userId: 32, roleId: '0' });
    const doc = await db.database.entityMark.findOne('m|1').exec();
    expect(doc?.marked).toBe(true);
    expect(doc?.updatedAt).toBe(20);
  });

  it('removeUserDatabase physically discards the active role database', async () => {
    const db = await createService();
    await db.database.entityMark.insert({
      id: 'm|1', mapId: 'm', entityId: 1, marked: true, createdAt: 1, updatedAt: 2,
    });
    await db.createUserDB(true, { userId: 32, roleId: '0' });
    await db.database.entityMark.insert({
      id: 'm|2', mapId: 'm', entityId: 2, marked: true, createdAt: 1, updatedAt: 3,
    });
    const roleName = db.database.name;
    await db.removeUserDatabase();
    expect(db.user_db).toBeNull();
    // 重新打开同名库应当是全新的：旧文档、墓碑与 replication 元数据都不复存在
    await db.createUserDB(false, { userId: 32, roleId: '0' });
    expect(db.database.name).toBe(roleName);
    expect(await db.database.entityMark.find().exec()).toHaveLength(0);
  });

  it('removeAllUserDatabases discards legacy, active and registry-recorded role databases', async () => {
    const db = await createService();
    await db.database.entityMark.insert({
      id: 'm|1', mapId: 'm', entityId: 1, marked: true, createdAt: 1, updatedAt: 2,
    });
    await db.createUserDB(true, { userId: 32, roleId: '0' });
    await db.database.entityMark.insert({
      id: 'm|2', mapId: 'm', entityId: 2, marked: true, createdAt: 1, updatedAt: 3,
    });
    // 第二个角色库（模拟事后被解绑、不在实时 uidList 里的角色）
    await db.createUserDB(false, { userId: 32, roleId: '1429794416' });
    await db.database.entityMark.insert({
      id: 'm|3', mapId: 'm', entityId: 3, marked: true, createdAt: 1, updatedAt: 4,
    });
    // 持久登记覆盖两个角色，即使调用方只补充活跃角色
    expect(db.getKnownScopes()).toEqual(
      expect.arrayContaining([{ userId: 32, roleId: '0' }, { userId: 32, roleId: '1429794416' }])
    );

    await db.removeAllUserDatabases([{ userId: 32, roleId: '1429794416' }]);
    expect(db.user_db).toBeNull();
    expect(db.getKnownScopes()).toEqual([]);

    // 登记过的每个库重开都应为空：旧数据不再随按名打开复活
    await db.createUserDB(false, { userId: 32, roleId: '1429794416' });
    expect(await db.database.entityMark.find().exec()).toHaveLength(0);
    await db.createUserDB(false, { userId: 32, roleId: '0' });
    expect(await db.database.entityMark.find().exec()).toHaveLength(0);
    await db.createUserDB(false);
    expect(await db.database.entityMark.find().exec()).toHaveLength(0);
  });
});
