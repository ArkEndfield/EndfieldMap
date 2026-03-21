import type { BindType } from '@endfieldmap/map-service/@types/game_role';
import type { UidInfo } from '@endfieldmap/map-service/@types/user';
import { DatabaseService } from '@endfieldmap/map-service/service/db';
import { I18nService } from '@endfieldmap/map-service/service/i18n';
import { ServerService } from '@endfieldmap/map-service/service/server';
import { serviceEmitter } from '@endfieldmap/map-service/service/service_emitter';
import { SERVICE_EVENT } from '@endfieldmap/map-service/service/service_emitter';
import { UserAuthService } from '@endfieldmap/map-service/service/user/auth';
import { UserDataService } from '@endfieldmap/map-service/service/user/data';
import { logger } from '@endfieldmap/tools';

export interface UserServiceConfig<T, R> {
  serverService: ServerService;
  i18nService: I18nService;
  databaseService: DatabaseService<T, R>;
}

export class UserService<T, R> {
  public auth: UserAuthService;
  public data: UserDataService<T, R>;
  private serverService: ServerService;
  private i18nService: I18nService;
  private databaseService: DatabaseService<T, R>;

  constructor(config: UserServiceConfig<T, R>) {
    this.serverService = config.serverService;
    this.i18nService = config.i18nService;
    this.databaseService = config.databaseService;
    this.auth = new UserAuthService({
      serverService: this.serverService,
      i18nService: this.i18nService,
    });
    this.data = new UserDataService({
      serverService: this.serverService,
      i18nService: this.i18nService,
      databaseService: this.databaseService,
    });
    this.serverService.setToken(this.auth.token.value);
    this.updateUidList(false);

    this.serverService.setUnauthorizedHandler(() => {
      logger.warn('Unauthorized, logging out');
      serviceEmitter.fire(
        SERVICE_EVENT.ALERT_INFO,
        this.i18nService.translate('login_expired', { ns: 'error' })
      );
      this.logout();
    });

    this.serverService.setOnTokenRefreshed((newToken) => {
      logger.info('Token refreshed');
      this.auth.token.value = newToken;
    });
  }

  public async login(username: string, password: string): Promise<void> {
    logger.info('[UserService] Logging in user:', username);
    await this.auth.login(username, password);
    this.serverService.setToken(this.auth.token.value);
    await this.updateUidList();
  }

  public async register(username: string, password: string): Promise<void> {
    logger.info('[UserService] Registering user:', username);
    await this.auth.register(username, password);
    this.serverService.setToken(this.auth.token.value);
    await this.updateUidList();
  }

  public async thirdparty(token: string): Promise<void> {
    logger.info('[UserService] Adding user');
    this.auth.token.value = token;
    this.serverService.setToken(this.auth.token.value);
    await this.updateUidList();
  }

  public async updateUidList(autoSwitch: boolean = true) {
    if (!this.auth.isLogin) {
      this.stopSync();
      return;
    }
    await Promise.all([this.auth.fetchUidList(), this.auth.fetchUserInfo()]);
    const currentUid = this.auth.currentUid.value;
    if (!currentUid) {
      if (this.auth.uidList.length <= 0 || !autoSwitch) {
        this.stopSync();
        return;
      }
      await this.switchUid(this.auth.uidList[0].uid);
      return;
    }
    const findUid = this.auth.uidList.find((uid) => uid.uid === currentUid);
    if (!findUid) {
      await this.stopSync();
      await this.switchUid(void 0);
      return;
    }
    this.serverService.setUid(currentUid);
    this.startSync();
  }

  private async stopSync() {
    await this.data.syncService.stopSync();
  }

  private async startSync() {
    await this.data.syncService.startSync();
  }

  public async triggerSync() {
    await this.data.syncService.triggerSync();
  }

  private confirmModal(uid?: UidInfo['uid']) {
    return new Promise<number>((resolve) => {
      if (!uid) {
        serviceEmitter.fire(
          SERVICE_EVENT.ALERT_INFO,
          this.i18nService.translate('user.no_uid_select_and_keep_data', { ns: 'header' })
        );
        resolve(1);
        return;
      }
      serviceEmitter.fire(SERVICE_EVENT.ALERT_CONFIRM, {
        content: this.i18nService.translate('user.switch_confirm', {
          ns: 'header',
          uid: uid === '0' ? this.i18nService.translate('user.uid.default', { ns: 'header' }) : uid,
        }),
        dismissible: false,
        onConfirm: async () => {
          const uidLabel =
            uid === '0' ? this.i18nService.translate('user.uid.default', { ns: 'header' }) : uid;
          serviceEmitter.fire(SERVICE_EVENT.ALERT_CONFIRM, {
            dismissible: false,
            content: this.i18nService.translate('user.switch_confirm_keep', {
              ns: 'header',
              uid: uidLabel,
            }),
            // 必须用明确文案：通用「取消」会被理解成「关闭弹窗/返回上一步」，
            // 但此处 onCancel 实际表示「不保留本地」，会造成误触后数据被清空。
            confirmText: this.i18nService.translate('user.switch_confirm_keep_btn_merge', {
              ns: 'header',
            }),
            cancelText: this.i18nService.translate('user.switch_confirm_keep_btn_cloud', {
              ns: 'header',
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

  public async switchUid(uid?: UidInfo['uid']): Promise<void> {
    logger.info('[UserService] Switching user database');

    const result = await this.confirmModal(uid);

    if (result && result > 0) {
      const migrate = result === 1 ? true : false;
      this.auth.switchUid(uid);
      this.serverService.setUid(uid);
      await this.databaseService.createUserDB(migrate);
      await this.data.updateDB();
      await this.databaseService.migrateUserData();
      if (uid) {
        await this.startSync();
      }
      logger.info('[UserService] User database switched');
    }
  }

  public async bindUid(uid: UidInfo['uid'], type: BindType) {
    await this.auth.bindUid(uid, type);
    await this.updateUidList();
  }

  public async unbindUid(uid: UidInfo['uid']) {
    await this.auth.unbindUid(uid);
    await this.updateUidList();
  }

  public async changeNickname(nickname: string) {
    await this.auth.changeNickname(nickname);
    await this.auth.fetchUserInfo();
  }

  public async deleteAccount() {
    await this.auth.deleteAccount();
    await this.logout();
  }

  public async logout(migrateData: boolean = true): Promise<void> {
    logger.info('[UserService] Logging out user, migrate data:', migrateData);
    await this.stopSync();
    await this.auth.logout();
    this.serverService.setToken(null);
    await this.databaseService.createUserDB(migrateData);
    await this.data.updateDB();
    if (migrateData) {
      await this.databaseService.migrateUserData();
    }
    this.serverService.resetLogoutState();
    logger.info('[UserService] User logged out');
  }

  public async changePassword(oldPassword: string, newPassword: string) {
    await this.auth.changePassword(oldPassword, newPassword);
    await this.logout();
  }
}
