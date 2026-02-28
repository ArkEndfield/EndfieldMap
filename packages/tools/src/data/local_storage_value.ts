import { LocalStorageDB } from '@endfieldmap/tools/storage';
import { action, computed, observable, observe } from 'mobx';

export interface LocalStorageValueConfig<T> {
  initialValue: T;
  storageKey: string;
  onValueChange?: (newValue: T, oldValue?: T) => void;
  onInitFromLocalStorage?: (data: T) => void;
}

export class LocalStorageValue<T> {
  @observable accessor _value!: T;
  private storageKey: string;
  private onValueChange?: (newValue: T, oldValue?: T) => void;
  private onInitFromLocalStorage?: (data: T) => void;
  public initialValue: T;
  private oldValue?: T;

  constructor(config: LocalStorageValueConfig<T>) {
    this.storageKey = config.storageKey;
    this.initialValue = config.initialValue;
    this.oldValue = config.initialValue;
    this.onValueChange = config.onValueChange;
    this.onInitFromLocalStorage = config.onInitFromLocalStorage;
    this.initValueListener();
    this.restoreDataFromStorage(config.initialValue);
  }

  public registerOnValueChange(callback: (newValue: T, oldValue?: T) => void) {
    this.onValueChange = callback;
    callback(this._value, this.oldValue);
  }

  private restoreDataFromStorage(initialValue: T) {
    const data = LocalStorageDB.getItem<T>(this.storageKey);
    if (data) {
      this.onInitFromLocalStorage?.(data);
    }
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

  @action
  public reset() {
    this._value = this.initialValue;
  }
}
