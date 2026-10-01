import type { BindType } from '@endfieldmap/map-service/@types/game_role';
import type { UidInfo, UserInfo } from '@endfieldmap/map-service/@types/user';
import { UserLocalStorageKey } from '@endfieldmap/map-service/const/storage';
import { I18nService } from '@endfieldmap/map-service/service/i18n';
import { ServerService } from '@endfieldmap/map-service/service/server';
import { LocalStorageValue, logger } from '@endfieldmap/tools';
import { action, computed, observable, runInAction } from 'mobx';

export interface UserAuthServiceConfig {
  serverService: ServerService;
  i18nService: I18nService;
}

export class UserAuthService {
  public token: LocalStorageValue<string | null> = new LocalStorageValue<string | null>({
    storageKey: UserLocalStorageKey.TOKEN,
    initialValue: null,
  });

  public currentUid: LocalStorageValue<string | null> = new LocalStorageValue<string | null>({
    storageKey: UserLocalStorageKey.CURRENT_UID,
    initialValue: null,
  });

  @observable
  accessor uidList: UidInfo[] = [];

  @observable
  accessor userInfo: UserInfo | null = null;

  private serverService: ServerService;
  private i18nService: I18nService;

  constructor(config: UserAuthServiceConfig) {
    this.serverService = config.serverService;
    this.i18nService = config.i18nService;
  }

  @computed
  public get isLogin() {
    return !!this.token.value;
  }

  public async login(username: string, password: string) {
    // V2：{access_token, token_type, expires_in}，刷新令牌走 HttpOnly cookie
    const { access_token } = await this.serverService.apiPost<{ access_token: string }>('/auth/login', {
      username,
      password,
    });
    runInAction(() => {
      this.token.value = access_token;
    });
    return true;
  }

  public async register(username: string, password: string) {
    const { access_token } = await this.serverService.apiPost<{ access_token: string }>(
      '/auth/register',
      { username, password }
    );
    runInAction(() => {
      this.token.value = access_token;
    });
    return true;
  }

  public async logout() {
    try {
      await this.serverService.apiPost('/auth/logout');
    } catch (error) {
      logger.error('logout error', error);
    } finally {
      runInAction(() => {
        this.token.value = null;
        this.currentUid.value = null;
        this.uidList = [];
        this.userInfo = null;
      });
      logger.info('logout');
    }
    return true;
  }

  public async deleteAccount(password?: string) {
    if (!this.isLogin) {
      throw new Error(
        this.i18nService.translate('not_login', {
          ns: 'error',
          defaultValue: '未登录',
        })
      );
    }
    // 服务端 step-up：有密码账号必须携带密码（PASSWORD_REQUIRED），
    // 纯第三方登录账号要求最近重新登录（RECENT_LOGIN_REQUIRED）
    await this.serverService.apiPost('/user/delete', { password: password ?? '' });
  }

  @computed
  public get currentUidInfo() {
    return this.uidList.find((uidInfo) => uidInfo.uid === this.currentUid.value);
  }

  @action
  public switchUid(uid?: UidInfo['uid']) {
    if (!uid) {
      this.currentUid.value = null;
      return;
    }
    const findUid = this.uidList.find((uidInfo) => uidInfo.uid === uid);
    if (!findUid) {
      throw new Error(
        this.i18nService.translate('not_bind_uid', {
          ns: 'error',
          defaultValue: '未绑定 uid',
        })
      );
    }
    this.currentUid.value = uid;
  }

  public async fetchUidList() {
    if (!this.isLogin) {
      throw new Error(
        this.i18nService.translate('not_login', {
          ns: 'error',
          defaultValue: '未登录',
        })
      );
    }
    // V2：{roles:[{roleId, isDefault, nickName?}]}（camelCase），映射回 UidInfo
    const { roles } = await this.serverService.apiGet<{
      roles: { roleId: string; isDefault: boolean; nickName?: string }[];
    }>('/user/game-roles');
    runInAction(() => {
      this.uidList = (roles ?? []).map((r) => ({
        uid: r.roleId,
        nickname: r.nickName ?? '',
        avatar: '',
        is_default: r.isDefault,
      }));
    });
  }

  public async bindUid(uid: UidInfo['uid'], type: BindType) {
    if (!this.isLogin) {
      throw new Error(
        this.i18nService.translate('not_login', {
          ns: 'error',
          defaultValue: '未登录',
        })
      );
    }
    // V2 body：{form, roleId}
    await this.serverService.apiPost('/user/game-roles/bind', { form: type, roleId: uid });
  }

  public async unbindUid(uid: UidInfo['uid']) {
    if (!this.isLogin) {
      throw new Error(
        this.i18nService.translate('not_login', {
          ns: 'error',
          defaultValue: '未登录',
        })
      );
    }
    // V2 body：{roleId}
    await this.serverService.apiPost('/user/game-roles/unbind', { roleId: uid });
  }

  public async fetchUserInfo() {
    if (!this.isLogin) {
      throw new Error(
        this.i18nService.translate('not_login', {
          ns: 'error',
          defaultValue: '未登录',
        })
      );
    }
    // V2：/user/me 直接返回用户对象（无 {user:...} 包裹）
    const userInfo = await this.serverService.apiGet<UserInfo>('/user/me');
    runInAction(() => {
      this.userInfo = userInfo;
    });
  }

  public async changeNickname(nickname: string) {
    if (!this.isLogin) {
      throw new Error(
        this.i18nService.translate('not_login', {
          ns: 'error',
          defaultValue: '未登录',
        })
      );
    }
    if (!this.userInfo) {
      throw new Error(
        this.i18nService.translate('no_user_info', {
          ns: 'error',
          defaultValue: '用户信息不存在',
        })
      );
    }
    await this.serverService.apiPost(`/user/change-nickname`, { nickname });
  }

  public async changePassword(oldPassword: string, newPassword: string) {
    if (!this.isLogin) {
      throw new Error(
        this.i18nService.translate('not_login', {
          ns: 'error',
          defaultValue: '未登录',
        })
      );
    }
    await this.serverService.apiPost('/user/change-password', {
      old_password: oldPassword,
      new_password: newPassword,
    });
  }
}
