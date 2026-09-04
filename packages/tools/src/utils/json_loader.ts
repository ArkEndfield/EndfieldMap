import type { LoadingState } from '@endfieldmap/tools/const/enum';
import { JSONLoaderError } from '@endfieldmap/tools/const/error';
import { getVersionInfo, isDev } from '@endfieldmap/tools/utils/runtime';

// 定义加载结果类型
export interface LoadResult<T> {
  data: T | null;
  error: Error | null;
  state: LoadingState;
}

/**
 * 单次请求超时。挂起的连接（不 RST 的黑洞地址、运营商劫持等）默认要等
 * 浏览器 TCP 栈几分钟才失败，期间加载页会一直卡住；有兜底超时才能让
 * 重试逻辑真正轮转起来。
 */
const FETCH_TIMEOUT_MS = 15_000;

function createTimeoutSignal(): AbortSignal | undefined {
  // RN 等环境可能没有 AbortSignal.timeout，退化为无超时（与旧行为一致）
  if (typeof AbortSignal === 'undefined' || typeof AbortSignal.timeout !== 'function') {
    return undefined;
  }
  return AbortSignal.timeout(FETCH_TIMEOUT_MS);
}

export class JSONLoader {
  /**
   * 给URL添加版本号或时间戳参数
   * @param url 原始URL
   * @returns 添加了参数的URL
   */
  private addVersionToURL(url: string): string {
    // dev 模式下 commitHash 不随本地数据变化，改用时间戳避免命中缓存
    const version = isDev ? Date.now().toString() : getVersionInfo().commitHash;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${version}`;
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
        // 每次重试都重新计时：signal 不能复用，超时过的 signal 已是 aborted
        const response = await fetch(versionedURL, { signal: createTimeoutSignal() });
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
