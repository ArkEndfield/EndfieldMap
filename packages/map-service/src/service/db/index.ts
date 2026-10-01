import { UserLocalStorageKey } from '@endfieldmap/map-service/const/storage';
import {
  GameDataCollections,
  gameDataCollectionsSchema,
  type GameDataDBCollections,
  UserCollections,
  userDataCollectionsSchema,
  type UserDataDBCollections,
} from '@endfieldmap/map-service/service/db/collections';
import { createAuditLogPlugin } from '@endfieldmap/map-service/service/db/plugins/audit-log';
import { LocalStorageValue, logger } from '@endfieldmap/tools';
import { computed, makeObservable, observable, runInAction } from 'mobx';
import { RxDBCleanupPlugin } from 'rxdb/plugins/cleanup';
import {
  addRxPlugin,
  createRxDatabase,
  removeRxDatabase,
  type RxDatabase,
  type RxStorage,
} from 'rxdb/plugins/core';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election';
import { RxDBLocalDocumentsPlugin } from 'rxdb/plugins/local-documents';
import { RxDBMigrationSchemaPlugin } from 'rxdb/plugins/migration-schema';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';

/**
 * 用户数据快照，用于迁移与云端同步（电线杆/自定义标点可见性均在 entityVisibility 中）
 */
interface UserDataSnapshot {
  electricPoleNode: unknown[];
  electricPolePreset: unknown[];
  customPointNode: unknown[];
  customPointPreset: unknown[];
  entityMark: unknown[];
  entityVisibility: unknown[];
  route: unknown[];
}

export interface UserDatabaseScope {
  userId: number;
  roleId: string;
}

export interface DatabaseServiceConfig<Internals, InstanceCreationOptions> {
  isDev?: boolean;
  storage: RxStorage<Internals, InstanceCreationOptions>;
}

function snapshotDocument(doc: { toJSON(withMetaFields: true): unknown }): Record<string, unknown> {
  const {
    syncScope: _scope,
    _rev,
    _meta,
    _attachments,
    _deleted,
    ...data
  } = doc.toJSON(true) as Record<string, unknown>;
  return data;
}

const auditLogPlugin = createAuditLogPlugin({ logger });

export class DatabaseService<Internals, InstanceCreationOptions> {
  // 仅在开发环境使用 AJV 验证，生产环境直接使用 Dexie 存储以提高性能
  public storage: RxStorage<Internals, InstanceCreationOptions>;

  // 游戏静态数据数据库
  private game_db: RxDatabase<GameDataDBCollections> | null = null;
  // 登录用户数据库
  @observable.ref
  accessor user_db: RxDatabase<UserDataDBCollections> | null = null;

  // Collections 实例
  @observable.ref
  accessor game_data_collections: GameDataCollections | null = null;
  @observable.ref
  accessor user_collections: UserCollections | null = null;

  private activeScope = new LocalStorageValue<UserDatabaseScope | null>({
    storageKey: UserLocalStorageKey.DATABASE_SCOPE,
    initialValue: null,
  });

  // 本机出现过的角色库范围登记：解绑角色/登出后 uidList 不再包含该角色，
  // 但其本地库仍在。「清除储存数据」要全量删库就必须依赖这份持久登记，
  // 否则旧库会在重新绑定/登录时被按名打开、旧数据随同步复活。
  private knownScopes = new LocalStorageValue<UserDatabaseScope[]>({
    storageKey: UserLocalStorageKey.KNOWN_DB_SCOPES,
    initialValue: [],
  });

  private isInitialized = false;

  /**
   * 当前持久化的活跃库范围（重启后仍可读）。同步层在内存态缺位时
   * 用它推导 replicationIdentifier。
   */
  public get currentScope(): UserDatabaseScope | null {
    return this.activeScope.value;
  }

  // 数据库名称常量
  public static readonly GAME_DB_NAME = 'endfieldmap_game_data';
  public static readonly USER_DB_NAME = 'endfieldmap_user_data';

  constructor(options: DatabaseServiceConfig<Internals, InstanceCreationOptions>) {
    makeObservable(this);

    if (options.isDev) {
      addRxPlugin(RxDBDevModePlugin);
    }

    this.storage = options.isDev ? wrappedValidateAjvStorage({ storage: options.storage }) : options.storage;

    addRxPlugin(RxDBLocalDocumentsPlugin);
    addRxPlugin(RxDBMigrationSchemaPlugin);
    addRxPlugin(RxDBUpdatePlugin);
    addRxPlugin(RxDBCleanupPlugin);
    addRxPlugin(RxDBLeaderElectionPlugin);
    addRxPlugin(auditLogPlugin);
  }

