import { EndfieldMapAdapter } from '@endfieldmap/map-adapter-ol';
import { MAP_EVENT } from '@endfieldmap/map-core';

/**
 * 初始化鼠标指针样式监听器
 * 当hover到实体时，将鼠标指针改为pointer
 */
export function initCursorEventListeners(adapter: EndfieldMapAdapter) {
  const viewport = adapter.mapController.olMapRenderer.map.getViewport();

  // 监听hover_feature_change事件，根据是否有hover的feature来改变鼠标指针
  adapter.event.on(MAP_EVENT.HOVER_FEATURE_CHANGE, (event) => {
    const { newFeature } = event;

    if (newFeature) {
      // 有hover的feature时，设置为pointer
      viewport.style.cursor = 'pointer';
    } else {
      // 没有hover的feature时，恢复默认
      viewport.style.cursor = '';
    }
  });

  // 监听selection_start事件，选择模式下恢复默认指针
  adapter.event.on(MAP_EVENT.SELECTION_START, () => {
    viewport.style.cursor = '';
  });
}
