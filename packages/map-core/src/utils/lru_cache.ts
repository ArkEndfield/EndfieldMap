/**
 * LRU (Least Recently Used) 缓存
 * 用于限制渲染器缓存数量，自动清理最少使用的条目
 */
export class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private readonly maxSize: number;
  private readonly onEvict?: (key: K, value: V) => void;

  /**
   * @param maxSize 最大缓存数量
   * @param onEvict 当条目被驱逐时的回调函数
   */
  constructor(maxSize: number, onEvict?: (key: K, value: V) => void) {
    this.maxSize = maxSize;
    this.onEvict = onEvict;
  }

  /**
   * 获取缓存值，并将其移动到最近使用位置
   */
  get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      return undefined;
    }

    // 移动到最近使用位置（Map 保持插入顺序）
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  /**
   * 设置缓存值
   */
  set(key: K, value: V): void {
    // 如果已存在，先删除（以更新顺序）
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // 如果超出限制，删除最旧的条目
    while (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        const oldestValue = this.cache.get(oldestKey)!;
        this.cache.delete(oldestKey);
        this.onEvict?.(oldestKey, oldestValue);
      }
    }

    this.cache.set(key, value);
  }

  /**
   * 检查是否存在
   */
  has(key: K): boolean {
    return this.cache.has(key);
  }

  /**
   * 删除指定条目
   */
  delete(key: K): boolean {
    const value = this.cache.get(key);
    if (value !== undefined) {
      this.cache.delete(key);
      this.onEvict?.(key, value);
      return true;
    }
    return false;
  }

  /**
   * 清空缓存
   */
  clear(): void {
    for (const [key, value] of this.cache) {
      this.onEvict?.(key, value);
    }
    this.cache.clear();
  }

  /**
   * 获取当前缓存大小
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * 获取所有条目（用于迭代）
   */
  entries(): IterableIterator<[K, V]> {
    return this.cache.entries();
  }

  /**
   * 获取所有键
   */
  keys(): IterableIterator<K> {
    return this.cache.keys();
  }

  /**
   * 获取所有值
   */
  values(): IterableIterator<V> {
    return this.cache.values();
  }
}