  /**
   * 初始化存储服务
   * 只初始化 game_db 和 local_user_db
   */
  public async init() {
    if (this.isInitialized) {
      return;
    }

    // 初始化游戏数据数据库
    this.game_db = await createRxDatabase<GameDataDBCollections>({
      name: DatabaseService.GAME_DB_NAME,
      storage: this.storage,
    });
    await this.game_db.addCollections(gameDataCollectionsSchema);
    this.game_data_collections = new GameDataCollections(this.game_db);

    // 初始化本地用户数据库
    this.user_db = await createRxDatabase<UserDataDBCollections>({
      name: DatabaseService.userDatabaseName(this.activeScope.value ?? undefined),
      storage: this.storage,
      localDocuments: true,
    });
    await this.user_db.addCollections(userDataCollectionsSchema);
    this.user_collections = new UserCollections(this.user_db);

    this.isInitialized = true;
  }

  /**
   * 获取游戏数据数据库
   */
  @computed
  public get gameDatabase(): RxDatabase<GameDataDBCollections> {
    if (!this.game_db || !this.isInitialized) {
      throw new Error('Game database not initialized');
    }
    return this.game_db;
  }

  /**
   * 获取当前活跃的用户数据库
   * 如果已登录返回 user_db，否则返回 local_user_db
   */
  @computed
  public get database(): RxDatabase<UserDataDBCollections> {
    if (this.user_db) {
      return this.user_db;
    }
    throw new Error('User database not initialized');
  }

  /**
   * 获取游戏数据 collections
   */
  public get gameCollections() {
    if (!this.game_data_collections || !this.isInitialized) {
      throw new Error('Game data collections not initialized');
    }
    return this.game_data_collections;
  }

  /**
   * 获取当前活跃的用户数据 collections
   */
  @computed
  public get userCollections(): UserCollections {
    if (this.user_collections) {
      return this.user_collections;
    }
    throw new Error('User collections not initialized');
  }

  /**
   * 获取所有 collections（保持向后兼容）
   */
  @computed
  public get collections() {
    return {
      user: this.userCollections,
      gameData: this.gameCollections,
    };
  }

  public static userDatabaseName(scope?: UserDatabaseScope): string {
    if (!scope) return DatabaseService.USER_DB_NAME;
    if (!Number.isSafeInteger(scope.userId) || scope.userId <= 0 || !/^\d+$/.test(scope.roleId)) {
      throw new Error('Invalid user database scope');
    }
    return `${DatabaseService.USER_DB_NAME}_u${scope.userId}_r${scope.roleId}`;
  }

  public async createUserDB(
    migrate: boolean = false,
    scope?: UserDatabaseScope,
    legacyOnly: boolean = false
  ): Promise<void> {
    const dbName = DatabaseService.userDatabaseName(scope);
    const prevUserDB = this.user_db;
    if (prevUserDB?.name === dbName) return;

    if (legacyOnly && prevUserDB && (await prevUserDB.getLocal('sync-legacy-imported'))) migrate = false;
    const snapshot = migrate && prevUserDB ? await this.snapshotUserData(prevUserDB) : null;
    await prevUserDB?.close();
    let newDb: RxDatabase<UserDataDBCollections> | undefined;
    try {
      newDb = await createRxDatabase<UserDataDBCollections>({
        name: dbName,
        storage: this.storage,
        localDocuments: true,
      });
      await newDb.addCollections(userDataCollectionsSchema);
      if (snapshot) await this.restoreUserData(newDb, snapshot);
      if (scope && prevUserDB?.name === DatabaseService.USER_DB_NAME) {
        const legacy = await createRxDatabase({ name: prevUserDB.name, storage: this.storage, localDocuments: true });
        try {
          await legacy.upsertLocal('sync-legacy-imported', { database: dbName });
        } finally {
          await legacy.close();
        }
      }
    } catch (error) {
      await newDb?.close();
      if (prevUserDB) {
        const restored = await createRxDatabase<UserDataDBCollections>({
          name: prevUserDB.name,
          storage: this.storage,
          localDocuments: true,
        });
        await restored.addCollections(userDataCollectionsSchema);
        runInAction(() => {
          this.user_db = restored;
          this.user_collections = new UserCollections(restored);
        });
      } else {
        // 原库已被物理丢弃（清除储存数据/不保留）后重建失败时 prevUserDB 为 null：
        // 兜底重建 legacy 空库句柄，避免 user_db 永久为 null 让全部用户数据操作
        // 抛错直到重启。兜底也失败则维持原错误抛出。
        try {
          const fallback = await createRxDatabase<UserDataDBCollections>({
            name: DatabaseService.USER_DB_NAME,
            storage: this.storage,
            localDocuments: true,
          });
          await fallback.addCollections(userDataCollectionsSchema);
          runInAction(() => {
            this.user_db = fallback;
            this.user_collections = new UserCollections(fallback);
          });
          this.activeScope.value = null;
        } catch (fallbackError) {
          logger.error('[DatabaseService] Fallback legacy db creation failed:', fallbackError);
        }
      }
      throw error;
    }
    const activeDb = newDb;
    runInAction(() => {
      this.user_db = activeDb;
      this.user_collections = new UserCollections(activeDb);
      this.activeScope.value = scope ?? null;
    });
    if (scope) this.recordKnownScope(scope);
  }

