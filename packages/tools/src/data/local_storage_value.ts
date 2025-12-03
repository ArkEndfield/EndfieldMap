import { action, computed, observable, observe } from 'mobx';
import { LocalStorageDB } from '@endfieldmap/tools/storage';

export interface LocalStorageValueConfig<T> {
  initialValue: T;
  storageKey: string;
  onValueChange?: (newValue: T, oldValue?: T) => void;
}

export class LocalStorageValue<T> {
  @observable accessor _value!: T;
  private storageKey: string;
  private onValueChange?: (newValue: T, oldValue?: T) => void;
  private oldValue?: T;

  constructor(config: LocalStorageValueConfig<T>) {
    this.storageKey = config.storageKey;
    this.oldValue = config.initialValue;
    this.onValueChange = config.onValueChange;
    this.initValueListener();
    this.restoreDataFromStorage(config.initialValue);
  }

  private restoreDataFromStorage(initialValue: T) {
    const data = LocalStorageDB.getItem<T>(this.storageKey);
    this._value = data ?? initialValue;
  }

  private initValueListener() {
    observe(this, '_value', () => {
      this.onValueChange?.(this._value, this.oldValue);
      this.oldValue = this._value;
      LocalStorageDB.set(this.storageKey, this._value);
    });
  }

  @computed
  get value() {
    return this._value;
  }

  @action
  set value(data: T) {
    this._value = data;
  }
}
