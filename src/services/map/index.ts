/**
 * 地图核心服务主入口
 * @module map
 */

export * from '@/services/map/constants';

// 重新导出状态变量 (只读)
export {
  map,
  renderOptimizer,
  popupManager,
  cacheMapId,
  zoomLevel,
  point,
  overlay,
  selectInteraction,
  mapZooming,
} from '@/services/map/state';

// 重新导出核心功能
export {
  createMap,
  updateMap,
  selectMap,
  moveToCenter,
  cleanupMap,
} from '@/services/map/core';

// 重新导出交互相关功能
export {
  pointSelectHandler,
  addMapContextMenuListener,
  removeMapContextMenuListener,
  mapClickHandler,
} from '@/services/map/interactions';

// 重新导出弹窗相关功能
export { initPopupManager, closePopup } from '@/services/map/popup';

// 重新导出工具函数
export { getZoom, getCurrentMapId } from '@/services/map/utils';

// 导出事件处理函数（如果外部需要显式调用）
export {
  handleZoomChange,
  moveEndChange,
  handleSettingsChange,
  windowResizeHandler,
  handleContextMenu,
} from '@/services/map/events';

// 导出投影和瓦片加载（如果需要）
export { simpleProjection, tileLoad } from '@/services/map/projection';

// 导出视图状态管理 （如果需要）
export { saveMapViewState, restoreMapViewState } from '@/services/map/viewState';
