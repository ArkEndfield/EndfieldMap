import { Map, MapBrowserEvent, View } from 'ol';
import { Tile as TileLayer } from 'ol/layer';
import { XYZ } from 'ol/source';
import { Projection } from 'ol/proj';
import { defaults as interactionDefaults } from 'ol/interaction';
import Control from 'ol/control/Control';
import { areaNameLayer, loadTextPoints } from '@/data/locations';
import {
  entityClusterLayers,
  refresh,
  updateClusterDistance,
} from '@/services/render';
import { ref, shallowRef } from 'vue';
import { Layer } from 'ol/layer';
import VectorSource from 'ol/source/Vector';
import Cluster from 'ol/source/Cluster';
import Overlay from 'ol/Overlay';
import { Select } from 'ol/interaction';
import { click } from 'ol/events/condition';
import { PopupManager } from './PopupManager';
import { type PointData } from '@/types/points';
import { debounce, xyz2crd } from '@/utils/common';
import { SelectEvent } from 'ol/interaction/Select';
import { getItem, setItem, StorageType } from '@/utils/indexedDBStorage';
import { cancelRafTimeout, rafTimeout } from '@/utils/animationTimer';
import { RenderOptimizer } from '@/utils/renderOptimizer';
import { LOCAL_STORAGE_KEY } from '@/constants/db_key';

// 地图视图状态存储键前缀
const MAP_VIEW_STATE_KEY_PREFIX = 'mapViewState_';
// 默认地图中心点
const DEFAULT_MAP_CENTERS = {
  map001: [100, 152],
  map002: [50, 188],
};
// 默认缩放级别
const DEFAULT_ZOOM = 3;

// 地图视图状态接口
interface MapViewState {
  center: number[];
  zoom: number;
  timestamp: number;
}

/**
 * 保存地图视图状态到IndexedDB
 * @param mapId 地图ID
 */
async function saveMapViewState(mapId: string): Promise<void> {
  if (!map.value) return;

  const view = map.value.getView();
  const center = view.getCenter();
  const zoom = view.getZoom();

  if (!center || zoom === undefined) return;

  // 确保中心点坐标是简单数组，不是 OpenLayers 内部对象
  const viewState: MapViewState = {
    center: [center[0], center[1]], // 创建新数组，确保是简单的数字数组
    zoom: zoom,
    timestamp: Date.now(),
  };

  try {
    const key = `${MAP_VIEW_STATE_KEY_PREFIX}${mapId}`;
    await setItem(key, viewState, StorageType.PERMANENT, null);
    console.log(`已保存地图 ${mapId} 的视图状态:`, viewState);
  } catch (error) {
    console.error(`保存地图 ${mapId} 视图状态失败:`, error);
  }
}

/**
 * 从IndexedDB恢复地图视图状态
 * @param mapId 地图ID
 */
async function restoreMapViewState(
  mapId: string
): Promise<MapViewState | null> {
  // 移除对 map.value 的依赖检查，让函数在地图初始化之前也能工作
  try {
    const key = `${MAP_VIEW_STATE_KEY_PREFIX}${mapId}`;
    const viewState = await getItem<MapViewState>(key, StorageType.PERMANENT);

    if (viewState) {
      console.log(`已恢复地图 ${mapId} 的视图状态:`, viewState);
      return viewState;
    } else {
      console.log(`未找到地图 ${mapId} 的视图状态，将使用默认位置`);
    }
  } catch (error) {
    console.error(`恢复地图 ${mapId} 视图状态失败:`, error);
  }

  return null;
}

// 创建简单投影
export const simpleProjection = new Projection({
  code: 'SIMPLE',
  units: 'pixels',
  extent: [0, 0, 256, 256],
});

// 透明图像，用于无法加载的瓦片
export const transparentBase64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/2+L6n0AAAAASUVORK5CYII=';

// 跟踪实体图层加载状态
const entityLayersLoaded = ref(false);
// 用于取消延迟加载的计时器ID
let entityLayerTimerId: number | null = null;
// 最大重试次数
const MAX_RETRIES = 5;

