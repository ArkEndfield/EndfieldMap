import { StorageType } from '@endfieldmap/tools/const/enum';
import type { SetOptions, StorageConfig, StorageItem } from '@endfieldmap/tools/storage/typings';

// 存储管理器类
export class StorageManager {
  private config: StorageConfig;
  private db: IDBDatabase | null = null;
  private isInitializing: boolean = false;
  private initPromise: Promise<void> | null = null;

  constructor(config: StorageConfig) {
    this.config = config;
  }

  /**
   * 初始化 IndexedDB 数据库
   */
  public async init(): Promise<void> {
    // 如果已经初始化，直接返回
    if (this.db) {
      return;
    }

    // 如果正在初始化，等待初始化完成
    if (this.isInitializing && this.initPromise) {
      return this.initPromise;
    }

    this.isInitializing = true;
    this.initPromise = new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.config.name, this.config.version);

      request.onerror = () => {
        this.isInitializing = false;
        reject(new Error(`无法打开数据库: ${request.error?.message || '未知错误'}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitializing = false;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 创建临时存储对象仓库
        if (!db.objectStoreNames.contains(StorageType.TEMPORARY)) {
          db.createObjectStore(StorageType.TEMPORARY);
        }

        // 创建永久存储对象仓库
        if (!db.objectStoreNames.contains(StorageType.PERMANENT)) {
          db.createObjectStore(StorageType.PERMANENT);
        }
      };
    });

    return this.initPromise;
  }

  /**
   * 确保数据库已初始化
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.db) {
      await this.init();
    }
  }

  /**
   * 设置存储项
   * @param key 键名
   * @param value 值
   * @param options 设置选项
   */
  public async set<T>(key: string, value: T, options?: SetOptions): Promise<void> {
    await this.ensureInitialized();

    const type = options?.type || StorageType.TEMPORARY;

    // 计算过期时间
    let expiry: number | null;
    if (type === StorageType.PERMANENT) {
      // PERMANENT 类型永不过期
      expiry = null;
    } else {
      // TEMPORARY 类型
      if (options?.expiry !== undefined) {
        // 使用用户指定的过期时间
        expiry = options.expiry;
      } else {
        // 使用默认过期时间，如果没有设置则默认 1 小时（3600000 毫秒）
        expiry = this.config.defaultExpiry ?? 3600000;
      }
    }

    const item: StorageItem<T> = {
      value,
      timestamp: Date.now(),
      expiry: expiry !== null ? Date.now() + expiry : null,
    };

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'));
        return;
      }

      const transaction = this.db.transaction([type], 'readwrite');
      const store = transaction.objectStore(type);
      const request = store.put(item, key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`存储失败: ${request.error?.message || '未知错误'}`));
    });
  }

  /**
   * 获取存储项
   * @param key 键名
   * @param type 存储类型
   * @returns 存储的值，如果不存在或已过期则返回 null
   */
  public async get<T>(key: string, type: StorageType = StorageType.TEMPORARY): Promise<T | null> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'));
        return;
      }

      const transaction = this.db.transaction([type], 'readonly');
      const store = transaction.objectStore(type);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result as StorageItem<T> | undefined;

        if (!result) {
          resolve(null);
          return;
        }

        // 检查是否过期
        if (result.expiry !== null && Date.now() > result.expiry) {
          // 异步删除过期项
          this.remove(key, type).catch(() => {
            // 静默处理删除错误
          });
          resolve(null);
          return;
        }

        resolve(result.value);
      };

      request.onerror = () => reject(new Error(`获取失败: ${request.error?.message || '未知错误'}`));
    });
  }

  /**
   * 保存到永久存储语法糖，相当于 set(key, value, { type: StorageType.PERMANENT })
   */
  public async permanentSet<T>(key: string, value: T, options?: SetOptions): Promise<void> {
    await this.set(key, value, { ...options, type: StorageType.PERMANENT });
  }

  /**
   * 从永久存储获取语法糖，相当于 get(key, StorageType.PERMANENT)
   */
  public async permanentGet<T>(key: string): Promise<T | null> {
    return await this.get(key, StorageType.PERMANENT);
  }

  /**
   * 从永久存储删除语法糖，相当于 remove(key, StorageType.PERMANENT)
   */
  public async permanentRemove(key: string): Promise<void> {
    await this.remove(key, StorageType.PERMANENT);
  }

  /**
   * 清空永久存储语法糖，相当于 clear(StorageType.PERMANENT)
   */
  public async permanentClear(): Promise<void> {
    await this.clear(StorageType.PERMANENT);
  }

  /**
   * 获取所有永久存储的键语法糖，相当于 keys(StorageType.PERMANENT)
   */
  public async permanentKeys(): Promise<string[]> {
    return await this.keys(StorageType.PERMANENT);
  }

  /**
   * 保存到临时存储语法糖，相当于 set(key, value, { type: StorageType.TEMPORARY })
   */
  public async temporarySet<T>(key: string, value: T, options?: SetOptions): Promise<void> {
    await this.set(key, value, { ...options, type: StorageType.TEMPORARY });
  }

  /**
   * 从临时存储获取语法糖，相当于 get(key, StorageType.TEMPORARY)
   */
  public async temporaryGet<T>(key: string): Promise<T | null> {
    return await this.get(key, StorageType.TEMPORARY);
  }

  /**
   * 从临时存储删除语法糖，相当于 remove(key, StorageType.TEMPORARY)
   */
  public async temporaryRemove(key: string): Promise<void> {
    await this.remove(key, StorageType.TEMPORARY);
  }

  /**
   * 清空临时存储语法糖，相当于 clear(StorageType.TEMPORARY)
   */
  public async temporaryClear(): Promise<void> {
    await this.clear(StorageType.TEMPORARY);
  }

  /**
   * 获取所有临时存储的键语法糖，相当于 keys(StorageType.TEMPORARY)
   */
  public async temporaryKeys(): Promise<string[]> {
    return await this.keys(StorageType.TEMPORARY);
  }

  /**
   * 删除存储项
   * @param key 键名
   * @param type 存储类型
   */
  public async remove(key: string, type: StorageType = StorageType.TEMPORARY): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'));
        return;
      }

      const transaction = this.db.transaction([type], 'readwrite');
      const store = transaction.objectStore(type);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`删除失败: ${request.error?.message || '未知错误'}`));
    });
  }

  /**
   * 清空指定类型的所有存储项
   * @param type 存储类型
   */
  public async clear(type: StorageType): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'));
        return;
      }

      const transaction = this.db.transaction([type], 'readwrite');
      const store = transaction.objectStore(type);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`清空失败: ${request.error?.message || '未知错误'}`));
    });
  }

  /**
   * 清空所有存储
   */
  public async clearAll(): Promise<void> {
    await Promise.all([this.clear(StorageType.TEMPORARY), this.clear(StorageType.PERMANENT)]);
  }

  /**
   * 获取指定类型的所有键
   * @param type 存储类型
   */
  public async keys(type: StorageType): Promise<string[]> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'));
        return;
      }

      const transaction = this.db.transaction([type], 'readonly');
      const store = transaction.objectStore(type);
      const request = store.getAllKeys();

      request.onsuccess = () => {
        const keys = request.result.map((key) => String(key));
        resolve(keys);
      };

      request.onerror = () => reject(new Error(`获取键列表失败: ${request.error?.message || '未知错误'}`));
    });
  }

  /**
   * 检查指定键是否存在且未过期
   * @param key 键名
   * @param type 存储类型
   */
  public async has(key: string, type: StorageType = StorageType.TEMPORARY): Promise<boolean> {
    const value = await this.get(key, type);
    return value !== null;
  }

  /**
   * 清理所有过期的存储项
   */
  public async cleanExpired(): Promise<void> {
    await this.ensureInitialized();

    const cleanStore = async (type: StorageType): Promise<void> => {
      if (!this.db) {
        throw new Error('数据库未初始化');
      }

      return new Promise((resolve, reject) => {
        if (!this.db) {
          reject(new Error('数据库未初始化'));
          return;
        }

        const transaction = this.db.transaction([type], 'readwrite');
        const store = transaction.objectStore(type);
        const request = store.openCursor();
        const now = Date.now();

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;

          if (cursor) {
            const item = cursor.value as StorageItem<unknown>;

            // 如果已过期，删除
            if (item.expiry !== null && now > item.expiry) {
              cursor.delete();
            }

            cursor.continue();
          } else {
            resolve();
          }
        };

        request.onerror = () => reject(new Error(`清理过期项失败: ${request.error?.message || '未知错误'}`));
      });
    };

    await Promise.all([cleanStore(StorageType.TEMPORARY), cleanStore(StorageType.PERMANENT)]);
  }

  /**
   * 获取存储项的元信息（不包含值）
   * @param key 键名
   * @param type 存储类型
   */
  public async getMetadata(
    key: string,
    type: StorageType = StorageType.TEMPORARY
  ): Promise<Omit<StorageItem<unknown>, 'value'> | null> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'));
        return;
      }

      const transaction = this.db.transaction([type], 'readonly');
      const store = transaction.objectStore(type);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result as StorageItem<unknown> | undefined;

        if (!result) {
          resolve(null);
          return;
        }

        resolve({
          timestamp: result.timestamp,
          expiry: result.expiry,
        });
      };

      request.onerror = () => reject(new Error(`获取元信息失败: ${request.error?.message || '未知错误'}`));
    });
  }

  /**
   * 关闭数据库连接
   */
  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
