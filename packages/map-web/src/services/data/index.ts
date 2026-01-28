import { JSONLoader, StorageManager } from '@endfieldmap/tools';

export class DataService {
  public static storage = new StorageManager({
    name: 'endfieldmap',
    version: 1,
    description: 'EndfieldMap Storage',
  });
  public static jsonLoader = new JSONLoader({
    storage: this.storage,
  });

  public static async initStorage() {
    await this.storage.init();
  }
}
