import type { IStorageAdapter } from '@endfieldmap/tools';

const NAMESPACE = 'endfieldmap';

export class WebStorageAdapter implements IStorageAdapter {
  getItem<T>(key: string): T | null {
    const item = localStorage.getItem(`${NAMESPACE}.${key}`);
    return item ? JSON.parse(item) : null;
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
