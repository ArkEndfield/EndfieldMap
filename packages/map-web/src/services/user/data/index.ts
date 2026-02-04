import { EntityMarkService } from '@/services/user/data/marked/entity';
import { CustomPointPresetDataService } from '@/services/user/data/preset/custom_point';
import { ElectricPolePresetDataService } from '@/services/user/data/preset/electric_pole';
import { CustomPointVisibilityService } from '@/services/user/data/visibility/custom_point';
import { ElectricPoleVisibilityService } from '@/services/user/data/visibility/electric_pole';
import { EntityVisibilityService } from '@/services/user/data/visibility/entity';

export class UserDataService {
  public entityMarkService = new EntityMarkService();
  public entityVisibilityService = new EntityVisibilityService();
  public customPointVisibilityService = new CustomPointVisibilityService();
  public electricPoleVisibilityService = new ElectricPoleVisibilityService();
  public customPointPresetDataService = new CustomPointPresetDataService();
  public electricPolePresetDataService = new ElectricPolePresetDataService();

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