// 瓦片加载函数
export const tileLoad = (imageTile: any, src: string) => {
  const img = new Image();
  img.onload = () => {
    imageTile.getImage().src = src;
  };
  img.onerror = () => {
    imageTile.getImage().src = transparentBase64;
  };
  img.src = src;
};

// 创建地图控制实例
export function createZoomControl(controlsElement: HTMLElement) {
  return new Control({
    element: controlsElement,
  });
}

const MAP_ID_KEY = LOCAL_STORAGE_KEY.MAP;
const ZOOM_KEY = LOCAL_STORAGE_KEY.ZOOM;
// 创建并返回地图实例
export const map = shallowRef<Map | null>(null);
export const renderOptimizer = shallowRef<RenderOptimizer | null>(null);
export const cacheMapId = ref<string>(
  localStorage.getItem(MAP_ID_KEY) || 'map001'
);
export const zoomLevel = ref(Number(localStorage.getItem(ZOOM_KEY)));

// 弹出层相关状态
export const entity = ref<PointData | null>(null);

// 全局变量
let overlay: Overlay;
let selectInteraction: Select = new Select({
  condition: click,
  style: null,
  layers: () => true,
});

export const popupManager = shallowRef<PopupManager | null>(null);

// 类型保护函数
function isVectorSource(source: any): source is VectorSource {
  return source && 'clear' in source;
}

function isClusterSource(source: any): source is Cluster {
  return source && 'getSource' in source;
}

/**
 * 添加实体图层到地图，支持重试逻辑
 * @param currentRetry 当前重试次数
 */
function addEntityLayersToMap(currentRetry = 0) {
  // 清除之前的计时器
  if (entityLayerTimerId !== null) {
    cancelRafTimeout(entityLayerTimerId);
    entityLayerTimerId = null;
  }

  if (!map.value) {
    console.warn('地图实例不存在，无法添加实体图层');
    return;
  }

  if (entityClusterLayers.length > 0) {
    console.log(`添加 ${entityClusterLayers.length} 个实体图层到地图`);

    // 重要：确保图层添加过程不会导致闪烁
    requestAnimationFrame(() => {
      // 首先预先设置所有图层为不可见
      entityClusterLayers.forEach(layer => {
        layer.setVisible(false);
      });

      // 添加所有图层（不可见状态）
      entityClusterLayers.forEach(layer => {
        map.value?.addLayer(layer);
      });

      // 记录加载成功
      entityLayersLoaded.value = true;
      console.log('实体图层加载成功');
    });

    return;
  }

  // 如果还没有实体图层数据，但未超过最大重试次数，则继续尝试
  if (currentRetry < MAX_RETRIES) {
    console.log(
      `实体图层数据尚未准备好，${currentRetry + 1}/${MAX_RETRIES} 次重试中...`
    );

    // 递增重试间隔（指数退避）
    const delay = Math.min(500 * Math.pow(1.5, currentRetry), 5000);

    entityLayerTimerId = rafTimeout(() => {
      addEntityLayersToMap(currentRetry + 1);
    }, delay);
  } else {
    console.warn('达到最大重试次数，实体图层加载失败');
  }
}

// 更新地图视图和图层
export async function updateMap(mapIndex: string) {
  if (!map.value) return;

  // 重置实体图层加载状态
  entityLayersLoaded.value = false;

  // 从IndexedDB恢复地图视图状态
  const restoredViewState = await restoreMapViewState(mapIndex);

  // 创建新的瓦片图层
  const tileLayer = new TileLayer({
    source: new XYZ({
      projection: simpleProjection,
      url: `/map/${mapIndex}/{z}/{y}/{x}.png`,
      tileLoadFunction: tileLoad,
    }),
  });

  // 移除所有现有图层
  map.value.getLayers().clear();

  // 重新添加基础图层
  map.value.addLayer(tileLayer);
  map.value.addLayer(areaNameLayer);

  // 使用改进的方法添加实体图层
  addEntityLayersToMap();

  // 更新视图中心点和缩放级别
  const view = map.value.getView();
  if (
    restoredViewState &&
    restoredViewState.center &&
    restoredViewState.zoom !== undefined
  ) {
    console.log(
      `正在应用已恢复的视图状态，中心点: [${restoredViewState.center[0]}, ${restoredViewState.center[1]}], 缩放级别: ${restoredViewState.zoom}`
    );
    view.setCenter(restoredViewState.center);
    view.setZoom(restoredViewState.zoom);
  } else {
    const defaultCenter =
      DEFAULT_MAP_CENTERS[mapIndex] || DEFAULT_MAP_CENTERS['map001'];
    console.log(
      `使用默认视图设置，中心点: [${defaultCenter[0]}, ${defaultCenter[1]}], 缩放级别: ${DEFAULT_ZOOM}`
    );
    view.setCenter(defaultCenter);
    view.setZoom(DEFAULT_ZOOM);
  }

  rafTimeout(refresh, 300);

  // 更新地图ID
  cacheMapId.value = mapIndex;
  localStorage.setItem(MAP_ID_KEY, mapIndex);
  console.log(`已更新地图到 ${mapIndex}`);
}

