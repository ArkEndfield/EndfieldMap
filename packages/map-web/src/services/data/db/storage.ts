import { logger } from '@endfieldmap/tools';
import { computed, makeObservable, observable, runInAction } from 'mobx';
import { RxDBCleanupPlugin } from 'rxdb/plugins/cleanup';
import { addRxPlugin, createRxDatabase, type RxDatabase } from 'rxdb/plugins/core';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';

import {
  GameDataCollections,
  UserCollections,
  type GameDataDBCollections,
  type UserDataDBCollections,
  gameDataCollectionsSchema,
  userDataCollectionsSchema,
} from '@/services/data/db/collections';
import { isDev } from '@/services/env';

/**
 * 用户数据快照，用于迁移
 */
interface UserDataSnapshot {
  electricPoleNode: unknown[];
  electricPolePreset: unknown[];
  electricPoleVisibility: unknown[];
  customPointNode: unknown[];
  customPointPreset: unknown[];
  customPointVisibility: unknown[];
  entityMark: unknown[];
  entityVisibility: unknown[];
}

export class Storage {
  // 仅在开发环境使用 AJV 验证，生产环境直接使用 Dexie 存储以提高性能
  public storage = isDev ? wrappedValidateAjvStorage({ storage: getRxStorageDexie() }) : getRxStorageDexie();

  // 游戏静态数据数据库
  #game_db: RxDatabase<GameDataDBCollections> | null = null;
  // 本地用户数据库 (未登录状态)
  #local_user_db: RxDatabase<UserDataDBCollections> | null = null;
  // 登录用户数据库
  #user_db: RxDatabase<UserDataDBCollections> | null = null;

  // 使用 mobx observable.ref 只监听引用变化
  @observable.ref
  accessor userDBInstance: RxDatabase<UserDataDBCollections> | null = null;

  // Collections 实例
  #game_data_collections: GameDataCollections | null = null;
  #local_user_collections: UserCollections | null = null;
  #user_collections: UserCollections | null = null;

  // 用于数据迁移的临时存储
  #prepareToMigrate: UserDataSnapshot | null = null;

  // 当前登录用户的 UID
  #currentUid: string | number | null = null;

  private isInitialized = false;

  // 数据库名称常量
  public static readonly GAME_DB_NAME = 'endfieldmap_game_data';
  public static readonly LOCAL_USER_DB_NAME = 'endfieldmap_user_data_local';

