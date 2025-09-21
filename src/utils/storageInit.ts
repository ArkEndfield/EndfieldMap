import { clearExpiredCache } from '@/utils/indexedDBStorage';
import { rafInterval, RafIntervalResult } from '@/utils/animationTimer';

/**
 * 初始化存储系统
 * 在应用启动时调用
 */
export async function initStorageSystem() {
  // 清理过期的缓存数据
  try {
    await clearExpiredCache();
    console.log('过期缓存已清理');
  } catch (error) {
    console.error('清理过期缓存失败:', error);
  }
}

/**
 * 定期清理过期缓存
 * @param interval 清理间隔（毫秒），默认1小时
 */

export function setupCacheCleanupScheduler(interval: number = 60 * 60 * 1000) {
  // 设置基于requestAnimationFrame的定时器，定期清理过期缓存
  let timerHandle: RafIntervalResult | null = null;

  const startCleanupTimer = () => {
    timerHandle = rafInterval(
      async () => {
        try {
          await clearExpiredCache();
          console.log('定时清理过期缓存完成');
        } catch (error) {
          console.error('定时清理过期缓存失败:', error);
        }
      },
      interval,
      { autoAdjust: true }
    );
  };

  // 启动定时器
  startCleanupTimer();

  // 返回清理函数，用于在组件卸载时清理定时器
  return () => {
    if (timerHandle) {
      timerHandle.cancel();
      timerHandle = null;
    }
  };
}
