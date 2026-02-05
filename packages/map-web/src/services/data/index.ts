import { JSONLoader } from '@endfieldmap/tools';

import { Storage } from '@/services/data/db/storage';

export class DataService {
  public static jsonLoader = new JSONLoader();
  public static dbStorage = new Storage();

  public static async initStorage() {
    await this.dbStorage.init();
  }
}