  private recordKnownScope(scope: UserDatabaseScope): void {
    const current = this.knownScopes.value ?? [];
    if (current.some((s) => s.userId === scope.userId && s.roleId === scope.roleId)) return;
    this.knownScopes.value = [...current, scope];
  }

  /**
   * 本机登记过的全部角色库范围（跨登录会话持久）。
   */
  public getKnownScopes(): UserDatabaseScope[] {
    return this.knownScopes.value ?? [];
  }

  /**
   * 创建用户数据快照
   */
  private async snapshotUserData(db: RxDatabase<UserDataDBCollections>): Promise<UserDataSnapshot> {
    const [
      electricPoleNode,
      electricPolePreset,
      customPointNode,
      customPointPreset,
      entityMark,
      entityVisibility,
      route,
    ] = await Promise.all([
      db.electricPoleNode
        .find()
        .exec()
        .then((docs) => docs.map(snapshotDocument)),
      db.electricPolePreset
        .find()
        .exec()
        .then((docs) => docs.map(snapshotDocument)),
      db.customPointNode
        .find()
        .exec()
        .then((docs) => docs.map(snapshotDocument)),
      db.customPointPreset
        .find()
        .exec()
        .then((docs) => docs.map(snapshotDocument)),
      db.entityMark
        .find()
        .exec()
        .then((docs) => docs.map(snapshotDocument)),
      db.entityVisibility
        .find()
        .exec()
        .then((docs) => docs.map(snapshotDocument)),
      db.route
        .find()
        .exec()
        .then((docs) => docs.map(snapshotDocument)),
    ]);

    return {
      electricPoleNode,
      electricPolePreset,
      customPointNode,
      customPointPreset,
      entityMark,
      entityVisibility,
      route,
    };
  }

  /**
   * 恢复用户数据到数据库。目标已存在（409）的文档按 updatedAt 做 LWW：
   * 登出→编辑→再登录的往返中，较新编辑必须胜过目标库里的旧副本——
   * 早期版本把 409 直接吞掉，登出视图会永久冻结在首次登出时的数据。
   */
  private async restoreUserData(db: RxDatabase<UserDataDBCollections>, snapshot: UserDataSnapshot): Promise<void> {
    const failures: unknown[] = [];
    const plans: Array<{ collection: keyof UserDataDBCollections; docs: unknown[] }> = [
      { collection: 'electricPoleNode', docs: snapshot.electricPoleNode },
      { collection: 'electricPolePreset', docs: snapshot.electricPolePreset },
      { collection: 'customPointNode', docs: snapshot.customPointNode },
      { collection: 'customPointPreset', docs: snapshot.customPointPreset },
      { collection: 'entityMark', docs: snapshot.entityMark },
      { collection: 'entityVisibility', docs: snapshot.entityVisibility },
      { collection: 'route', docs: snapshot.route },
    ];
    for (const { collection, docs } of plans) {
      const result = await db[collection].bulkInsert(docs as never[]);
      const conflicts = result.error.filter((error) => error.status === 409);
      failures.push(...result.error.filter((error) => error.status !== 409));
      if (conflicts.length === 0) continue;

      const existing = await db[collection]
        .findByIds(conflicts.map((error) => error.documentId))
        .exec();
      const newer: unknown[] = [];
      for (const doc of docs as Array<Record<string, unknown>>) {
        const id = String(doc?.id ?? '');
        const target = existing.get(id);
        if (!target) continue;
        if (Number(doc.updatedAt ?? 0) > Number(target.updatedAt ?? 0)) {
          newer.push(doc);
        } else {
          logger.debug(`[DatabaseService] restore keeps newer local ${collection}/${id}`);
        }
      }
      if (newer.length > 0) {
        const upsert = await db[collection].bulkUpsert(newer as never[]);
        failures.push(...upsert.error);
      }
    }
    if (failures.length > 0) {
      throw new AggregateError(failures, 'Failed to restore user data');
    }
  }

