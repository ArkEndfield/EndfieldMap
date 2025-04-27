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

// 添加一个显式的初始化完成标志
let isDBInitialized = false;

/**
 * 初始化IndexedDB数据库
 * @returns Promise<IDBDatabase>
 */
export function initDB(): Promise<IDBDatabase> {
  // 如果已经有实例，直接返回
  if (dbInstance && isDBInitialized) {
    return Promise.resolve(dbInstance);
  }

  // 如果正在初始化中，返回初始化的Promise
  if (isInitializing && initPromise) {
    return initPromise;
  }

  isInitializing = true;
  console.log('开始初始化 IndexedDB 数据库...');

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
      isDBInitialized = true;
      console.log('IndexedDB数据库初始化成功');

      // 添加数据库关闭事件监听
      dbInstance.onclose = () => {
        console.log('IndexedDB连接已关闭，重置状态');
        dbInstance = null;
        isDBInitialized = false;
      };

      // 添加错误处理
      dbInstance.onerror = event => {
        console.error('IndexedDB出错:', event);
      };

      // 添加版本变更处理
      dbInstance.onversionchange = () => {
        if (dbInstance) {
          dbInstance.close();
          dbInstance = null;
          isDBInitialized = false;
          console.log('IndexedDB版本已变更，连接已关闭');
        }
      };

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

// 立即自动初始化数据库，确保在应用启动时就完成初始化
initDB().catch(error => {
  console.error('自动初始化IndexedDB失败:', error);
});

/**
 * 强制重新初始化数据库连接
 * 在出现连接问题时可以调用此函数
 */
export async function reinitializeDB(): Promise<IDBDatabase> {
  // 如果有现有实例，先关闭它
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch (e) {
      console.error('关闭现有数据库连接失败:', e);
    }
  }

  // 重置所有状态
  dbInstance = null;
  isInitializing = false;
  isDBInitialized = false;
  initPromise = null;

  // 重新初始化
  return initDB();
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
  // 如果数据库实例不存在或未完全初始化，则强制重新初始化
  if (!dbInstance || !isDBInitialized) {
    console.log('数据库未初始化，正在初始化...');
    await initDB();
  }

  const db = dbInstance!;
  const storeNamesArray =
    typeof storeNames === 'string' ? [storeNames] : storeNames;

  // 检查所有请求的存储是否存在
  for (const storeName of storeNamesArray) {
    if (!db.objectStoreNames.contains(storeName)) {
      console.error(`对象存储 "${storeName}" 不存在，尝试重新初始化数据库`);
      // 如果存储不存在，尝试重新初始化数据库
      await reinitializeDB();

      // 再次检查存储是否存在
      if (!dbInstance!.objectStoreNames.contains(storeName)) {
        throw new Error(`对象存储 "${storeName}" 不存在，无法创建事务`);
      }
    }
  }

  try {
    const transaction = db.transaction(storeNames, mode);

    // 添加错误处理
    transaction.onerror = event => {
      console.error(`事务出错:`, event);
    };

    return transaction;
  } catch (error) {
    console.error('创建事务失败，尝试重新初始化数据库:', error);
    await reinitializeDB();
    return dbInstance!.transaction(storeNames, mode);
  }
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
  // 开发模式下打印提示，但仍然允许存储
  if (isDevelopment) {
    console.log(`[IndexedDB] 存储数据: ${key} (${type})`);
  }

  // 修复：permanentStore 永不过期
  if (type === StorageType.PERMANENT) {
    expiryDuration = null;
  }

  try {
    // 确保数据库初始化
    await initDB();

    return new Promise((resolve, reject) => {
      try {
        const transaction = dbInstance!.transaction(STORES[type], 'readwrite');
        const store = transaction.objectStore(STORES[type]);

        // 确保数据是可序列化的
        const serializedValue = JSON.parse(JSON.stringify(value));

        const item: StorageItem<T> = {
          value: serializedValue,
          timestamp: Date.now(),
          expiry: expiryDuration !== null ? Date.now() + expiryDuration : null,
        };

        const request = store.put(item, key);

        request.onsuccess = () => {
          if (isDevelopment) {
            console.log(`[IndexedDB] 存储成功: ${key}`);
          }
        };

        request.onerror = event => {
          console.error('存储数据失败:', event);
          reject(new Error('存储数据失败'));
        };

        // 等待事务完成
        transaction.oncomplete = () => {
          resolve();
        };

        transaction.onerror = event => {
          console.error('事务执行失败:', event);
          reject(new Error('事务执行失败'));
        };

        // 确保事务不会自动关闭
        transaction.onabort = event => {
          console.error('事务被中止:', event);
          reject(new Error('事务被中止'));
        };
      } catch (error) {
        console.error('存储数据时发生错误:', error);
        reject(error);
      }
    });
  } catch (error) {
    console.error('存储数据时发生错误:', error);
    throw error;
  }
}

/**
 * 从IndexedDB获取数据
 * @param key 键名
 * @param type 存储类型（临时或永久）
 * @returns Promise<T | null>
 */
export async function getItem<T>(
  key: string,
  type: StorageType = StorageType.TEMPORARY
): Promise<T | null> {
  // 开发模式下打印提示
  if (isDevelopment) {
    console.log(`[IndexedDB] 获取数据: ${key} (${type})`);
  }

  try {
    // 确保数据库初始化
    await initDB();

    return new Promise(async (resolve, reject) => {
      try {
        const transaction = await getTransaction(STORES[type], 'readonly');
        const store = transaction.objectStore(STORES[type]);

        const request = store.get(key);

        request.onsuccess = () => {
          const result = request.result as StorageItem<T> | undefined;
          if (!result) {
            if (isDevelopment) {
              console.log(`[IndexedDB] 数据不存在: ${key}`);
            }
            resolve(null);
            return;
          }

          // 检查是否过期
          if (result.expiry !== null && Date.now() > result.expiry) {
            if (isDevelopment) {
              console.log(`[IndexedDB] 数据已过期: ${key}`);
            }
            // 删除过期数据
            removeItem(key, type).catch(error => {
              console.error('删除过期数据失败:', error);
            });
            resolve(null);
            return;
          }

          if (isDevelopment) {
            console.log(`[IndexedDB] 获取成功: ${key}`);
          }
          resolve(result.value);
        };

        request.onerror = event => {
          console.error('获取数据失败:', event);
          reject(new Error('获取数据失败'));
        };
      } catch (error) {
        console.error('获取数据时发生错误:', error);
        reject(error);
      }
    });
  } catch (error) {
    console.error('获取数据时发生错误:', error);
    throw error;
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
