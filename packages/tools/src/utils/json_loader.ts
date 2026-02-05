import type { LoadingState } from '@endfieldmap/tools/const/enum';
import { JSONLoaderError } from '@endfieldmap/tools/const/error';
import { getVersionInfo } from '@endfieldmap/tools/utils/runtime';

// 定义加载结果类型
export interface LoadResult<T> {
  data: T | null;
  error: Error | null;
  state: LoadingState;
}

export class JSONLoader {
  /**
   * 给URL添加版本号或时间戳参数
   * @param url 原始URL
   * @returns 添加了参数的URL
   */
  private addVersionToURL(url: string): string {
    const { commitHash } = getVersionInfo();
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${commitHash}`;
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

    // 使用添加了版本号/时间戳的URL
    const versionedURL = this.addVersionToURL(url);

    while (retries < maxRetries) {
      try {
        const response = await fetch(versionedURL);
        if (!response.ok) {
          throw new JSONLoaderError(`HTTP error! status: ${response.status}`, url);
        }
        return await response.json();
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
}
