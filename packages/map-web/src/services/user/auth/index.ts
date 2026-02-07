import { LocalStorageValue, logger } from '@endfieldmap/tools';
import { action, computed, observable } from 'mobx';

import { UserLocalStorageKey } from '@/const/storage';
import type { UidInfo, UserInfo } from '@eftypes/user';
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

  @computed
  public get isLogin() {
    return !!this.token.value;
  }

  @computed
  public get currentUidInfo() {
    return this.uidList.find((uidInfo) => uidInfo.uid === this.currentUid.value);
  }

  @action
  public async login(username: string, password: string) {
    const { token } = await serverService.apiPost<{ token: string; expire: string }>('/auth/login', {
      username,
      password,
    });
    this.token.value = token;
    return true;
  }

  @action
  public async register(username: string, password: string) {
    const { token } = await serverService.apiPost<{ token: string; expire: string }>('/auth/register', {
      username,
      password,
    });
    this.token.value = token;
    return true;
  }

  @action
  public switchUid(uid?: UidInfo['uid']) {
    if (!uid) {
      this.currentUid.value = null;
      return;
    }
    const findUid = this.uidList.find((uidInfo) => uidInfo.uid === uid);
    if (!findUid) {
      throw new Error('user.not_bind');
    }
    this.currentUid.value = uid;
  }

  @action
  public async fetchUidList() {
    if (!this.isLogin) {
      throw new Error('user.not_login');
    }
    const { list } = await serverService.apiGet<{ list: UidInfo[] }>('/user/game-roles');
    this.uidList = list;
  }

  @action
  public async fetchUserInfo() {
    if (!this.isLogin) {
      throw new Error('user.not_login');
    }
    this.userInfo = (await serverService.apiGet<{ user: UserInfo }>('/user/me')).user;
  }

  public async bindUid(_uid: UidInfo['uid']) {
    if (!this.isLogin) {
      throw new Error('user.not_login');
    }
    // WARNING: 不要在这里更新 uid 列表，在外部会进行fetch的！
  }

  public async unbindUid(uid: UidInfo['uid']) {
    if (!this.isLogin) {
      throw new Error('user.not_login');
    }
    await serverService.apiPost('/user/game-roles/unbind', { role_id: uid });
  }

  @action
  public async logout() {
    try {
      await serverService.apiPost('/auth/logout');
    } catch (error) {
      logger.error('logout error', error);
    } finally {
      this.token.value = null;
      this.currentUid.value = null;
      this.uidList = [];
      logger.info('logout');
      return true;
    }
  }
}
