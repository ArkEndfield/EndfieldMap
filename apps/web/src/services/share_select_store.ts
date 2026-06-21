import { action, observable } from 'mobx';

export class ShareSelectStore {
  @observable accessor selectKeys: string[] = [];
  @observable accessor visible: boolean = false;

  @action
  setSelect(keys: string[]): void {
    this.selectKeys = keys;
    this.visible = keys.length > 0;
  }

  @action
  close(): void {
    this.selectKeys = [];
    this.visible = false;
  }
}

export const shareSelectStore = new ShareSelectStore();
