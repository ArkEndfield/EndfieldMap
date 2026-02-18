import type { UidInfo } from '@eftypes/user';
import { logger } from '@endfieldmap/tools';

import type { BindType } from '@/@types/game_role';
import { alert } from '@/components/common/alert/alert_api';
import { DataService } from '@/services/data';
import { UserAuthService } from '@/services/user/auth';
import { UserDataService } from '@/services/user/data';
import { service } from '@/services';

export class UserService {
  public static instance: UserService;
  public auth: UserAuthService;
  public data: UserDataService;

  constructor() {
    this.auth = new UserAuthService();
    this.data = new UserDataService();
    service.serverService.setToken(this.auth.token.value);
    this.updateUidList(false);
    // Register handlers
    service.serverService.setUnauthorizedHandler(() => {
      logger.warn('Unauthorized, logging out');
      alert.info(
        service.i18nService.translate('login_expired', {
          ns: 'error',
        })
      );
      this.logout();
    });

    service.serverService.setOnTokenRefreshed((newToken) => {
      logger.info('Token refreshed');
      this.auth.token.value = newToken;
    });
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
    service.serverService.setToken(this.auth.token.value);
    await this.updateUidList();
  }

  /**
   * 用户注册
   * @param username 用户名
   * @param password 密码
   */
  public async register(username: string, password: string): Promise<void> {
    logger.info('[UserService] Registering user:', username);
    await this.auth.register(username, password);
    service.serverService.setToken(this.auth.token.value);
    await this.updateUidList();
  }

  /**
   * 用户三方登录
   * @param token 三方登录返回的 token
   */
  public async thirdparty(token: string): Promise<void> {
    logger.info('[UserService] Adding user');
    this.auth.token.value = token;
    service.serverService.setToken(this.auth.token.value);
    await this.updateUidList();
  }

  /**
   * 更新 uid 列表，然后根据当前 uid 切换数据库
   * @param autoSwitch 是否自动切换 uid
   * @returns
   */
  public async updateUidList(autoSwitch: boolean = true) {
    // 没登录就不用初始化了
    if (!this.auth.isLogin) {
      this.stopSync();
      return;
    }
    // 获取绑定的 uid 列表
    await Promise.all([this.auth.fetchUidList(), this.auth.fetchUserInfo()]);
    // 获取存储的当前 uid
    const currentUid = this.auth.currentUid.value;
    // 如果没有 uid
    if (!currentUid) {
      if (this.auth.uidList.length <= 0 || !autoSwitch) {
        // 如果没有 uid，说明是第一次登录，不进行同步
        this.stopSync();
        return;
      }
      // 默认选择第一个，开启同步
      await this.switchUid(this.auth.uidList[0].uid);
      return;
    }
    // 查找当前 uid 是否在 uid 列表中，这里不用else是因为如果没有uid的话，上面的操作已经切换了，这里肯定有一个当前uid
    const findUid = this.auth.uidList.find((uid) => uid.uid === currentUid);
    // 如果不在，可能是删掉了 uid，删掉本地存储的当前 uid
    if (!findUid) {
      this.stopSync();
      this.switchUid(void 0);
      return;
    }
    // 如果在，说明还是有效的，开始同步
    service.serverService.setUid(currentUid);
    this.startSync();
  }

  /**
   * 停止数据同步
   */
  private async stopSync() {
    await this.data.syncService.stopSync();
  }

  /**
   * 开启数据同步
   */
  private async startSync() {
    await this.data.syncService.startSync();
  }

  /**
   * 手动触发同步
   */
  public async triggerSync() {
    await this.data.syncService.triggerSync();
  }

  /**
   * 切换uid的确认框
   * @param uid uid
   * @returns
   */
  private confirmModal(uid?: UidInfo['uid']) {
    return new Promise<number>((resolve) => {
      if (!uid) {
        // 如果没有 Uid，可能是在initUidList检测到当前uid没了，可能是解绑了，直接返回1让本地留存
        alert.info(
          service.i18nService.translate('user.no_uid_select_and_keep_data', {
            ns: 'header',
          })
        );
        resolve(1);
        return;
      }
      alert.confirm({
        content: service.i18nService.translate('user.switch_confirm', {
          ns: 'header',
          uid: uid === '0' ? service.i18nService.translate('user.uid.default', { ns: 'header' }) : uid,
        }),
        dismissible: false,
        onConfirm: async () => {
          alert.confirm({
            dismissible: false,
            content: service.i18nService.translate('user.switch_confirm_keep', {
              ns: 'header',
              uid: uid === '0' ? service.i18nService.translate('user.uid.default', { ns: 'header' }) : uid,
            }),
            onConfirm: async () => {
              resolve(1);
            },
            onCancel: async () => {
              resolve(2);
            },
          });
        },
        onCancel: async () => {
          resolve(-1);
        },
      });
    });
  }

  /**
   * 切换用户数据库
   * 在用户切换账号时调用，迁移本地数据到新用户数据库
   */
  public async switchUid(uid?: UidInfo['uid']): Promise<void> {
    logger.info('[UserService] Switching user database');

    const result = await this.confirmModal(uid);

    if (result && result > 0) {
      const migrate = result === 1 ? true : false;
      this.auth.switchUid(uid);
      service.serverService.setUid(uid);
      // 创建用户数据库并迁移本地数据
      await DataService.dbStorage.createUserDB(migrate);
      // 更新所有服务的数据库连接
      await this.data.updateDB();
      // 执行数据迁移到用户数据库
      await DataService.dbStorage.migrateUserData();
      // 如果有uid，开启同步
      if (uid) {
        await this.startSync();
      }
      logger.info('[UserService] User database switched');
    }
  }

  /**
   * 绑定uid
   * @param uid
   */
  public async bindUid(uid: UidInfo['uid'], type: BindType) {
    await this.auth.bindUid(uid, type);
    await this.updateUidList();
  }

  /**
   * 解绑uid
   * @param uid
   */
  public async unbindUid(uid: UidInfo['uid']) {
    await this.auth.unbindUid(uid);
    await this.updateUidList();
  }

  /**
   * 修改昵称
   * @param nickname 昵称
   */
  public async changeNickname(nickname: string) {
    await this.auth.changeNickname(nickname);
    await this.auth.fetchUserInfo();
  }

  /**
   * 删除账号
   */
  public async deleteAccount() {
    await this.auth.deleteAccount();
    await this.logout();
  }

  /**
   * 用户登出
   * 销毁用户数据库，迁移数据到本地数据库
   * @param migrateData 是否迁移用户数据到本地，默认为 true
   */
  public async logout(migrateData: boolean = true): Promise<void> {
    logger.info('[UserService] Logging out user, migrate data:', migrateData);

    // 先停止数据同步
    await this.stopSync();

    // 调用 auth.logout
    await this.auth.logout();

    service.serverService.setToken(null);

    // 销毁用户数据库
    await DataService.dbStorage.createUserDB(migrateData);

    // 更新所有服务的数据库连接
    await this.data.updateDB();

    // 如果需要迁移，执行数据迁移到本地数据库
    if (migrateData) {
      await DataService.dbStorage.migrateUserData();
    }

    // 重置登出状态，允许下次登录后再次触发 logout
    service.serverService.resetLogoutState();

    logger.info('[UserService] User logged out');
  }

  /**
   * 修改密码
   * @param oldPassword 旧密码
   * @param newPassword 新密码
   */
  public async changePassword(oldPassword: string, newPassword: string) {
    await this.auth.changePassword(oldPassword, newPassword);
    await this.logout();
  }
}

export const userService = UserService.getInstance();
