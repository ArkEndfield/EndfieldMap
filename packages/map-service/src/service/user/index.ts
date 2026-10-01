import type { BindType } from '@endfieldmap/map-service/@types/game_role';
import type { UidInfo } from '@endfieldmap/map-service/@types/user';
import { DatabaseService, type UserDatabaseScope } from '@endfieldmap/map-service/service/db';
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
  private databaseTransition: Promise<void> = Promise.resolve();

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

    this.serverService.setUnauthorizedHandler(() => {
      logger.warn('Unauthorized, logging out');
      serviceEmitter.fire(SERVICE_EVENT.ALERT_INFO, this.i18nService.translate('login_expired', { ns: 'error' }));
      // 悬空 Promise：logout 内部换库可能抛错，不接住会变成未处理拒绝
      void this.logout().catch((error) => {
        logger.error('[UserService] auto logout failed:', error);
      });
    });

    this.serverService.setOnTokenRefreshed((newToken) => {
      logger.info('Token refreshed');
      this.auth.token.value = newToken;
    });
  }

  public async login(username: string, password: string): Promise<void> {
    logger.info('[UserService] Logging in user:', username);
    await this.stopSync();
    await this.auth.login(username, password);
    this.serverService.setToken(this.auth.token.value);
    await this.updateUidList();
  }

  public async register(username: string, password: string): Promise<void> {
    logger.info('[UserService] Registering user:', username);
    await this.stopSync();
    await this.auth.register(username, password);
    this.serverService.setToken(this.auth.token.value);
    await this.updateUidList();
  }

  public async thirdparty(token: string): Promise<void> {
    logger.info('[UserService] Adding user');
    await this.stopSync();
    this.auth.token.value = token;
    this.serverService.setToken(this.auth.token.value);
    await this.updateUidList();
  }

  public async updateUidList(autoSwitch: boolean = true) {
    if (!this.auth.isLogin) {
      await this.stopSync();
      return;
    }
    await Promise.all([this.auth.fetchUidList(), this.auth.fetchUserInfo()]);
    const currentUid = this.auth.currentUid.value;
    if (!currentUid) {
      if (this.auth.uidList.length <= 0 || !autoSwitch) {
        await this.stopSync();
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
    await this.runDatabaseTransition(async () => {
      const userId = this.auth.userInfo?.id;
      if (!userId) return;
      // 目标角色的库已打开且 uid 已就位时（bind/unbind/重复刷新触发），
      // 不停同步换库，只确保同步在跑，避免 replication 反复重建
      const targetName = DatabaseService.userDatabaseName({ userId, roleId: currentUid });
      if (this.databaseService.database.name === targetName && this.serverService.getUid() === currentUid) {
        await this.data.syncService.ensureSyncing();
        return;
      }
      await this.stopSync();
      await this.changeDatabase(
        this.databaseService.database.name === DatabaseService.USER_DB_NAME,
        { userId, roleId: currentUid },
        true
      );
      this.serverService.setUid(currentUid);
      await this.startSync();
    });
  }

  private async stopSync() {
    await this.data.syncService.stopSync();
  }

  /**
   * 设置页「清除储存数据」前调用：清库产生的本地删除若在同步运行时发生，
   * 会被 replication 推送为墓碑把云端数据一并删除，必须先停同步。
   */
  public async stopSyncBeforeLocalClear(): Promise<void> {
    await this.stopSync();
  }

  /**
   * 停止同步并物理清除 replication 元数据（checkpoint + assumed-master-state）。
   * 「清除标点数据」「不保留本地」这类「以云端为准重置本地」的操作必须用这个：
   * 只停同步是不够的——墓碑和元数据留在库里，下次 startSync 照样把删除推上云；
   * 元数据还在还会让清空后的本地永远拉不回云端存量。清完删除后需再对各集合
   * cleanup(0) 物理抹掉墓碑（见设置页实现），下次 startSync 即全新全量拉取。
   */
  public async stopSyncAndPurgeMeta(): Promise<void> {
    await this.data.syncService.stopSyncAndPurgeMeta();
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
          const uidLabel = uid === '0' ? this.i18nService.translate('user.uid.default', { ns: 'header' }) : uid;
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

  private async changeDatabase(migrate: boolean, scope?: UserDatabaseScope, legacyOnly = false): Promise<void> {
    let createError: unknown;
    try {
      await this.databaseService.createUserDB(migrate, scope, legacyOnly);
    } catch (error) {
      createError = error;
    }
    try {
      await this.data.updateDB();
    } catch (updateError) {
      // 换库失败时 updateDB 的 getter 抛错（'User database not initialized'）
      // 会掩盖真实原因，只记录不上抛；换库成功时 updateDB 失败才是真实错误
      if (!createError) throw updateError;
      logger.error('[UserService] updateDB failed after createUserDB failure:', updateError);
    }
    if (createError) throw createError;
  }

  /**
   * 收集当前账号所有角色对应的库范围，供「清除储存数据」整体丢弃用。
   * 必须在登出/清 uidList 之前调用。
   */
  public getKnownDatabaseScopes(): UserDatabaseScope[] {
    const userId = this.auth.userInfo?.id;
    if (!userId) return [];
    return this.auth.uidList.map((info) => ({ userId, roleId: info.uid }));
  }

  private runDatabaseTransition(work: () => Promise<void>): Promise<void> {
    const next = this.databaseTransition.then(work);
    this.databaseTransition = next.catch(() => undefined);
    return next;
  }

  public async switchUid(uid?: UidInfo['uid']): Promise<void> {
    if (uid && uid === this.auth.currentUid.value) {
      logger.info('[UserService] Switch target is the current uid, skipping');
      return;
    }

    const result = await this.confirmModal(uid);
    if (result <= 0) return;

    await this.runDatabaseTransition(async () => {
      const userId = this.auth.userInfo?.id;
      if (uid && !userId) throw new Error('User information is not loaded');
      await this.stopSync();
      if (result === 2 && uid && userId) {
        // 「不保留（用云端）」承诺清空本地并以云端为准：物理丢弃目标角色库
        //（含 replication 元数据与未上推的离线编辑），否则旧库连同离线编辑
        // 会在 startSync 时继续上云，「不保留」名不副实
        await this.databaseService.removeUserDatabase({ userId, roleId: uid });
      }
      await this.changeDatabase(result === 1, uid && userId ? { userId, roleId: uid } : undefined);
      this.auth.switchUid(uid);
      this.serverService.setUid(uid);
      if (uid) await this.startSync();
    });
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

  public async deleteAccount(password?: string) {
    await this.auth.deleteAccount(password);
    await this.logout();
  }

  public async logout(migrateData: boolean = true): Promise<void> {
    await this.runDatabaseTransition(async () => {
      try {
        await this.stopSync();
        await this.auth.logout();
        this.serverService.setToken(null);
        this.serverService.setUid(null);
        await this.changeDatabase(migrateData);
      } finally {
        // 闩锁必须兜底复位：换库/恢复数据中途抛错的话，本会话内 401 将永远
        // 无法再次触发登出（triggerLogout 对 isLoggingOut 直接返回）
        this.serverService.resetLogoutState();
      }
    });
  }

  public async changePassword(oldPassword: string, newPassword: string) {
    await this.auth.changePassword(oldPassword, newPassword);
    await this.logout();
  }
}
