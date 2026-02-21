import type { IStorageAdapter } from '@endfieldmap/tools/storage/storage_adapter';

let _adapter: IStorageAdapter | null = null;

export function registerStorageAdapter(adapter: IStorageAdapter): void {
  _adapter = adapter;
}

export function getStorageAdapter(): IStorageAdapter {
  if (!_adapter) {
    throw new Error('StorageAdapter not registered. Call registerStorageAdapter() before using storage.');
  }
  return _adapter;
}