// 获取当前地图的ID
export function getCurrentMapId(): string {
  return cacheMapId.value;
}

// 清理地图资源的函数
export function cleanupMap() {
  if (!map.value) return;

  // 清理渲染优化器
  if (renderOptimizer.value) {
    renderOptimizer.value.dispose();
    renderOptimizer.value = null;
  }

  // 清除实体图层的加载计时器
  if (entityLayerTimerId !== null) {
    cancelRafTimeout(entityLayerTimerId);
    entityLayerTimerId = null;
  }

  // 清理弹窗管理器
  if (popupManager.value) {
    popupManager.value = null;
  }

  // 清理地图交互
  const interactions = map.value.getInteractions().getArray();
  interactions.forEach(interaction => {
    map.value?.removeInteraction(interaction);
  });

  // 清理地图控件
  const controls = map.value.getControls().getArray();
  controls.forEach(control => {
    map.value?.removeControl(control);
  });

  // 清理地图叠加层
  const overlays = map.value.getOverlays().getArray();
  overlays.forEach(overlay => {
    map.value?.removeOverlay(overlay);
  });

  // 清理地图图层
  const layers = map.value.getLayers().getArray();
  layers.forEach(layer => {
    // 检查图层是否有 getSource 方法
    if ('getSource' in layer) {
      const source = (layer as Layer).getSource();
      if (source) {
        // 如果是矢量源，清理特征
        if (isVectorSource(source)) {
          source.clear();
        }
        // 如果是聚合源，清理内部源
        if (isClusterSource(source)) {
          const innerSource = source.getSource();
          if (isVectorSource(innerSource)) {
            innerSource.clear();
          }
        }
        // 移除源的引用
        (layer as Layer).setSource(null);
      }
    }
    map.value?.removeLayer(layer);
  });

  // 清除事件监听器
  window.removeEventListener('resize', windowResizeHandler);
  map.value.un('click', mapClickHandler);
  map.value.un('moveend', moveEndChange);
  map.value.getView().un('change:resolution', handleZoomChange);
  // 清除选择交互
  if (selectInteraction) {
    selectInteraction.un('select', pointSelectHandler);
    selectInteraction.getFeatures().clear();
    map.value.removeInteraction(selectInteraction);
  }

  // 分离目标元素
  map.value.setTarget(undefined);
  map.value = null;
  // 重置状态
  entityLayersLoaded.value = false;
}

// 初始化弹窗管理器
export function initPopupManager(popupElement?: HTMLElement) {
  if (!map.value || !overlay) return null;

  // 确保弹窗元素存在
  if (!popupElement) {
    console.error('弹出层容器未找到 - 请检查DOM和CSS');
    return null;
  }
  // 创建弹出层管理器
  const manager = new PopupManager(
    map.value as Map,
    overlay,
    popupElement,
    entity
  );

  // 设置全局引用
  popupManager.value = manager;
  // 当弹出框关闭时，清除选择状态
  manager.addVisibilityChangeListener(newValue => {
    if (!newValue && selectInteraction) {
      selectInteraction.getFeatures().clear();
    }
  });

  return manager;
}

const windowResizeHandler = debounce(() => {
  if (popupManager.value && popupManager.value.getCurrentPosition()) {
    popupManager.value?.adjustPopupPosition();
  }
}, 200);

