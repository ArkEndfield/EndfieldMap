import { UserDataService } from '@/services/data/user';

export class UserService {
  public static instance: UserService;

  public data: UserDataService;

  constructor() {
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
