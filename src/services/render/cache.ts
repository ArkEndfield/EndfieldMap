import { CACHE_CLEANUP_TIMEOUT } from '@/services/render/constants';
import { getStore } from '@/services/render/store';

/**
 * 设置样式缓存清理
 * @param promise 待完成的Promise
 * @param cacheKey 缓存键名
 */
export function setupCacheCleanup(
  promise: Promise<any>,
  cacheKey: string
): void {
  const store = getStore();

  promise.finally(() => {
    // 清除之前的清理定时器
    if (store.styleCacheCleanupTimers[cacheKey]) {
      clearTimeout(store.styleCacheCleanupTimers[cacheKey]);
    }

    // 设置新的清理定时器
    store.styleCacheCleanupTimers[cacheKey] = window.setTimeout(() => {
      delete store.iconStyleCache[cacheKey];
      delete store.styleCacheCleanupTimers[cacheKey];
    }, CACHE_CLEANUP_TIMEOUT);
  });
}
