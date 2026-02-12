import type { UidInfo, UserInfo } from '@eftypes/user';
import { LocalStorageValue, logger } from '@endfieldmap/tools';
import { action, computed, observable, runInAction } from 'mobx';

import type { BindType } from '@/@types/game_role';
import { UserLocalStorageKey } from '@/const/storage';
import i18n from '@/i18n';
import { serverService } from '@/services/server';

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

  constructor() {}

  // region: 登录相关

  /**
   * 是否已登录
   */
  @computed
  public get isLogin() {
    return !!this.token.value;
  }

  /**
   * 登录
   * @param username 用户名
   * @param password 密码
   * @returns
   */
  public async login(username: string, password: string) {
    const { token } = await serverService.apiPost<{ token: string; expire: string }>('/auth/login', {
      username,
      password,
    });
    runInAction(() => {
      this.token.value = token;
    });
    return true;
  }

  /**
   * 注册
   * @param username 用户名
   * @param password 密码
   * @returns
   */
  public async register(username: string, password: string) {
    const { token } = await serverService.apiPost<{ token: string; expire: string }>('/auth/register', {
      username,
      password,
    });
    runInAction(() => {
      this.token.value = token;
    });
    return true;
  }

  /**
   * 退出登录
   */
  public async logout() {
    try {
      await serverService.apiPost('/auth/logout');
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

  public async deleteAccount() {
    if (!this.isLogin) {
      throw new Error(
        i18n.t('not_login', {
          ns: 'error',
          defaultValue: '未登录',
        })
      );
    }
    await serverService.apiPost('/user/delete');
  }
  // endregion

  // region: UID 相关

  /**
   * 当前的UID信息
   */
  @computed
  public get currentUidInfo() {
    return this.uidList.find((uidInfo) => uidInfo.uid === this.currentUid.value);
  }

  /**
   * 切换 uid
   * @param uid 要切换的 uid
   */
  @action
  public switchUid(uid?: UidInfo['uid']) {
    if (!uid) {
      this.currentUid.value = null;
      return;
    }
    const findUid = this.uidList.find((uidInfo) => uidInfo.uid === uid);
    if (!findUid) {
      throw new Error(
        i18n.t('not_bind_uid', {
          ns: 'error',
          defaultValue: '未绑定 uid',
        })
      );
    }
    this.currentUid.value = uid;
  }

  /**
   * 获取 uid 列表
   */
  public async fetchUidList() {
    if (!this.isLogin) {
      throw new Error(
        i18n.t('not_login', {
          ns: 'error',
          defaultValue: '未登录',
        })
      );
    }
    const { list } = await serverService.apiGet<{ list: UidInfo[] }>('/user/game-roles');
    runInAction(() => {
      this.uidList = list;
    });
  }

  /**
   * 绑定 uid
   * @param uid 要绑定的 uid
   * @param type 绑定类型
   */
  public async bindUid(uid: UidInfo['uid'], type: BindType) {
    if (!this.isLogin) {
      throw new Error(
        i18n.t('not_login', {
          ns: 'error',
          defaultValue: '未登录',
        })
      );
    }
    await serverService.apiPost('/user/game-roles/bind', { role_id: uid, form: type });
  }

  /**
   * 解绑 uid
   * @param uid 要解绑的 uid
   */
  public async unbindUid(uid: UidInfo['uid']) {
    if (!this.isLogin) {
      throw new Error(
        i18n.t('not_login', {
          ns: 'error',
          defaultValue: '未登录',
        })
      );
    }
    await serverService.apiPost('/user/game-roles/unbind', { role_id: uid });
  }

  // endregion

  // region: 用户信息相关

  /**
   * 获取用户信息
   */
  public async fetchUserInfo() {
    if (!this.isLogin) {
      throw new Error(
        i18n.t('not_login', {
          ns: 'error',
          defaultValue: '未登录',
        })
      );
    }
    const userInfo = (await serverService.apiGet<{ user: UserInfo }>('/user/me')).user;
    runInAction(() => {
      this.userInfo = userInfo;
    });
  }

  /**
   * 修改昵称
   * @param nickname 新昵称
   */
  public async changeNickname(nickname: string) {
    if (!this.isLogin) {
      throw new Error(
        i18n.t('not_login', {
          ns: 'error',
          defaultValue: '未登录',
        })
      );
    }
    if (!this.userInfo) {
      throw new Error(
        i18n.t('no_user_info', {
          ns: 'error',
          defaultValue: '用户信息不存在',
        })
      );
    }
    await serverService.apiPost(`/user/change-nickname`, { nickname });
  }

  /**
   * 修改密码
   * @param oldPassword 旧密码
   * @param newPassword 新密码
   */
  public async changePassword(oldPassword: string, newPassword: string) {
    if (!this.isLogin) {
      throw new Error(
        i18n.t('not_login', {
          ns: 'error',
          defaultValue: '未登录',
        })
      );
    }
    await serverService.apiPost('/user/change-password', {
      old_password: oldPassword,
      new_password: newPassword,
    });
  }
  // endregion
}
