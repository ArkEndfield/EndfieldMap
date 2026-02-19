import type { IStorageAdapter } from '@endfieldmap/tools';

/**
 * react-native-mmkv 实例需要满足的最小接口。
 * 通过构造函数注入，避免在 web 构建环境中直接依赖 react-native-mmkv。
 */
export interface MmkvInstance {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
  clearAll(): void;
}

export class MmkvStorageAdapter implements IStorageAdapter {
  private storage: MmkvInstance;

  constructor(mmkv: MmkvInstance) {
    this.storage = mmkv;
  }

  getItem<T>(key: string): T | null {
    const raw = this.storage.getString(key);
    if (raw === undefined) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  setItem<T>(key: string, value: T): void {
    this.storage.set(key, JSON.stringify(value));
  }

  removeItem(key: string): void {
    this.storage.delete(key);
  }

  clear(): void {
    this.storage.clearAll();
  }
}