  /**
   * 清空用户数据并触发删除事件
   */
  public async clearUserDataWithEvents(_db?: RxDatabase<UserDataDBCollections>): Promise<void> {
    const db = _db ?? this.database;
    await Promise.all([
      db.electricPoleNode.find().remove(),
      db.electricPolePreset.find().remove(),
      db.customPointNode.find().remove(),
      db.customPointPreset.find().remove(),
      db.entityMark.find().remove(),
      db.entityVisibility.find().remove(),
      db.route.find().remove(),
    ]);
  }

  /**
   * 物理丢弃指定范围的本地用户库（文档、墓碑与 replication 元数据一并抹掉，
   * 云端不受影响）。供「不保留本地」「清除储存数据」这类以云端为准的重置用：
   * 软删 + 停同步的组合会把墓碑留到下次登录推上云，整体丢弃才是干净的。
   * 调用前必须已停止同步（stopSync / stopSyncAndPurgeMeta）。
   * 不传 scope 时丢弃【当前活跃】的库（角色库或未登录的本地库）。
   */
  public async removeUserDatabase(scope?: UserDatabaseScope): Promise<void> {
    if (scope) {
      const dbName = DatabaseService.userDatabaseName(scope);
      const wasActive = this.user_db?.name === dbName;
      if (wasActive) {
        await this.discardActiveUserDb();
      }
      try {
        await removeRxDatabase(dbName, this.storage);
      } catch (error) {
        // 与无 scope 分支同口径：句柄已丢弃后删除失败要尽力恢复，
        // 否则「不保留」换库中途失败会让后续一切换库操作抛错直到刷新
        if (wasActive) {
          await this.restoreUserDbHandle(dbName);
        }
        throw error;
      }
      return;
    }
    if (this.user_db) {
      const name = this.user_db.name;
      await this.discardActiveUserDb();
      try {
        await removeRxDatabase(name, this.storage);
      } catch (error) {
        // 丢弃句柄后删除失败（多标签页占用/配额/瞬时 IO）：尽力恢复一个
        // 可用句柄，避免 user_db 永久为 null；原始错误照常上抛
        await this.restoreUserDbHandle(name);
        throw error;
      }
    } else {
      await removeRxDatabase(DatabaseService.USER_DB_NAME, this.storage);
    }
    this.activeScope.value = null;
  }

  /**
   * 物理丢弃本地全部用户库：legacy 库、当前活跃库、持久登记过的全部角色库
   * 与调用方补充的范围（登录态下的实时 uidList）。解绑角色/登出后 uidList
   * 不再覆盖的库靠 knownScopes 登记补齐——否则旧库在重新绑定/登录时被按名
   * 打开，旧数据随同步复活（「清了又回来」）。
   * 调用前必须已停止同步。
   */
  public async removeAllUserDatabases(extraScopes: UserDatabaseScope[] = []): Promise<void> {
    const names = new Set<string>([DatabaseService.USER_DB_NAME]);
    if (this.user_db) names.add(this.user_db.name);
    for (const scope of [...this.getKnownScopes(), ...extraScopes]) {
      try {
        names.add(DatabaseService.userDatabaseName(scope));
      } catch {
        // 无效 scope（角色 id 非数字等）直接忽略，只清能确定的库
      }
    }
    const activeName = this.user_db?.name;
    if (this.user_db) await this.discardActiveUserDb();

    const failures: unknown[] = [];
    for (const name of names) {
      try {
        await removeRxDatabase(name, this.storage);
      } catch (error) {
        failures.push(error);
        logger.error(`[DatabaseService] Failed to remove database ${name}:`, error);
      }
    }
    if (failures.length > 0) {
      // 只要有失败就恢复一个可用句柄（活跃库已删则重建空 legacy），避免
      // user_db 永久为 null 让后续 logout/换库链路整体抛错
      await this.restoreUserDbHandle(activeName ?? DatabaseService.USER_DB_NAME);
      throw new AggregateError(failures, 'Failed to remove user databases');
    }
    this.activeScope.value = null;
    this.knownScopes.value = [];
  }

  private async restoreUserDbHandle(name: string): Promise<void> {
    try {
      const restored = await createRxDatabase<UserDataDBCollections>({
        name,
        storage: this.storage,
        localDocuments: true,
      });
      await restored.addCollections(userDataCollectionsSchema);
      runInAction(() => {
        this.user_db = restored;
        this.user_collections = new UserCollections(restored);
      });
    } catch (restoreError) {
      logger.error(`[DatabaseService] Failed to restore db handle for ${name}:`, restoreError);
    }
  }

  private async discardActiveUserDb(): Promise<void> {
    if (!this.user_db) return;
    await this.user_db.close();
    runInAction(() => {
      this.user_db = null;
      this.user_collections = null;
    });
  }
}
