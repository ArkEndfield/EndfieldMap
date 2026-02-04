import { logger } from '@endfieldmap/tools';

import { DataService } from '@/services/data';
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

  /**
   * 用户登录
   * 仅调用 auth.login，不切换数据库
   * @param username 用户名
   * @param password 密码
   */
  public async login(username: string, password: string): Promise<void> {
    logger.info('[UserService] Logging in user:', username);
    await this.auth.login(username, password);
    await this.switchUserDB();
  }

  /**
   * 切换用户数据库
   * 在用户切换账号时调用，迁移本地数据到新用户数据库
   */
  public async switchUserDB(): Promise<void> {
    logger.info('[UserService] Switching user database');

    // 创建用户数据库并迁移本地数据
    await DataService.dbStorage.createUserDB(true);

    // 更新所有服务的数据库连接
    this.data.updateDB();

    // 执行数据迁移到用户数据库
    await DataService.dbStorage.migrateUserData();

    logger.info('[UserService] User database switched');
  }

  /**
   * 用户登出
   * 销毁用户数据库，迁移数据到本地数据库
   * @param migrateData 是否迁移用户数据到本地，默认为 true
   */
  public async logout(migrateData: boolean = true): Promise<void> {
    logger.info('[UserService] Logging out user, migrate data:', migrateData);

    // 调用 auth.logout
    await this.auth.logout();

    // 销毁用户数据库
    await DataService.dbStorage.createUserDB(migrateData);

    // 更新所有服务的数据库连接
    this.data.updateDB();

    // 如果需要迁移，执行数据迁移到本地数据库
    if (migrateData) {
      await DataService.dbStorage.migrateUserData();
    }

    logger.info('[UserService] User logged out');
  }
}

export const userService = UserService.getInstance();
