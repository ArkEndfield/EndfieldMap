import { JSONLoader } from '@endfieldmap/tools';

export class StorageService {
  public static jsonLoader = new JSONLoader();

  public static async initStorage() {
    await this.migrate();
  }

  /**
   * 数据迁移（从旧版本）
   */
  public static async migrate() {
    // 动态导入迁移模块，避免影响主要功能加载
    const { Migration } = await import('@/services/data/db/migration');
    await Migration.migrate();
  }
}
