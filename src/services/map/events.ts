import { debounce } from '@/utils/common';
import { loadTextPoints } from '@/data/locations';
import { refreshMap, updateClusterDistance } from '../render';
import {
  map,
  popupManager,
  zoomLevel,
  mapContextMenuListeners,
  setCurrentZoomLevel,
  setMapZooming,
} from './state';
import { saveMapViewState } from './viewState';
import { getCurrentMapId, getZoom } from './utils';
import { pubsub, EVENTS } from '../pubsub';
import type { PointData } from '@/types/points';

/**
 * 地图缩放事件处理
 */
const handleZoomChangeInternal = debounce(function () {
  const currentMap = map.value;
  if (!currentMap) return;

  // 标记地图正在缩放中
  if (popupManager.value) {
    setMapZooming(true); // 使用 state 中的 setter
  }

  const zoom = getZoom();
  const currentMapID = getCurrentMapId();
  // 使用转换后的场景 ID
  loadTextPoints(true, currentMapID === 'map002' ? 'map02' : 'map01', zoom);

  setCurrentZoomLevel(zoom); // 使用 state 中的 setter

  updateClusterDistance(zoom);

  // 如果弹窗是打开的，则在缩放时重新定位弹窗
  if (popupManager.value && popupManager.value.isPopupVisible.value) {
    // 使用 requestAnimationFrame 确保在下一帧调整位置
    requestAnimationFrame(() => {
      popupManager.value?.repositionPopup();
    });
  }

  refreshMap();
}, 500);

/**
 * 地图移动结束事件处理
 */
const moveEndChangeInternal = debounce(() => {
  const currentMap = map.value;
  if (!currentMap) return;

  const zoom = getZoom();
  const position = currentMap.getView().getCenter();
  const currentMapID = getCurrentMapId();

  // 确保最终值是准确的
  if (Math.abs(zoomLevel.value - zoom) >= 0.01) {
    loadTextPoints(false, currentMapID === 'map002' ? 'map02' : 'map01', zoom);
    setCurrentZoomLevel(zoom); // 使用 state 中的 setter
  }
  // 保存当前视图状态到 IndexedDB (永久存储)
  if (position && currentMapID) {
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `地图移动/缩放结束，正在保存视图状态，地图ID: ${currentMapID}, 中心点: [${position[0]}, ${position[1]}], 缩放级别: ${zoom}`
      );
    }
    saveMapViewState(currentMapID).catch(error => {
      console.error('保存视图状态时出错:', error);
    });
  } else {
    console.warn('无法保存视图状态，缺少必要参数:', {
      position: position ? '存在' : '不存在',
      cacheMapId: currentMapID,
    });
  }

  // 在移动或缩放结束后，重置缩放状态标志
  if (popupManager.value) {
    if (process.env.NODE_ENV === 'development') {
      console.log('重置缩放状态标志');
    }
    setMapZooming(false); // 使用 state 中的 setter
  }
}, 200);

/**
 * 设置更改事件处理
 */
const handleSettingsChangeInternal = debounce(() => {
  const zoom = getZoom();
  updateClusterDistance(zoom);
}, 200);

/**
 * 窗口大小调整事件处理
 */
const windowResizeHandlerInternal = debounce(() => {
  if (popupManager.value && popupManager.value.getCurrentPosition()) {
    popupManager.value?.adjustPopupPosition();
  }
}, 200);

/**
 * 地图右键菜单事件处理
 */
const handleContextMenuInternal = (event: MouseEvent) => {
  event.preventDefault();
  const coordinate = map.value?.getEventCoordinate(event);
  // 获取右键点击的点位数据
  const feature = map.value?.forEachFeatureAtPixel(
    map.value.getEventPixel(event),
    feature => feature
  );
  let pointData: PointData | undefined;
  if (feature) {
    // 检查是否是聚合点
    const features = feature.get('features');
    if (features && features.length > 0) {
      // 从聚合中获取第一个点的数据
      pointData = features[0].get('payload');
    } else {
      // 非聚合点，直接获取payload
      pointData = feature.get('payload') as PointData;
    }
  }
  if (process.env.NODE_ENV === 'development') {
    console.log('右键菜单事件:', {
      coordinate: coordinate,
      pointData: pointData,
    });
  }
  mapContextMenuListeners.forEach(listener => {
    if (coordinate) {
      listener(event, coordinate, pointData);
    }
  });
};

/**
 * 注册地图事件监听器
 */
export function registerMapEventListeners(): void {
  if (!map.value) return;
  map.value.getView().on('change:resolution', handleZoomChangeInternal);
  map.value.on('moveend', moveEndChangeInternal);
  map.value
    .getViewport()
    .addEventListener('contextmenu', handleContextMenuInternal);
  window.addEventListener('resize', windowResizeHandlerInternal);

  // PubSub 订阅
  pubsub.subscribe(EVENTS.MARK_CHANGE, refreshMap);
  pubsub.subscribe(EVENTS.SELECT_CHANGE, refreshMap);
  pubsub.subscribe(EVENTS.SETTINGS_CHANGE, handleSettingsChangeInternal);
  pubsub.subscribe(EVENTS.MULTI_SELECT_STATE_CHANGE, refreshMap);
  pubsub.subscribe(EVENTS.MULTI_SELECT_CHANGE, refreshMap);
}

/**
 * 注销地图事件监听器
 */
export function unregisterMapEventListeners(): void {
  if (!map.value) return;
  try {
    map.value.getView().un('change:resolution', handleZoomChangeInternal);
    map.value.un('moveend', moveEndChangeInternal);
    map.value
      .getViewport()
      .removeEventListener('contextmenu', handleContextMenuInternal);
  } catch (error) {
    console.warn('移除地图视口监听器时出错，可能已被移除: ', error);
  }
  window.removeEventListener('resize', windowResizeHandlerInternal);

  // PubSub 取消订阅
  pubsub.unsubscribe(EVENTS.MARK_CHANGE, refreshMap);
  pubsub.unsubscribe(EVENTS.SELECT_CHANGE, refreshMap);
  pubsub.unsubscribe(EVENTS.SETTINGS_CHANGE, handleSettingsChangeInternal);
  pubsub.unsubscribe(EVENTS.MULTI_SELECT_STATE_CHANGE, refreshMap);
  pubsub.unsubscribe(EVENTS.MULTI_SELECT_CHANGE, refreshMap);
}

// 导出内部处理函数，以便在 core.ts 中可以显式调用（如果需要）
export {
  handleZoomChangeInternal as handleZoomChange,
  moveEndChangeInternal as moveEndChange,
  handleSettingsChangeInternal as handleSettingsChange,
  windowResizeHandlerInternal as windowResizeHandler,
  handleContextMenuInternal as handleContextMenu,
};
