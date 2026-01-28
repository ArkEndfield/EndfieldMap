import { EntityMarkService } from '@/services/data/user/marked/entity';
import { EntityVisibilityService } from '@/services/data/user/visibility/entity';

export class UserDataService {
  public entityMarkService = new EntityMarkService();
  public entityVisibilityService = new EntityVisibilityService();
}