export async function createMap(
  mapIndex: string,
  controlsElement: HTMLElement,
  overlayElement?: HTMLElement
) {
  const zoomControl = createZoomControl(controlsElement);

  // 保存全局overlay引用
  overlay = new Overlay({
    element: overlayElement,
    autoPan: false,
    offset: [0, 10],
    positioning: 'bottom-center',
  });

  console.log('正在创建地图，正在从IndexedDB恢复视图状态...');
  // 从IndexedDB恢复地图视图状态
  const restoredViewState = await restoreMapViewState(mapIndex);

  // 根据恢复的状态或默认值确定初始中心点和缩放级别
  const initialCenter =
    restoredViewState?.center ||
    (mapIndex === 'map001' ? [100, 152] : [50, 188]);
  const initialZoom =
    restoredViewState?.zoom ||
    Number(localStorage.getItem(ZOOM_KEY)) ||
    DEFAULT_ZOOM;

  console.log(
    `地图初始化参数: 中心点=[${initialCenter}], 缩放级别=${initialZoom}`
  );

  // 基础图层 - 只包含底图和地名标注
  const baseLayers = [
    new TileLayer({
      source: new XYZ({
        projection: simpleProjection,
        url: `/map/${mapIndex}/{z}/{y}/{x}.png`,
        tileLoadFunction: tileLoad,
      }),
    }),
    areaNameLayer,
  ];

  map.value = new Map({
    target: 'map',
    layers: baseLayers, // 仅使用基础图层，实体图层将在加载完成后单独添加
    view: new View({
      projection: simpleProjection,
      center: initialCenter,
      zoom: initialZoom,
      maxZoom: 5,
      minZoom: 1,
      rotation: 0,
      enableRotation: false,
    }),
    interactions: interactionDefaults({
      altShiftDragRotate: false,
      pinchRotate: false,
    }),
    overlays: [overlay],
    controls: [zoomControl],
    pixelRatio: 2, // 提高像素比以提升移动中的渲染质量
  });

  // 初始化渲染优化器
  if (map.value) {
    renderOptimizer.value = new RenderOptimizer(map.value);
    console.log('渲染优化器已初始化');
  }

  // 使用改进的方法添加实体图层
  addEntityLayersToMap();

  // 监听地图渲染完成事件，如果实体图层还没加载成功，再次尝试
  map.value.once('rendercomplete', () => {
    if (!entityLayersLoaded.value) {
      console.log('地图渲染完成但实体图层未加载，重新尝试添加');
      addEntityLayersToMap();
    }
  });

  initPopupManager(overlayElement);

  // 添加选择交互
  // 添加选择交互
  map.value.addInteraction(selectInteraction);
  // 修改选择交互部分的代码，先关闭弹窗，再放大聚合点
  selectInteraction.on('select', pointSelectHandler);

  // 设置地图缩放事件监听
  map.value.getView().on('change:resolution', handleZoomChange);

  // 监听地图移动结束事件，确保最终值是准确的
  map.value.on('moveend', moveEndChange);

  // 设置地图点击事件处理
  map.value.on('click', mapClickHandler);

  // 设置窗口大小变化监听器
  window.addEventListener('resize', windowResizeHandler);
}

