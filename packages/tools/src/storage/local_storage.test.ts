import { afterEach, describe, expect, it, vi } from 'vitest';

import { registerStorageAdapter } from './storage_provider';
import { LocalStorageDB } from './local_storage';

describe('LocalStorageDB', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('proxies all storage operations to the registered adapter', () => {
    const adapter = {
      getItem: vi.fn().mockReturnValue('value'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };

    registerStorageAdapter(adapter);

    expect(LocalStorageDB.getItem<string>('key')).toBe('value');
    expect(LocalStorageDB.get<string>('key')).toBe('value');

    LocalStorageDB.setItem('key', 'next');
    LocalStorageDB.set('key', 'next-2');
    LocalStorageDB.removeItem('key');
    LocalStorageDB.clear();

    expect(adapter.getItem).toHaveBeenCalledTimes(2);
    expect(adapter.setItem).toHaveBeenNthCalledWith(1, 'key', 'next');
    expect(adapter.setItem).toHaveBeenNthCalledWith(2, 'key', 'next-2');
    expect(adapter.removeItem).toHaveBeenCalledWith('key');
    expect(adapter.clear).toHaveBeenCalledTimes(1);
  });
});
