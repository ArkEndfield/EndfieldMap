import { useEffect } from 'react';

import { loadingManager } from '@/services/loading';

/**
 * 加载进度的收尾控制。
 *
 * 界面本身由 `index.html` 里的内联加载器渲染（React 加载前就要出现），
 * 这里只负责在全部阶段完成后触发它的退场动画。
 *
 * 之前这个组件还会把 React 侧插值出来的 displayProgress 反向写回
 * `__LOADING_PROGRESS__.target`，把内联加载器按权重算好的目标值覆盖成
 * 一个多绕了一层缓动的滞后值，进度条因此明显拖尾。现在进度只单向流动：
 * 阶段进度 → 内联加载器加权求和 → 缓动 → CSS 变量。
 */
export function LoadingScreen() {
  useEffect(() => {
    let hidden = false;
    return loadingManager.subscribe((state) => {
      if (hidden || !state.isComplete) return;
      hidden = true;
      window.__LOADING_PROGRESS__?.hide();
    });
  }, []);

  return null; // 使用 index.html 中的初始加载器
}
