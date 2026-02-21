/**
 * 平台无关的同步键值存储接口
 *
 * Web 端由 localStorage 实现，React Native 端由 MMKV 实现。
 * 保持同步 API，因为 localStorage 和 MMKV 都是同步的。
 */
export interface IStorageAdapter {
  getItem<T>(key: string): T | null;
  setItem<T>(key: string, value: T): void;
  removeItem(key: string): void;
  clear(): void;
}
