import { RxDBCleanupPlugin } from 'rxdb/plugins/cleanup';
import { addRxPlugin, createRxDatabase, type RxDatabase } from 'rxdb/plugins/core';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';

import { Collections } from '@/services/data/db/collections';
import { collectionsSchema, type DBCollections } from '@/services/data/db/collections.ts';
import { isDev } from '@/services/env';

export class Storage {
  public storage = wrappedValidateAjvStorage({ storage: getRxStorageDexie() });
  private db?: RxDatabase<DBCollections>;
  private isInitialized = false;
  private inner_collections?: Collections;

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
      name: 'endfieldmap',
      storage: this.storage,
    });
    await this.initDBSchema();
    await this.migrate();
    this.isInitialized = true;
  }

  private async initDBSchema() {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    await this.db.addCollections(collectionsSchema);
    this.inner_collections = new Collections(this.db);
  }

  public get database() {
    if (!this.db || !this.isInitialized) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  public get collections() {
    if (!this.inner_collections || !this.isInitialized) {
      throw new Error('Collections not initialized');
    }
    return this.inner_collections;
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
