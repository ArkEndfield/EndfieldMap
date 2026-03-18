import { describe, expect, it, vi } from 'vitest';

import type { IStorageAdapter } from './storage_adapter';
import { LocalStorageDB } from './local_storage';
import { getStorageAdapter, registerStorageAdapter } from './storage_provider';

describe('storage provider', () => {
  it('throws when no storage adapter has been registered', () => {
    expect(() => getStorageAdapter()).toThrow(
      'StorageAdapter not registered. Call registerStorageAdapter() before using storage.'
    );
  });

  it('returns the registered adapter and proxies LocalStorageDB operations to it', () => {
    const getItemSpy = vi.fn((key: string) => (key === 'answer' ? 42 : null));
    const adapter: IStorageAdapter = {
      getItem<T>(key: string): T | null {
        return getItemSpy(key) as T | null;
      },
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };

    registerStorageAdapter(adapter);

    expect(getStorageAdapter()).toBe(adapter);
    expect(LocalStorageDB.get<number>('answer')).toBe(42);

    LocalStorageDB.set('answer', 43);
    LocalStorageDB.removeItem('answer');
    LocalStorageDB.clear();

    expect(getItemSpy).toHaveBeenCalledWith('answer');
    expect(adapter.setItem).toHaveBeenCalledWith('answer', 43);
    expect(adapter.removeItem).toHaveBeenCalledWith('answer');
    expect(adapter.clear).toHaveBeenCalled();
  });
});
