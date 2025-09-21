import { SelectEvent } from 'ol/interaction/Select';
import type { PointData } from '@/types/points';
import { xyz2crd } from '@/utils/common';
import {
  map,
  popupManager,
  setCurrentPoint,
  mapContextMenuListeners,
} from './state';
import {
  showSelectionIndicator,
  clearSelectionIndicator,
} from '../selectionIndicator';
import { toggleMultiSelect } from '../marks';
import { isMultiSelecting } from '@/data/marks';
import { isInConnectionMode, connectToPole } from '../electricPoleConnector';
import type { Coordinate } from 'ol/coordinate';
import { MapBrowserEvent } from 'ol';

/**
 * 点位选择处理函数
 */
export const pointSelectHandler = async function (event: SelectEvent) {
  const currentMap = map.value;
  if (!currentMap) return;

  const target = event.selected[0];
  if (!target) {
    // 只有当没有选中新Feature时才关闭弹窗
    popupManager.value?.closeToast();
    // 清除选中指示器
    clearSelectionIndicator();
    return;
  }

  // 处理连线模式
  if (isInConnectionMode.value) {
    // 检查是否是聚合点
    const features = target.get('features');
    let data: PointData | undefined;

    if (features && features.length === 1) {
      data = features[0].get('payload');
    } else if (!features) {
      data = target.get('payload') as PointData;
    }

    // 检查是否是电线杆范围Feature，如果是则关闭弹窗并返回
    if (data && (data as any).isRange) {
      // 关闭弹窗
      popupManager.value?.closeToast();
      // 清除选中指示器
      clearSelectionIndicator();
      return;
    }

    // 检查是否是区域文本标签Feature，如果是则不处理
    if (target.get('isTextLabel')) {
      return;
    }

    // 注意：电线杆的连接逻辑在mapClickHandler中处理，这里不再重复调用
    // 这样避免了在连线模式下重复调用connectToPole导致的弹窗闪烁问题
    // 在连线模式下，无论是否成功连接，都不允许展开弹窗
    return;
  }

  // 检查是否是聚合点
  const features = target.get('features');
  if (features && features.length > 1) {
    // 聚合点点击处理
    // 如果有弹窗正在显示，先关闭它
    if (popupManager.value?.isPopupVisible.value) {
      await popupManager.value.closeToast();
    }

    const extent = target.getGeometry()?.getExtent();
    if (extent && currentMap) {
      // 放大到聚合范围
      currentMap.getView().fit(extent, {
        duration: 500,
        padding: [50, 50, 50, 50],
        maxZoom: 5,
      });
    }
    return;
  }

  // 获取单个点的数据
  let data = target.get('payload') as PointData | undefined;
  // 如果是聚合中的单个点，需要从features中获取
  if (features && features.length === 1) {
    data = features[0].get('payload');
  }

  // 检查是否是电线杆范围Feature，如果是则关闭弹窗并返回
  if (data && (data as any).isRange) {
    // 关闭弹窗
    popupManager.value?.closeToast();
    // 清除选中指示器
    clearSelectionIndicator();
    return;
  }

  // 检查是否是区域文本标签Feature，如果是则不处理
  if (target.get('isTextLabel')) {
    return;
  }

  if (!data) {
    return;
  }

  // 如果弹窗管理器不存在，提前返回
  if (!popupManager.value) {
    return;
  }

  const targetFeaturePosition = xyz2crd(data.position);
  const newPosition = targetFeaturePosition;
  const currentPosition = popupManager.value.getCurrentPosition();
  const positionChanged =
    !currentPosition ||
    newPosition[0] !== currentPosition[0] ||
    newPosition[1] !== currentPosition[1];

  // --- 添加日志 ---
  console.log('[pointSelectHandler] Point data found:', JSON.stringify(data));
  console.log(
    '[pointSelectHandler] Calling showSelectionIndicator with ID:',
    data.levelLogicId
  );
  // ---------------

  // 显示选择指示器
  if (data.levelLogicId) {
    showSelectionIndicator(
      data.levelLogicId.toString(),
      'rgba(253, 251, 84, 0.8)'
    );
  }

  // 设置点位数据，减少对point.value的重复赋值
  setCurrentPoint(data);

  // 如果位置改变或弹出框当前不可见
  if (positionChanged || !popupManager.value.isPopupVisible.value) {
    if (popupManager.value.isPopupVisible.value) {
      // 如果弹窗已经显示，先关闭弹窗
      await popupManager.value.closeToast();
      // 重新显示指示器
      if (data.levelLogicId) {
        showSelectionIndicator(
          data.levelLogicId.toString(),
          'rgba(253, 251, 84, 0.8)'
        );
      }
      // 设置新位置并打开弹窗
      popupManager.value.setCurrentPosition([...newPosition]);
      popupManager.value.openToast();
    } else {
      // 首次显示弹窗
      popupManager.value.toggleVideoInfo(false);
      popupManager.value.setCurrentPosition([...newPosition]);
      popupManager.value.openToast();
    }
  }
};

