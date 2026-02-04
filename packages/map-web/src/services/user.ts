import { UserAuthService } from '@/services/user/auth';
import { UserDataService } from '@/services/user/data';

export class UserService {
  public static instance: UserService;
  public auth: UserAuthService;
  public data: UserDataService;

  constructor() {
    this.auth = new UserAuthService();
    this.data = new UserDataService();
  }

  public static getInstance() {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }
}

export const userService = UserService.getInstance();
