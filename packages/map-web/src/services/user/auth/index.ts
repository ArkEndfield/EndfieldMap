import { LocalStorageValue, logger } from '@endfieldmap/tools';
import { action, computed, observable } from 'mobx';

import { UserLocalStorageKey } from '@/const/storage';
import type { UidInfo } from '@eftypes/user';

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
    // const token = await this.authService.login(username, password);
    this.token.value = username + password;
    logger.info(`login: ${username}, ${password}`);
    return true;
  }

  @action
  public async register(username: string, password: string) {
    // const token = await this.authService.register(username, password);
    // this.token.value = token;
    logger.info(`register: ${username}, ${password}`);
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
    this.uidList = [
      {
        uid: '100000000001',
        nickname: 'test1',
        avatar: '',
      },
      {
        uid: '100000000002',
        nickname: 'test2',
        avatar: '',
      },
    ];
  }

  public async bindUid(_uid: UidInfo['uid']) {
    if (!this.isLogin) {
      throw new Error('user.not_login');
    }
    // WARNING: 不要在这里更新 uid 列表，在外部会进行fetch的！
  }

  @action
  public async unbindUid(_uid: UidInfo['uid']) {
    if (!this.isLogin) {
      throw new Error('user.not_login');
    }
    // WARNING: 不要在这里更新 uid 列表，在外部会进行fetch的！
  }

  @action
  public async logout() {
    this.token.value = null;
    this.currentUid.value = null;
    this.uidList = [];
    logger.info('logout');
    return true;
  }
}
