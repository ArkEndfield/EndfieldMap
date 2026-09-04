import type { IStorageAdapter } from '@endfieldmap/tools';

const NAMESPACE = 'endfieldmap';

export class WebStorageAdapter implements IStorageAdapter {
  getItem<T>(key: string): T | null {
    const item = localStorage.getItem(`${NAMESPACE}.${key}`);
    if (!item) return null;
    try {
      return JSON.parse(item) as T;
    } catch {
      // 坏值若直接抛出，会在模块求值期（如恢复登录 token）炸掉整个应用，
      // 加载页停在 0% 且只报一条 JSON 语法错误。丢弃坏值回退默认值更稳妥。
      localStorage.removeItem(`${NAMESPACE}.${key}`);
      return null;
    }
  }

  setItem<T>(key: string, value: T): void {
    localStorage.setItem(`${NAMESPACE}.${key}`, JSON.stringify(value));
  }

  removeItem(key: string): void {
    localStorage.removeItem(`${NAMESPACE}.${key}`);
  }

  clear(): void {
    const prefix = `${NAMESPACE}.`;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
  }
}
