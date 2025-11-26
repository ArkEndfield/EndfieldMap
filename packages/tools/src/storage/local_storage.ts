const LOCAL_STORAGE_KEY = 'endfieldmap';
export class LocalStorageDB {
  public static getItem<T>(key: string): T | null {
    const item = localStorage.getItem(`${LOCAL_STORAGE_KEY}.${key}`);
    return item ? JSON.parse(item) : null;
  }

  public static get<T>(key: string): T | null {
    return this.getItem<T>(key);
  }

  public static setItem<T>(key: string, value: T): void {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}.${key}`, JSON.stringify(value));
  }

  public static set<T>(key: string, value: T): void {
    this.setItem<T>(key, value);
  }

  public static removeItem(key: string): void {
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}.${key}`);
  }

  public static clear(): void {
    localStorage.clear();
  }

  public static key(index: number): string | null {
    return localStorage.key(index);
  }
}
