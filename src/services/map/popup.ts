import { Map } from 'ol';
import { PopupManager } from '../PopupManager';
import {
  map,
  overlay as overlayInstance,
  point,
  selectInteraction,
  popupManager as popupManagerState,
  setPopupManager,
  setCurrentPoint,
  setMapZooming,
} from './state';
import { clearSelectionIndicator } from '../selectionIndicator';

/**
 * 初始化弹窗管理器
 */
export function initPopupManager(
  popupElement?: HTMLElement
): PopupManager | null {
  if (!map.value || !overlayInstance) return null;

  // 确保弹窗元素存在
  if (!popupElement) {
    console.error('弹出层容器未找到 - 请检查DOM和CSS');
    return null;
  }
  // 创建弹出层管理器
  const manager = new PopupManager(
    map.value as Map,
    overlayInstance,
    popupElement,
    point
  );

  // 设置全局引用
  setPopupManager(manager);
  // 当弹出框关闭时，清除选择状态和指示器
  manager.addVisibilityChangeListener(newValue => {
    if (!newValue && selectInteraction) {
      selectInteraction.getFeatures().clear();
      clearSelectionIndicator(); // 清除选中标点的四个角落线条
    }
  });

  return manager;
}

/**
 * 关闭当前弹窗
 */
export function closePopup(): void {
  const manager = popupManagerState.value; // 从 state 获取
  if (manager) {
    manager.closeToast();
    manager.toggleVideoInfo(false);
    manager.closeSub();
    manager.setCurrentPosition(undefined);
    setMapZooming(false); // 使用 state 中的 setter
    setCurrentPoint(null); // 使用 state 中的 setter
  }
}
