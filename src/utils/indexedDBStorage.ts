/**
 * IndexedDB 存储工具
 * 提供临时缓存和永久存储能力
 */

// 存储类型枚举
export enum StorageType {
  TEMPORARY = 'temporary',
  PERMANENT = 'permanent',
}

// 存储项结构
interface StorageItem<T> {
  value: T;
  timestamp: number;
  expiry: number | null; // null表示永不过期
}

// 数据库配置
const DB_NAME = 'EndfieldMapDB';
const DB_VERSION = 1;
const STORES = {
  [StorageType.TEMPORARY]: 'temporaryStore',
  [StorageType.PERMANENT]: 'permanentStore',
};

// 默认缓存时间（1小时）
const DEFAULT_CACHE_DURATION = 60 * 60 * 1000;

// 判断是否为开发环境
const isDevelopment = import.meta.env.MODE === 'development';

// 数据库连接单例
let dbInstance: IDBDatabase | null = null;

// 数据库初始化状态
let isInitializing = false;
let initPromise: Promise<IDBDatabase> | null = null;

/**
 * 初始化IndexedDB数据库
 * @returns Promise<IDBDatabase>
 */
export function initDB(): Promise<IDBDatabase> {
  // 如果已经有实例，直接返回
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  // 如果正在初始化中，返回初始化的Promise
  if (isInitializing && initPromise) {
    return initPromise;
  }

  isInitializing = true;

  // 直接打开数据库，不再删除现有数据库
  initPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = event => {
      isInitializing = false;
      console.error('IndexedDB打开失败:', event);
      reject(new Error('无法打开IndexedDB数据库'));
    };

    request.onsuccess = event => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      isInitializing = false;
      console.log('IndexedDB数据库初始化成功');
      resolve(dbInstance);
    };

    request.onupgradeneeded = event => {
      console.log('正在创建或升级数据库...');
      const db = (event.target as IDBOpenDBRequest).result;

      // 创建临时存储
      if (!db.objectStoreNames.contains(STORES[StorageType.TEMPORARY])) {
        db.createObjectStore(STORES[StorageType.TEMPORARY]);
        console.log(`已创建 ${STORES[StorageType.TEMPORARY]} 存储`);
      }

      // 创建永久存储
      if (!db.objectStoreNames.contains(STORES[StorageType.PERMANENT])) {
        db.createObjectStore(STORES[StorageType.PERMANENT]);
        console.log(`已创建 ${STORES[StorageType.PERMANENT]} 存储`);
      }
    };
  });

  return initPromise;
}

/**
 * 安全获取事务
 * 确保数据库已初始化并且所需的对象存储存在
 * @param storeNames 存储名称
 * @param mode 事务模式
 * @returns Promise<IDBTransaction>
 */
async function getTransaction(
  storeNames: string | string[],
  mode: IDBTransactionMode
): Promise<IDBTransaction> {
  // 强制重新初始化数据库以确保对象存储存在
  await initDB();

  const db = dbInstance!;
  const storeNamesArray =
    typeof storeNames === 'string' ? [storeNames] : storeNames;

  // 再次检查所有请求的存储是否存在
  for (const storeName of storeNamesArray) {
    if (!db.objectStoreNames.contains(storeName)) {
      throw new Error(`对象存储 "${storeName}" 不存在，即使在初始化之后`);
    }
  }

  return db.transaction(storeNames, mode);
}

/**
 * 存储数据到IndexedDB
 * @param key 键名
 * @param value 数据
 * @param type 存储类型（临时或永久）
 * @param expiryDuration 过期时间（毫秒），仅对临时存储有效，默认1小时，设为null时表示不过期
 * @returns Promise<void>
 */
export async function setItem<T>(
  key: string,
  value: T,
  type: StorageType = StorageType.TEMPORARY,
  expiryDuration: number | null = DEFAULT_CACHE_DURATION
): Promise<void> {
  // 开发模式下不缓存带过期时间的临时数据
  if (
    isDevelopment &&
    type === StorageType.TEMPORARY &&
    expiryDuration !== null
  ) {
    return;
  }

  try {
    // 确保数据库初始化
    await initDB();

    return new Promise(async (resolve, reject) => {
      try {
        const transaction = await getTransaction(STORES[type], 'readwrite');
        const store = transaction.objectStore(STORES[type]);

        const item: StorageItem<T> = {
          value,
          timestamp: Date.now(),
          expiry: expiryDuration !== null ? Date.now() + expiryDuration : null,
        };

        const request = store.put(item, key);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = event => {
          console.error('存储数据失败:', event);
          reject(new Error('存储数据失败'));
        };
      } catch (error) {
        reject(error);
      }
    });
  } catch (error) {
    console.error('存储数据时出错:', error);
    throw error;
  }
}

