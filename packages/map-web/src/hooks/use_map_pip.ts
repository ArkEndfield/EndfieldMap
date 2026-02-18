import type { EndfieldMapAdapter } from '@endfieldmap/map-core';
import { useLayoutEffect } from 'react';

/**
 * 处理画中画窗口变化时地图特定逻辑的 Hook
 * @param adapter 地图适配器实例
 * @param containerRef 地图容器元素的引用
 * @param pipWindow 画中画窗口实例（如果存在）
 */
export function useMapPiP(
  adapter: EndfieldMapAdapter | null,
  containerRef: React.RefObject<HTMLDivElement | null>,
  pipWindow: Window | null
) {
  // 监听窗口变化，同步地图目标和尺寸
  useLayoutEffect(() => {
    if (!adapter || !containerRef.current) return;

    const map = adapter.mapController.olMapRenderer.map;

    // 当切换到画中画模式时，容器 div 会被移动到新窗口。
    // 我们需要确保地图更新其目标为这个被移动的元素，并重新调整大小。

    const resizeObserver = new ResizeObserver(() => {
      map.updateSize();
    });

    // 观察容器的父级或 body 以检测窗口交互/调整大小
    if (pipWindow) {
      resizeObserver.observe(pipWindow.document.body);
    } else {
      resizeObserver.observe(document.body);
    }

    // 强制严格的目标重新关联
    // 我们首先将目标设置为 undefined，以强制 OpenLayers 分离旧窗口的监听器
    map.setTarget(undefined);

    // 使用 requestAnimationFrame 确保 DOM 已完成 Portal 移动
    const rafId = requestAnimationFrame(() => {
      if (containerRef.current) {
        map.setTarget(containerRef.current);
        map.updateSize();
      }
    });

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [pipWindow, adapter, containerRef]);
}