const pointSelectHandler = async function (event: SelectEvent) {
  const currentMap = map.value;
  if (!currentMap) return;

  const target = event.selected[0];
  if (target) {
    console.log('选中目标:', target);
    // 检查是否是聚合点
    const features = target.get('features');
    if (features && features.length > 1) {
      console.log('选中了聚合点, 包含特征数量:', features.length);
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

    if (!data) {
      console.warn('未找到点位数据');
      return;
    }

    const targetFeaturePosition = xyz2crd(data.position);

    const newPosition = targetFeaturePosition;
    const currentPosition = popupManager.value?.getCurrentPosition();
    const positionChanged =
      !currentPosition ||
      newPosition[0] !== currentPosition[0] ||
      newPosition[1] !== currentPosition[1];

    if (!popupManager.value) {
      console.error('弹窗管理器不存在');
      return;
    }

    console.log('弹窗管理器状态:', {
      isPopupVisible: popupManager.value.isPopupVisible.value,
      currentPosition: currentPosition,
      newPosition: newPosition,
      positionChanged: positionChanged,
    });

    // 如果位置改变或弹出框当前不可见
    if (positionChanged || !popupManager.value?.isPopupVisible.value) {
      if (popupManager.value.isPopupVisible.value) {
        console.log('重新打开弹窗 - 位置已改变');
        // 如果弹窗已经显示，使用PopupManager处理关闭和重新打开
        await popupManager.value.closeAndReopenPopup(data, newPosition);
      } else {
        console.log('首次打开弹窗');
        // 首次显示弹窗
        entity.value = data;
        popupManager.value.toggleVideoInfo(false);
        popupManager.value.setCurrentPosition([...newPosition]);
        popupManager.value.openToast();
      }
    } else {
      console.log('更新弹窗内容 - 相同位置');
      // 如果是同一位置的点击，只更新弹窗内容，不关闭再打开
      entity.value = data;
    }
  } else {
    console.log('未选中目标，关闭弹窗');
    // 只有当没有选中新Feature时才关闭弹窗
    popupManager.value?.closeToast();
  }
};

const handleZoomChange = function () {
  const currentMap = map.value;
  if (!currentMap) return;

  // 标记地图正在缩放中
  if (popupManager.value) {
    popupManager.value.setMapZooming(true);
  }

  const zoom = currentMap.getView().getZoom() || 0;
  const currentMapID = getCurrentMapId();
  loadTextPoints(true, currentMapID);

  updateZoomValue(zoom);

  updateClusterDistance(zoomLevel.value);

  // 如果弹窗是打开的，则在缩放时重新定位弹窗
  if (popupManager.value && popupManager.value.isPopupVisible.value) {
    popupManager.value.repositionPopup();
  }
};

export const updateZoomValue = (zoom: number) => {
  zoomLevel.value = zoom;
  localStorage.setItem(ZOOM_KEY, zoom.toString());
};

const moveEndChange = debounce(
  () => {
    const currentMap = map.value;
    if (!currentMap) return;

    const zoom = currentMap.getView().getZoom() || 0;
    // 四舍五入到最接近的0.5，保持与handleZoomChange相同的舍入策略
    const position = currentMap.getView().getCenter();
    // 确保最终值是准确的
    if (Math.abs(zoomLevel.value - zoom) >= 0.01) {
      const currentMapID = getCurrentMapId();
      loadTextPoints(true, currentMapID);
      updateZoomValue(zoom);
    }
    const currentMapID = getCurrentMapId();
    // 保存当前视图状态到 IndexedDB (永久存储)
    if (position && currentMapID) {
      console.log(
        `地图移动/缩放结束，正在保存视图状态，地图ID: ${currentMapID}, 中心点: [${position[0]}, ${position[1]}], 缩放级别: ${zoom}`
      );
      saveMapViewState(currentMapID).catch(error => {
        console.error('保存视图状态时出错:', error);
      });
    } else {
      console.warn('无法保存视图状态，缺少必要参数:', {
        position: position ? '存在' : '不存在',
        cacheMapId: currentMapID,
      });
    }

    // 重要：在移动或缩放结束后，重置缩放状态标志
    if (popupManager.value) {
      popupManager.value.setMapZooming(false);
    }
  },
  250,
  { leading: false, trailing: true }
);

function mapClickHandler(event: MapBrowserEvent<any>) {
  // 首先检查是否有Feature被点击
  const feature = map.value?.forEachFeatureAtPixel(
    event.pixel,
    feature => feature
  );

  // 如果没有Feature被点击，并且弹窗正在显示，则关闭弹窗
  if (!feature && popupManager.value) {
    popupManager.value.closeToast();
  }
}

// 选择地图
export const selectMap = (id: string) => {
  console.log('选择地图', id);
  if (getCurrentMapId() === id) return;

  // 关闭可能打开的弹窗
  if (popupManager.value) {
    popupManager.value.closeToast();
    // 重置弹窗状态
    popupManager.value.toggleVideoInfo(false);
    popupManager.value.closeSub();
    popupManager.value.setCurrentPosition(undefined);
  }

  // 更新地图
  updateMap(id);
};
