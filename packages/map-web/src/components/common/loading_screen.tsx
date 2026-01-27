import { useEffect, useState } from 'react';

import { loadingManager } from '@/services/loading';

interface LoadingScreenProps {
  onComplete?: () => void;
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const unsubscribe = loadingManager.subscribe((state) => {
      setProgress(state.displayProgress);

      // 只有当显示进度也达到100%时才认为是真正的完成
      // 放宽一点点判断，因为可能有浮点数误差
      if (state.isComplete && state.displayProgress >= 99.9 && !isComplete) {
        setIsComplete(true);
        // 延迟调用 onComplete，让动画完成并停留一会儿
        // 增加到 800ms
        setTimeout(() => onComplete?.(), 800);
      }
    });

    return unsubscribe;
  }, [onComplete, isComplete]);

  // 同步到初始加载器
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window !== 'undefined' && (window as any).__LOADING_PROGRESS__) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__LOADING_PROGRESS__.target = progress;
    }
  }, [progress]);

  // 完成后隐藏初始加载器
  useEffect(() => {
    if (isComplete) {
      // 让 LoadingScreen 稍微等待一下再调用 hide
      // hide 内部已经有了针对 CSS transition 的等待逻辑
      // 这里只需要触发它
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__LOADING_PROGRESS__?.hide();
    }
  }, [isComplete]);

  return null; // 使用 index.html 中的初始加载器
}
