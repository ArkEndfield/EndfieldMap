import { EntityMarkService } from '@/services/data/user/marked/entity';
import { CustomPointVisibilityService } from '@/services/data/user/visibility/custom_point';
import { ElectricPoleVisibilityService } from '@/services/data/user/visibility/electric_pole';
import { EntityVisibilityService } from '@/services/data/user/visibility/entity';

export class UserDataService {
  public entityMarkService = new EntityMarkService();
  public entityVisibilityService = new EntityVisibilityService();
  public customPointVisibilityService = new CustomPointVisibilityService();
  public electricPoleVisibilityService = new ElectricPoleVisibilityService();
}
