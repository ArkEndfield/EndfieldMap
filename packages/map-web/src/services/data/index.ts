import { JSONLoader, StorageManager } from '@endfieldmap/tools';
import { Storage } from '@/services/data/db/storage';

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

  public static async initStorage() {
    await this.storage.init();
    await this.dbStorage.init();
  }
}
