import type { LoadingState } from '@endfieldmap/tools/const/enum';
import { StorageType } from '@endfieldmap/tools/const/enum';
import { JSONLoaderError } from '@endfieldmap/tools/const/error';
import type { StorageManager } from '@endfieldmap/tools/storage/manager';
import { isDev } from '@endfieldmap/tools/utils/runtime';

// 定义加载结果类型
export interface LoadResult<T> {
  data: T | null;
  error: Error | null;
  state: LoadingState;
}

export interface JSONLoaderConfig {
  storage: StorageManager;
}

export class JSONLoader {
  public storage: StorageManager;

  constructor(config: JSONLoaderConfig) {
    this.storage = config.storage;
  }

  /**
   * 给URL添加版本号或时间戳参数
   * @param url 原始URL
   * @returns 添加了参数的URL
   */
  private addVersionToURL(url: string): string {
    const separator = url.includes('?') ? '&' : '?';
    if (typeof __COMMIT_HASH__ !== 'undefined' && __COMMIT_HASH__) {
      return `${url}${separator}v=${__COMMIT_HASH__}`;
    }
    const timestamp = new Date().getTime();
    return `${url}${separator}t=${timestamp}`;
  }

  /**
   * 通用JSON加载函数
   * @param url JSON文件的URL
   * @param maxRetries 最大重试次数
   * @param retryDelay 重试延迟（毫秒）
   * @returns Promise<T> 返回JSON数据
   */
  public async loadJSON<T>(url: string, maxRetries: number = 5, retryDelay: number = 1000): Promise<T> {
    let retries = 0;

    // 检查IndexedDB缓存
    if (!isDev) {
      const cachedData = await this.storage.get<T>(url, StorageType.TEMPORARY);
      if (cachedData !== null) {
        return cachedData;
      }
    }

    while (retries < maxRetries) {
      try {
        // 使用添加了版本号/时间戳的URL进行请求
        const versionedURL = this.addVersionToURL(url);
        const response = await fetch(versionedURL);
        if (!response.ok) {
          throw new JSONLoaderError(`HTTP error! status: ${response.status}`, url);
        }
        const data = await response.json();

        if (!isDev) {
          // 存入IndexedDB缓存
          await this.storage.set(url, data, { type: StorageType.TEMPORARY });
        }

        return data;
      } catch (error) {
        retries++;
        if (retries === maxRetries) {
          throw new JSONLoaderError(`Failed to load JSON after ${maxRetries} retries: ${error}`, url);
        }
        // 等待一段时间后重试
        await new Promise<void>((resolve) => setTimeout(resolve, retryDelay));
      }
    }

    throw new JSONLoaderError('Unexpected error in loadJSON', url);
  }

  /**
   * 从IndexedDB缓存中清除特定URL的JSON数据
   * @param url 要清除缓存的URL
   */
  public async clearJSONCache(url?: string) {
    if (url) {
      // 清除特定URL的缓存
      await this.storage.set(url, null, { type: StorageType.TEMPORARY });
    } else {
      await this.storage.clear(StorageType.TEMPORARY);
    }
  }
}
