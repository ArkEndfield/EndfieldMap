import { afterEach, describe, expect, it, vi } from 'vitest';

import { StorageType } from '@endfieldmap/tools/const/enum';

import { StorageManager } from './manager';

function createRequest<T>() {
  return {
    result: undefined as T | undefined,
    error: undefined as Error | undefined,
    onsuccess: undefined as ((event: { target: unknown }) => void) | undefined,
    onerror: undefined as (() => void) | undefined,
  };
}

function createFakeDb() {
  const data = new Map<string, Map<string, unknown>>([
    [StorageType.TEMPORARY, new Map()],
    [StorageType.PERMANENT, new Map()],
  ]);

  return {
    close: vi.fn(),
    transaction: vi.fn((stores: string[], mode: string) => {
      const storeName = stores[0]!;
      const bucket = data.get(storeName)!;

      return {
        mode,
        objectStore: vi.fn(() => ({
          put: vi.fn((value: unknown, key: string) => {
            const request = createRequest<unknown>();
            bucket.set(key, value);
            queueMicrotask(() => request.onsuccess?.({ target: request }));
            return request;
          }),
          get: vi.fn((key: string) => {
            const request = createRequest<unknown>();
            request.result = bucket.get(key);
            queueMicrotask(() => request.onsuccess?.({ target: request }));
            return request;
          }),
          delete: vi.fn((key: string) => {
            const request = createRequest<unknown>();
            bucket.delete(key);
            queueMicrotask(() => request.onsuccess?.({ target: request }));
            return request;
          }),
          clear: vi.fn(() => {
            const request = createRequest<unknown>();
            bucket.clear();
            queueMicrotask(() => request.onsuccess?.({ target: request }));
            return request;
          }),
          getAllKeys: vi.fn(() => {
            const request = createRequest<Array<string>>();
            request.result = Array.from(bucket.keys());
            queueMicrotask(() => request.onsuccess?.({ target: request }));
            return request;
          }),
          openCursor: vi.fn(() => {
            const request = createRequest<unknown>();
            const entries = Array.from(bucket.entries());
            let index = 0;

            const advance = () => {
              if (index >= entries.length) {
                request.result = null as unknown;
                request.onsuccess?.({ target: request });
                return;
              }

              const [key, value] = entries[index++]!;
              request.result = {
                key,
                value,
                delete: () => {
                  bucket.delete(key);
                },
                continue: () => advance(),
              } as unknown;
              request.onsuccess?.({ target: request });
            };

            queueMicrotask(() => advance());
            return request;
          }),
        })),
      };
    }),
    _data: data,
  };
}

describe('StorageManager', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('stores and retrieves temporary and permanent values', async () => {
    const manager = new StorageManager({
      name: 'test',
      version: 1,
      description: 'test',
      defaultExpiry: 100,
    });
    const db = createFakeDb();
    (manager as unknown as { db: unknown }).db = db;

    await manager.set('temp', 'value');
    await manager.permanentSet('perm', 'forever');

    await expect(manager.get('temp')).resolves.toBe('value');
    await expect(manager.permanentGet('perm')).resolves.toBe('forever');
  });

  it('expires temporary values and keeps permanent values non-expiring', async () => {
    const nowSpy = vi.spyOn(Date, 'now');
    nowSpy.mockReturnValue(1000);

    const manager = new StorageManager({
      name: 'test',
      version: 1,
      description: 'test',
      defaultExpiry: 50,
    });
    const db = createFakeDb();
    (manager as unknown as { db: unknown }).db = db;

    await manager.set('temp', 'value');
    await manager.permanentSet('perm', 'forever');

    nowSpy.mockReturnValue(1100);

    await expect(manager.get('temp')).resolves.toBeNull();
    await expect(manager.permanentGet('perm')).resolves.toBe('forever');
  });

  it('supports keys, has, clearAll, getMetadata, and getAllRawItems', async () => {
    const manager = new StorageManager({
      name: 'test',
      version: 1,
      description: 'test',
      defaultExpiry: 50,
    });
    const db = createFakeDb();
    (manager as unknown as { db: unknown }).db = db;

    await manager.temporarySet('a', 1);
    await manager.permanentSet('b', 2);

    await expect(manager.temporaryKeys()).resolves.toEqual(['a']);
    await expect(manager.permanentKeys()).resolves.toEqual(['b']);
    await expect(manager.has('a')).resolves.toBe(true);
    await expect(manager.getMetadata('a')).resolves.toMatchObject({
      expiry: expect.any(Number),
      timestamp: expect.any(Number),
    });
    await expect(manager.permanentGetAllRawItems()).resolves.toEqual([
      {
        key: 'b',
        value: expect.objectContaining({ value: 2 }),
      },
    ]);

    await manager.clearAll();

    await expect(manager.temporaryKeys()).resolves.toEqual([]);
    await expect(manager.permanentKeys()).resolves.toEqual([]);
  });

  it('cleans expired entries and closes the database', async () => {
    const nowSpy = vi.spyOn(Date, 'now');
    nowSpy.mockReturnValue(1000);

    const manager = new StorageManager({
      name: 'test',
      version: 1,
      description: 'test',
      defaultExpiry: 50,
    });
    const db = createFakeDb();
    (manager as unknown as { db: unknown }).db = db;

    await manager.temporarySet('expired', 'x', { expiry: 10 });
    await manager.permanentSet('perm', 'y');

    nowSpy.mockReturnValue(2000);

    await manager.cleanExpired();

    await expect(manager.temporaryKeys()).resolves.toEqual([]);
    await expect(manager.permanentKeys()).resolves.toEqual(['perm']);

    manager.close();
    expect(db.close).toHaveBeenCalledTimes(1);
  });
});
