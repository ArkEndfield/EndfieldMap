import { RxDBCleanupPlugin } from 'rxdb/plugins/cleanup';
import { addRxPlugin, createRxDatabase, type RxDatabase } from 'rxdb/plugins/core';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';

import { GameDataCollections, gameDataCollectionsSchema, UserCollections } from '@/services/data/db/collections';
import { type DBCollections, userDataCollectionsSchema } from '@/services/data/db/collections.ts';
import { isDev } from '@/services/env';

export class Storage {
  // 仅在开发环境使用 AJV 验证，生产环境直接使用 Dexie 存储以提高性能
  public storage = isDev ? wrappedValidateAjvStorage({ storage: getRxStorageDexie() }) : getRxStorageDexie();
  private db?: RxDatabase<DBCollections>;
  private isInitialized = false;
  private user_collections?: UserCollections;
  private game_data_collections?: GameDataCollections;
  public static dbName = 'endfieldmap';

  constructor() {
    if (isDev) {
      addRxPlugin(RxDBDevModePlugin);
    }
    addRxPlugin(RxDBUpdatePlugin);
    addRxPlugin(RxDBCleanupPlugin);
    addRxPlugin(RxDBLeaderElectionPlugin);
  }

  public async init() {
    if (this.isInitialized) {
      return;
    }
    this.db = await createRxDatabase<DBCollections>({
      name: Storage.dbName,
      storage: this.storage,
    });
    await this.initDBSchema();
    this.isInitialized = true;
    await this.migrate();
  }

  private async initDBSchema() {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    await Promise.all([
      this.db.addCollections(userDataCollectionsSchema),
      this.db.addCollections(gameDataCollectionsSchema),
    ]);
    this.user_collections = new UserCollections(this.db);
    this.game_data_collections = new GameDataCollections(this.db);
  }

  public get database() {
    if (!this.db || !this.isInitialized) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  public get collections() {
    if (!this.user_collections || !this.game_data_collections || !this.isInitialized) {
      throw new Error('Collections not initialized');
    }
    return {
      user: this.user_collections,
      gameData: this.game_data_collections,
    };
  }

  private async migrate() {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // 动态导入迁移模块，避免影响主要功能加载
    const { migrateToRxDB } = await import('@/services/data/db/migration');
    await migrateToRxDB(this.db);
  }
}
