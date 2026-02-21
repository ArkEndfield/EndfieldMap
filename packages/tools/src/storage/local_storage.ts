import { getStorageAdapter } from '@endfieldmap/tools/storage/storage_provider';

export class LocalStorageDB {
  public static getItem<T>(key: string): T | null {
    return getStorageAdapter().getItem<T>(key);
  }

  public static get<T>(key: string): T | null {
    return this.getItem<T>(key);
  }

  public static setItem<T>(key: string, value: T): void {
    getStorageAdapter().setItem<T>(key, value);
  }

  public static set<T>(key: string, value: T): void {
    this.setItem<T>(key, value);
  }

  public static removeItem(key: string): void {
    getStorageAdapter().removeItem(key);
  }

  public static clear(): void {
    getStorageAdapter().clear();
  }
}
