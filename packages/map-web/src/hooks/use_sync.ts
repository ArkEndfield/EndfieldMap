/**
 * 同步功能 React Hook
 * 简化组件中对同步管理器的访问
 * 使用方式：配合 MobX observer 进行响应式更新
 *
 * @example
 * ```tsx
 * import { observer } from 'mobx-react-lite';
 * import { useSyncManager } from '@/hooks/use_sync';
 *
 * const MyComponent = observer(() => {
 *   const sync = useSyncManager();
 *
 *   return (
 *     <div>
 *       {sync.isLoggedIn ? '已登录' : '未登录'}
 *       {sync.isSyncing && <span>同步中...</span>}
 *     </div>
 *   );
 * });
 * ```
 */
import { useEffect, useState } from 'react';

import { getSyncManager, SyncManager } from '@/services/data/sync/manager';

/**
 * 获取同步管理器实例的 Hook
 * 返回单例 SyncManager，其内部状态由 MobX 管理
 * 配合 observer() 使用以自动响应状态变化
 */
export function useSyncManager(): SyncManager {
  // getSyncManager() 已经是单例模式，直接调用即可
  return getSyncManager();
}

/**
 * 同步管理器初始化 Hook
 * 在应用启动时使用，确保同步管理器正确初始化
 *
 * @returns isReady - 同步管理器是否已初始化完成
 */
export function useSyncInit(): { isReady: boolean; error: Error | null } {
  const manager = useSyncManager();
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    manager
      .init()
      .then(() => {
        if (mounted) {
          setIsReady(true);
        }
      })
      .catch((err: Error) => {
        if (mounted) {
          setError(err);
        }
      });

    return () => {
      mounted = false;
    };
  }, [manager]);

  return { isReady, error };
}
