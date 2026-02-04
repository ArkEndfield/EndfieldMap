import { logger } from '@endfieldmap/tools';

import { EntityMarkService } from '@/services/user/data/marked/entity';
import { CustomPointPresetDataService } from '@/services/user/data/preset/custom_point';
import { ElectricPolePresetDataService } from '@/services/user/data/preset/electric_pole';
import { EntityVisibilityService, ScopedEntityVisibilityService } from '@/services/user/data/visibility/entity';

export class UserDataService {
  public entityMarkService = new EntityMarkService();
  public entityVisibilityService = new EntityVisibilityService();
  /** 电线杆类型可见性（存于 entityVisibility，key 前缀 electric_pole:） */
  public electricPoleVisibilityService = new ScopedEntityVisibilityService('electric_pole:');
  /** 自定义标点类型可见性（存于 entityVisibility，key 前缀 custom_point:） */
  public customPointVisibilityService = new ScopedEntityVisibilityService('custom_point:');
  public customPointPresetDataService = new CustomPointPresetDataService();
  public electricPolePresetDataService = new ElectricPolePresetDataService();

  /**
   * 更新所有服务的数据库连接
   * 在用户登录/登出时调用
   */
  public updateDB() {
    logger.info('[UserDataService] Updating all service database connections');

    // 更新所有服务的数据库连接
    this.entityMarkService.updateDB();
    this.entityVisibilityService.updateDB();
    this.customPointVisibilityService.updateDB();
    this.electricPoleVisibilityService.updateDB();
    this.customPointPresetDataService.updateDB();
    this.electricPolePresetDataService.updateDB();
  }

  public async clearAllData() {
    await Promise.all([
      this.entityMarkService.clearAllData(),
      this.entityVisibilityService.clearAllData(),
      this.customPointVisibilityService.clearAllData(),
      this.electricPoleVisibilityService.clearAllData(),
      this.customPointPresetDataService.clearAllData(),
      this.electricPolePresetDataService.clearAllData(),
    ]);
  }
}
