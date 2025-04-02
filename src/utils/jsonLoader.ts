import { ref } from 'vue';
import { getItem, setItem, StorageType } from './indexedDBStorage';

// 定义加载状态类型
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// 定义加载结果类型
export interface LoadResult<T> {
  data: T | null;
  error: Error | null;
  state: LoadingState;
}

/**
 * 通用JSON加载函数
 * @param url JSON文件的URL
 * @param maxRetries 最大重试次数
 * @param retryDelay 重试延迟（毫秒）
 * @returns Promise<T> 返回JSON数据
 */
export async function loadJSON<T>(
  url: string,
  maxRetries: number = 5,
  retryDelay: number = 1000
): Promise<T> {
  let retries = 0;

  // 检查IndexedDB缓存
  const cachedData = await getItem<T>(url, StorageType.TEMPORARY);
  if (cachedData !== null) {
    return cachedData;
  }

  while (retries < maxRetries) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      // 存入IndexedDB缓存
      await setItem(url, data, StorageType.TEMPORARY);

      return data;
    } catch (error) {
      retries++;
      if (retries === maxRetries) {
        throw new Error(
          `Failed to load JSON after ${maxRetries} retries: ${error}`
        );
      }
      // 等待一段时间后重试
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  throw new Error('Unexpected error in loadJSON');
}

/**
 * 创建一个响应式的JSON加载器
 * @param url JSON文件的URL
 * @returns 包含加载状态和数据的响应式对象
 */
export function useJSONLoader<T>(url: string) {
  const state = ref<LoadingState>('idle');
  const data = ref<T | null>(null);
  const error = ref<Error | null>(null);

  const load = async () => {
    state.value = 'loading';
    try {
      data.value = await loadJSON<T>(url);
      state.value = 'success';
    } catch (e) {
      error.value = e as Error;
      state.value = 'error';
      throw e;
    }
  };

  return {
    state,
    data,
    error,
    load,
  };
}

/**
 * 批量加载多个JSON文件
 * @param urls JSON文件URL数组
 * @returns Promise<Record<string, any>> 返回一个对象，key为URL，value为对应的数据
 */
export async function loadMultipleJSON(
  urls: string[]
): Promise<Record<string, any>> {
  const results: Record<string, any> = {};

  await Promise.all(
    urls.map(async url => {
      try {
        results[url] = await loadJSON(url);
      } catch (error) {
        console.error(`Error loading ${url}:`, error);
        throw error;
      }
    })
  );

  return results;
}

/**
 * 从IndexedDB缓存中清除特定URL的JSON数据
 * @param url 要清除缓存的URL
 */
export async function clearJSONCache(url?: string) {
  if (url) {
    // 清除特定URL的缓存
    await setItem(url, null, StorageType.TEMPORARY);
  } else {
    // 清除所有临时缓存
    await import('./indexedDBStorage').then(({ clearStore, StorageType }) => {
      clearStore(StorageType.TEMPORARY);
    });
  }
}
