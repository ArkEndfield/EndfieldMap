import { LocalStorageValue, logger } from '@endfieldmap/tools';
import { action, computed, observable } from 'mobx';

import { UserLocalStorageKey } from '@/const/storage';

export class UserAuthService {
  @observable
  accessor token: LocalStorageValue<string | null> = new LocalStorageValue<string | null>({
    storageKey: UserLocalStorageKey.TOKEN,
    initialValue: null,
  });

  @computed
  public get isLogin() {
    return !!this.token.value;
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
  public async logout() {
    this.token.value = null;
    logger.info('logout');
    return true;
  }
}
