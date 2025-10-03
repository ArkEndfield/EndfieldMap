import { debounce } from '@/utils/common';
import { loadTextPoints } from '@/data/locations';
import { refreshMap, updateClusterDistance } from '@/services/render';
import {
  map,
  popupManager,
  zoomLevel,
  mapContextMenuListeners,
  setCurrentZoomLevel,
  setMapZooming,
} from '@/services/map/state';
import { saveMapViewState } from '@/services/map/viewState';
import { getCurrentMapId, getZoom } from '@/services/map/utils';
import { pubsub, EVENTS } from '@/services/pubsub';
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
  if (popupManager.value && popupManager.value.state.isPopupVisible) {
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
    setMapZooming(false);
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
  let coordinate = map.value?.getEventCoordinate(event);

  // 获取右键点击的特征
  if (!map.value) return;

  const pixel = map.value.getEventPixel(event);

  let pointData: PointData | undefined;
  let lineGroupId: string | undefined;
  let hasTextLabel = false;

  // 同时检测连线和标点特征
  map.value.forEachFeatureAtPixel(pixel, (feature) => {
    // 检查是否是文本标签
    if (feature.get('isTextLabel')) {
      hasTextLabel = true;
      return true;
    }

    const featureType = feature.get('featureType');

    // 如果是连线，记录连线ID
    if (featureType === 'line') {
      lineGroupId = feature.get('lineGroupId');
    }

    // 如果是标点或聚合点，记录标点数据
    if (!pointData) {
      const features = feature.get('features');
      if (features && features.length > 0) {
        // 从聚合中获取第一个点的数据
        const featurePointData = features[0].get('payload') as PointData;
        if (featurePointData && !(featurePointData as any).isRange) {
          pointData = featurePointData;
        }
      } else {
        // 非聚合点，直接获取payload
        const featurePointData = feature.get('payload') as PointData;
        if (featurePointData && !(featurePointData as any).isRange) {
          pointData = featurePointData;
        }
      }
    }

    // 如果同时找到了连线和标点，或者找到了文本标签，就停止遍历
    if ((lineGroupId && pointData) || hasTextLabel) {
      return true;
    }
  }, {
    hitTolerance: 10 // 扩大点击容差到10像素
  });

  // 如果点击的是文本标签，不处理
  // if (hasTextLabel) {
  //   return;
  // }

  if (process.env.NODE_ENV === 'development') {
    console.log('右键菜单事件:', {
      coordinate: coordinate,
      pointData: pointData,
      lineGroupId: lineGroupId,
    });
  }

  mapContextMenuListeners.forEach(listener => {
    if (coordinate) {
      listener(event, coordinate, pointData, lineGroupId);
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
