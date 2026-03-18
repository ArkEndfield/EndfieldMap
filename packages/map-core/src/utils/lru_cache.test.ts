import { describe, expect, it, vi } from 'vitest';

import { LRUCache } from './lru_cache';

describe('LRUCache', () => {
  it('evicts the least recently used entry when capacity is exceeded', () => {
    const cache = new LRUCache<string, number>(2);

    cache.set('a', 1);
    cache.set('b', 2);
    expect(cache.get('a')).toBe(1);

    cache.set('c', 3);

    expect(cache.has('a')).toBe(true);
    expect(cache.has('b')).toBe(false);
    expect(cache.has('c')).toBe(true);
  });

  it('updates recency when an existing key is overwritten', () => {
    const cache = new LRUCache<string, number>(2);

    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('a', 10);
    cache.set('c', 3);

    expect(cache.get('a')).toBe(10);
    expect(cache.has('b')).toBe(false);
    expect(cache.has('c')).toBe(true);
  });

  it('calls onEvict for capacity eviction, delete, and clear', () => {
    const onEvict = vi.fn<(key: string, value: number) => void>();
    const cache = new LRUCache<string, number>(2, onEvict);

    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    cache.delete('b');
    cache.clear();

    expect(onEvict).toHaveBeenCalledTimes(3);
    expect(onEvict).toHaveBeenNthCalledWith(1, 'a', 1);
    expect(onEvict).toHaveBeenNthCalledWith(2, 'b', 2);
    expect(onEvict).toHaveBeenNthCalledWith(3, 'c', 3);
    expect(cache.size).toBe(0);
  });

  it('returns undefined for missing keys', () => {
    const cache = new LRUCache<string, number>(1);

    expect(cache.get('missing')).toBeUndefined();
  });
});
