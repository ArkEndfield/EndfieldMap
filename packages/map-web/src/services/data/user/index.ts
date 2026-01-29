import { EntityMarkService } from '@/services/data/user/marked/entity';
import { CustomPointVisibilityService } from '@/services/data/user/visibility/custom_point';
import { ElectricPoleVisibilityService } from '@/services/data/user/visibility/electric_pole';
import { EntityVisibilityService } from '@/services/data/user/visibility/entity';
import { CustomPointPresetDataService } from './preset/custom_point';
import { ElectricPolePresetDataService } from './preset/electric_pole';

export class UserDataService {
  public entityMarkService = new EntityMarkService();
  public entityVisibilityService = new EntityVisibilityService();
  public customPointVisibilityService = new CustomPointVisibilityService();
  public electricPoleVisibilityService = new ElectricPoleVisibilityService();
  public customPointPresetDataService = new CustomPointPresetDataService();
  public electricPolePresetDataService = new ElectricPolePresetDataService();
}