  constructor() {
    makeObservable(this);

    if (isDev) {
      addRxPlugin(RxDBDevModePlugin);
    }
    addRxPlugin(RxDBUpdatePlugin);
    addRxPlugin(RxDBCleanupPlugin);
    addRxPlugin(RxDBLeaderElectionPlugin);
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
    this.#game_db = await createRxDatabase<GameDataDBCollections>({
      name: Storage.GAME_DB_NAME,
      storage: this.storage,
    });
    await this.#game_db.addCollections(gameDataCollectionsSchema);
    this.#game_data_collections = new GameDataCollections(this.#game_db);

    // 初始化本地用户数据库
    this.#local_user_db = await createRxDatabase<UserDataDBCollections>({
      name: Storage.LOCAL_USER_DB_NAME,
      storage: this.storage,
    });
    await this.#local_user_db.addCollections(userDataCollectionsSchema);
    this.#local_user_collections = new UserCollections(this.#local_user_db);

    // 默认使用本地用户数据库
    runInAction(() => {
      this.userDBInstance = this.#local_user_db;
    });

    this.isInitialized = true;
    await this.migrate();
  }

  /**
   * 获取游戏数据数据库
   */
  @computed
  public get gameDatabase(): RxDatabase<GameDataDBCollections> {
    if (!this.#game_db || !this.isInitialized) {
      throw new Error('Game database not initialized');
    }
    return this.#game_db;
  }

  /**
   * 获取当前活跃的用户数据库
   * 如果已登录返回 user_db，否则返回 local_user_db
   */
  @computed
  public get database(): RxDatabase<UserDataDBCollections> {
    if (this.#user_db) {
      return this.#user_db;
    }
    if (this.#local_user_db) {
      return this.#local_user_db;
    }
    throw new Error('User database not initialized');
  }

  /**
   * 获取游戏数据 collections
   */
  public get gameCollections() {
    if (!this.#game_data_collections || !this.isInitialized) {
      throw new Error('Game data collections not initialized');
    }
    return this.#game_data_collections;
  }

  /**
   * 获取当前活跃的用户数据 collections
   */
  @computed
  public get userCollections(): UserCollections {
    if (this.#user_collections) {
      return this.#user_collections;
    }
    if (this.#local_user_collections) {
      return this.#local_user_collections;
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

  /**
   * 获取当前登录用户的 UID
   */
  public get currentUid() {
    return this.#currentUid;
  }

  /**
   * 创建用户数据库
   * @param uid 用户 ID
   * @param migrate 是否迁移本地数据，默认 false
   */
  public async createUserDB(uid: number | string, migrate: boolean = false): Promise<void> {
    const dbName = `endfieldmap_user_data_${uid}`;

    // 如果已经存在 user_db，需要先销毁
    if (this.#user_db) {
      logger.info(`[Storage] Destroying existing user database for uid: ${this.#currentUid}`);

      // 无论 migrate 为何值都要销毁已存在的 user_db
      await this.#user_db.remove();
      this.#user_db = null;
      this.#user_collections = null;
    }

    // 如果需要迁移，先保存 local_user_db 的数据
    if (migrate && this.#local_user_db && !this.#user_db) {
      logger.info('[Storage] Preparing data migration from local to user database');
      this.#prepareToMigrate = await this.snapshotUserData(this.#local_user_db);
    }

    // 清空 local_user_db 的数据并触发更新事件
    if (this.#local_user_db) {
      await this.clearUserDataWithEvents(this.#local_user_db);
    }

    // 创建新的 user_db
    logger.info(`[Storage] Creating user database: ${dbName}`);
    this.#user_db = await createRxDatabase<UserDataDBCollections>({
      name: dbName,
      storage: this.storage,
    });
    await this.#user_db.addCollections(userDataCollectionsSchema);
    this.#user_collections = new UserCollections(this.#user_db);
    this.#currentUid = uid;

    // 更新 observable 引用
    runInAction(() => {
      this.userDBInstance = this.#user_db;
    });
  }

  /**
   * 移除用户数据库（退出登录）
   * @param migrate 是否迁移用户数据到本地，默认 true
   */
  public async removeUserDB(migrate: boolean = true): Promise<void> {
    if (!this.#user_db) {
      logger.warn('[Storage] No user database to remove');
      return;
    }

    logger.info(`[Storage] Removing user database for uid: ${this.#currentUid}, migrate: ${migrate}`);

    // 如果需要迁移，先保存 user_db 的数据
    if (migrate) {
      this.#prepareToMigrate = await this.snapshotUserData(this.#user_db);
    }

    // 销毁 user_db
    await this.#user_db.remove();
    this.#user_db = null;
    this.#user_collections = null;
    this.#currentUid = null;

    // 更新 observable 引用为 local_user_db
    runInAction(() => {
      this.userDBInstance = this.#local_user_db;
    });
  }

  /**
   * 将待迁移数据迁移到本地数据库
   */
  public async migrateToLocal(): Promise<void> {
    if (!this.#prepareToMigrate) {
      logger.info('[Storage] No data to migrate to local');
      return;
    }

    if (!this.#local_user_db) {
      throw new Error('Local user database not initialized');
    }

    logger.info('[Storage] Migrating data to local database');
    await this.restoreUserData(this.#local_user_db, this.#prepareToMigrate);
    this.#prepareToMigrate = null;
  }

  /**
   * 将待迁移数据迁移到用户数据库
   */
  public async migrateToUser(): Promise<void> {
    if (!this.#prepareToMigrate) {
      logger.info('[Storage] No data to migrate to user');
      return;
    }

    if (!this.#user_db) {
      throw new Error('User database not initialized');
    }

    logger.info('[Storage] Migrating data to user database');
    await this.restoreUserData(this.#user_db, this.#prepareToMigrate);
    this.#prepareToMigrate = null;
  }

  /**
   * 检查是否有待迁移的数据
   */
  public hasPendingMigration(): boolean {
    return this.#prepareToMigrate !== null;
  }

  /**
   * 清除待迁移数据
   */
  public clearPendingMigration(): void {
    this.#prepareToMigrate = null;
  }

  /**
   * 创建用户数据快照
   */
  private async snapshotUserData(db: RxDatabase<UserDataDBCollections>): Promise<UserDataSnapshot> {
    const [
      electricPoleNode,
      electricPolePreset,
      electricPoleVisibility,
      customPointNode,
      customPointPreset,
      customPointVisibility,
      entityMark,
      entityVisibility,
    ] = await Promise.all([
      db.electricPoleNode.find().exec().then((docs) => docs.map((d) => d.toJSON())),
      db.electricPolePreset.find().exec().then((docs) => docs.map((d) => d.toJSON())),
      db.electricPoleVisibility.find().exec().then((docs) => docs.map((d) => d.toJSON())),
      db.customPointNode.find().exec().then((docs) => docs.map((d) => d.toJSON())),
      db.customPointPreset.find().exec().then((docs) => docs.map((d) => d.toJSON())),
      db.customPointVisibility.find().exec().then((docs) => docs.map((d) => d.toJSON())),
      db.entityMark.find().exec().then((docs) => docs.map((d) => d.toJSON())),
      db.entityVisibility.find().exec().then((docs) => docs.map((d) => d.toJSON())),
    ]);

    return {
      electricPoleNode,
      electricPolePreset,
      electricPoleVisibility,
      customPointNode,
      customPointPreset,
      customPointVisibility,
      entityMark,
      entityVisibility,
    };
  }

  /**
   * 恢复用户数据到数据库
   */
  private async restoreUserData(db: RxDatabase<UserDataDBCollections>, snapshot: UserDataSnapshot): Promise<void> {
    await Promise.all([
      db.electricPoleNode.bulkInsert(snapshot.electricPoleNode as never[]),
      db.electricPolePreset.bulkInsert(snapshot.electricPolePreset as never[]),
      db.electricPoleVisibility.bulkInsert(snapshot.electricPoleVisibility as never[]),
      db.customPointNode.bulkInsert(snapshot.customPointNode as never[]),
      db.customPointPreset.bulkInsert(snapshot.customPointPreset as never[]),
      db.customPointVisibility.bulkInsert(snapshot.customPointVisibility as never[]),
      db.entityMark.bulkInsert(snapshot.entityMark as never[]),
      db.entityVisibility.bulkInsert(snapshot.entityVisibility as never[]),
    ]);
  }

  /**
   * 清空用户数据并触发删除事件
   */
  private async clearUserDataWithEvents(db: RxDatabase<UserDataDBCollections>): Promise<void> {
    await Promise.all([
      db.electricPoleNode.find().remove(),
      db.electricPolePreset.find().remove(),
      db.electricPoleVisibility.find().remove(),
      db.customPointNode.find().remove(),
      db.customPointPreset.find().remove(),
      db.customPointVisibility.find().remove(),
      db.entityMark.find().remove(),
      db.entityVisibility.find().remove(),
    ]);
  }

  /**
   * 数据迁移（从旧版本）
   */
  private async migrate() {
    if (!this.#game_db) {
      throw new Error('Game database not initialized');
    }

    // 动态导入迁移模块，避免影响主要功能加载
    const { migrateToRxDB } = await import('@/services/data/db/migration');
    await migrateToRxDB(this.#game_db);
  }
}
