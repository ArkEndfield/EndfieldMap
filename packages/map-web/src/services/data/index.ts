import { JSONLoader, StorageManager } from '@endfieldmap/tools';

import { Storage } from '@/services/data/db/storage';
import { getSyncManager, type SyncManager } from '@/services/data/sync/manager';

export class DataService {
  public static storage = new StorageManager({
    name: 'endfieldmap',
    version: 1,
    description: 'EndfieldMap Storage',
  });
  public static jsonLoader = new JSONLoader({
    storage: this.storage,
  });
  public static dbStorage = new Storage();

  /**
   * 同步管理器实例
   * 用于管理用户认证和数据同步
   */
  private static syncManagerInstance: SyncManager | null = null;

  /**
   * 获取同步管理器
   */
  public static get syncManager(): SyncManager {
    if (!this.syncManagerInstance) {
      this.syncManagerInstance = getSyncManager();
    }
    return this.syncManagerInstance;
  }

  public static async initStorage() {
    await this.storage.init();
    await this.dbStorage.init();
    // 初始化同步管理器
    await this.syncManager.init();
  }
}