/**
 * 添加右键菜单监听器
 */
export const addMapContextMenuListener = (
  listener: (
    event: MouseEvent,
    coordinate?: Coordinate,
    pointData?: PointData,
    lineGroupId?: string
  ) => void
) => {
  if (mapContextMenuListeners.has(listener)) {
    console.warn('该右键菜单监听器已存在');
    return;
  }
  mapContextMenuListeners.add(listener);
};

/**
 * 移除右键菜单监听器
 */
export const removeMapContextMenuListener = (
  listener: (
    event: MouseEvent,
    coordinate?: Coordinate,
    pointData?: PointData,
    lineGroupId?: string
  ) => void
) => {
  if (!mapContextMenuListeners.has(listener)) {
    console.warn('该右键菜单监听器不存在');
    return;
  }
  mapContextMenuListeners.delete(listener);
};

/**
 * 地图点击处理
 */
export function mapClickHandler(event: MapBrowserEvent<MouseEvent>) {
  // 使用 any 避免 MapBrowserEvent 导入
  // 首先检查是否有Feature被点击
  const feature = map.value?.forEachFeatureAtPixel(
    event.pixel,
    feature => feature
  );

  // 如果没有Feature被点击，并且弹窗正在显示，则关闭弹窗
  if (!feature && popupManager.value) {
    popupManager.value.closeToast();
  }

  // 如果有并且有Feature被点击，则关闭弹窗 (多选模式或连线模式下)
  if (feature && (isMultiSelecting.value || isInConnectionMode.value)) {
    popupManager.value?.closeToast();

    // 检查是否是聚合点
    const features = feature.get('features');
    let payload: PointData | undefined;

    if (features && features.length === 1) {
      payload = features[0].get('payload') as PointData;
    } else if (features && features.length > 1) {
      // 如果是聚合点, 展开视图
      const extent = feature.getGeometry()?.getExtent();
      if (extent) {
        map.value?.getView().fit(extent, {
          duration: 500,
          padding: [50, 50, 50, 50],
          maxZoom: 5,
        });
      }
    } else {
      // 如果不是聚合点，直接获取payload
      payload = feature.get('payload') as PointData;
    }

    // 检查是否是电线杆范围Feature，如果是则关闭弹窗并返回
    if (payload && (payload as any).isRange) {
      // 关闭弹窗
      popupManager.value?.closeToast();
      // 清除选中指示器
      clearSelectionIndicator();
      return;
    }

    // 检查是否是区域文本标签Feature，如果是则不处理
    if (feature.get('isTextLabel')) {
      return;
    }

    // 在连线模式下，只处理电线杆连接，不进行多选操作
    if (isInConnectionMode.value) {
      if (payload && payload.entityDataIdKey === 'electric_pole') {
        connectToPole(payload, true).then(result => {
          if (result.success) {
            // 连接成功，不需要额外操作，连线模式会自动处理
          }
        });
      }
      return;
    }

    // 多选模式下的处理
    if (isMultiSelecting.value && payload?.levelLogicId) {
      toggleMultiSelect(payload.levelLogicId as number);
    }
  }
}

export function pointerMoveHandler(event: MapBrowserEvent<PointerEvent>) {
  // 如果鼠标移动的点不是实体点，则不进行任何操作
  const feature = map.value?.forEachFeatureAtPixel(
    event.pixel,
    feature => feature
  );
  if (!feature) return;
  const features = feature.get('features');
  if (features && features.length > 1) {
    console.log('聚合点');
  } else if (features && features.length === 1) {
    console.log('单个点');
  }
}