/**
 * 从IndexedDB获取数据
 * @param key 键名
 * @param type 存储类型（临时或永久）
 * @returns Promise<T | null> 返回数据，如果不存在或已过期则返回null
 */
export async function getItem<T>(
  key: string,
  type: StorageType = StorageType.TEMPORARY
): Promise<T | null> {
  try {
    // 确保数据库初始化
    await initDB();

    return new Promise(async (resolve, reject) => {
      try {
        const transaction = await getTransaction(STORES[type], 'readonly');
        const store = transaction.objectStore(STORES[type]);
        const request = store.get(key);

        request.onsuccess = () => {
          const item = request.result as StorageItem<T> | undefined;

          // 检查数据是否存在
          if (!item) {
            resolve(null);
            return;
          }

          // 检查数据是否过期（仅针对临时存储）
          if (
            type === StorageType.TEMPORARY &&
            item.expiry !== null &&
            item.expiry < Date.now()
          ) {
            // 数据已过期，删除并返回null
            store.delete(key);
            resolve(null);
            return;
          }

          // 开发模式下跳过带过期时间的临时数据
          if (
            isDevelopment &&
            type === StorageType.TEMPORARY &&
            item.expiry !== null
          ) {
            resolve(null);
            return;
          }

          resolve(item.value);
        };

        request.onerror = event => {
          console.error('获取数据失败:', event);
          reject(new Error('获取数据失败'));
        };
      } catch (error) {
        reject(error);
      }
    });
  } catch (error) {
    console.error('获取数据时出错:', error);
    return null;
  }
}

/**
 * 从IndexedDB删除数据
 * @param key 键名
 * @param type 存储类型（临时或永久）
 * @returns Promise<void>
 */
export async function removeItem(
  key: string,
  type: StorageType = StorageType.TEMPORARY
): Promise<void> {
  try {
    // 确保数据库初始化
    await initDB();

    return new Promise(async (resolve, reject) => {
      try {
        const transaction = await getTransaction(STORES[type], 'readwrite');
        const store = transaction.objectStore(STORES[type]);
        const request = store.delete(key);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = event => {
          console.error('删除数据失败:', event);
          reject(new Error('删除数据失败'));
        };
      } catch (error) {
        reject(error);
      }
    });
  } catch (error) {
    console.error('删除数据时出错:', error);
    throw error;
  }
}

/**
 * 清除特定类型的所有存储数据
 * @param type 存储类型（临时或永久）
 * @returns Promise<void>
 */
export async function clearStore(type: StorageType): Promise<void> {
  try {
    // 确保数据库初始化
    await initDB();

    return new Promise(async (resolve, reject) => {
      try {
        const transaction = await getTransaction(STORES[type], 'readwrite');
        const store = transaction.objectStore(STORES[type]);
        const request = store.clear();

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = event => {
          console.error('清除存储失败:', event);
          reject(new Error('清除存储失败'));
        };
      } catch (error) {
        reject(error);
      }
    });
  } catch (error) {
    console.error('清除存储时出错:', error);
    throw error;
  }
}

/**
 * 清除所有过期的临时缓存数据
 * @returns Promise<void>
 */
export async function clearExpiredCache(): Promise<void> {
  try {
    // 确保数据库初始化
    await initDB();

    return new Promise(async (resolve, reject) => {
      try {
        const transaction = await getTransaction(
          STORES[StorageType.TEMPORARY],
          'readwrite'
        );
        const store = transaction.objectStore(STORES[StorageType.TEMPORARY]);
        const request = store.openCursor();

        // 用于检查是否有未处理的游标
        let hasPendingCursors = false;

        request.onsuccess = event => {
          const cursor = (event.target as IDBRequest)
            .result as IDBCursorWithValue;
          if (cursor) {
            hasPendingCursors = true;
            const item = cursor.value as StorageItem<any>;
            if (item.expiry !== null && item.expiry < Date.now()) {
              // 删除过期项
              cursor.delete();
            }
            cursor.continue();
          } else if (!hasPendingCursors) {
            // 如果没有游标（即空存储），也需要调用 resolve
            resolve();
          }
        };

        request.onerror = event => {
          console.error('清除过期缓存失败:', event);
          reject(new Error('清除过期缓存失败'));
        };

        transaction.oncomplete = () => {
          resolve();
        };

        transaction.onerror = event => {
          reject(new Error(`事务失败: ${event}`));
        };
      } catch (error) {
        reject(error);
      }
    });
  } catch (error) {
    console.error('清除过期缓存时出错:', error);
    // 即使清除失败也不阻止程序继续运行
    return Promise.resolve();
  }
}
