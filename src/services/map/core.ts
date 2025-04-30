import { Map, View } from 'ol';
import { Tile as TileLayer } from 'ol/layer';
import { XYZ } from 'ol/source';
import { defaults as interactionDefaults } from 'ol/interaction';
import Overlay from 'ol/Overlay';
import { RenderOptimizer } from '@/utils/renderOptimizer';
import { loadTextPoints, areaNameLayer } from '@/data/locations';
import { initializeEntityLayers } from '../entity';
import { updatePoints, getCurrentPoints } from '../points';
import { removeAllLines, setMapForLines } from '../lineConnector';
import { setMapForIndicator } from '../selectionIndicator';
import { refreshMap, populateFeaturesFromPoints } from '../render';

import {
  map,
  renderOptimizer as renderOptimizerState,
  zoomLevel,
  selectInteraction,
  entityLayerTimerId,
  setMapInstance,
  setRenderOptimizer,
  setOverlay,
  setCurrentMapId,
  setEntityLayersLoaded,
  setEntityLayerTimerId,
  entityLayersLoaded,
} from './state';
import { restoreMapViewState, saveMapViewState } from './viewState';
import { simpleProjection, tileLoad } from './projection';
import { DEFAULT_MAP_CENTERS, DEFAULT_ZOOM } from './constants';
import { createZoomControl } from './controls';
import { pointSelectHandler, mapClickHandler } from './interactions';
import {
  registerMapEventListeners,
  unregisterMapEventListeners,
} from './events';
import { initPopupManager, closePopup as closePopupInternal } from './popup';
import {
  addEntityLayersToMap,
  isVectorSource,
  isClusterSource,
} from './layers';
import { cancelRafTimeout } from '@/utils/animationTimer';
import { getCurrentMapId } from './utils';

/**
 * 创建地图实例
 * @param mapIndex 地图索引（如 'map001'）
 * @param controlsElement 控件容器元素
 * @param overlayElement 弹出层容器元素
 */
export async function createMap(
  mapIndex: string,
  controlsElement: HTMLElement,
  overlayElement?: HTMLElement
): Promise<void> {
  const zoomControl = createZoomControl(controlsElement);

  // 创建并保存全局overlay引用
  const newOverlay = new Overlay({
    element: overlayElement,
    autoPan: false,
    offset: [0, -10],
    positioning: 'top-center',
  });
  setOverlay(newOverlay);

  if (process.env.NODE_ENV === 'development') {
    console.log('正在创建地图，正在从IndexedDB恢复视图状态...');
  }
  // 从IndexedDB恢复地图视图状态
  const restoredViewState = await restoreMapViewState(mapIndex);

  // 根据恢复的状态或默认值确定初始中心点和缩放级别
  const initialCenter =
    restoredViewState?.center ||
    DEFAULT_MAP_CENTERS[mapIndex] ||
    DEFAULT_MAP_CENTERS['map001'];
  const initialZoom = restoredViewState?.zoom || zoomLevel.value; // 使用 state 中的 zoomLevel

  if (process.env.NODE_ENV === 'development') {
    console.log(
      `地图初始化参数: 中心点=[${initialCenter}], 缩放级别=${initialZoom}`
    );
  }

  // 基础图层 - 只包含底图和地名标注
  const baseLayers = [
    new TileLayer({
      source: new XYZ({
        projection: simpleProjection,
        url: `/map/${mapIndex}/{z}/{y}/{x}.png`,
        tileLoadFunction: tileLoad,
        cacheSize: 500,
      }),
      opacity: 1,
      visible: true,
    }),
    areaNameLayer,
  ];

  const newMap = new Map({
    target: 'map',
    layers: baseLayers,
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
    overlays: [newOverlay],
    controls: [zoomControl],
    pixelRatio: 2,
  });
  setMapInstance(newMap);

  // 初始化渲染优化器
  const optimizer = new RenderOptimizer(newMap);
  setRenderOptimizer(optimizer);
  if (process.env.NODE_ENV === 'development') {
    console.log('渲染优化器已初始化');
  }

  // --- 关键修改：加载点位数据并填充渲染存储 ---
  console.time('Initial Point Load and Populate');
  try {
    await updatePoints(mapIndex); // 加载并过滤点位数据
    const initialPoints = await getCurrentPoints(); // 获取加载后的点位
    populateFeaturesFromPoints(initialPoints); // <--- 使用加载的点位填充渲染存储
    console.log(
      `Initial population complete with ${initialPoints.length} points.`
    );
  } catch (error) {
    console.error('Error during initial point load and population:', error);
  }
  console.timeEnd('Initial Point Load and Populate');
  // -------------------------------------------

  // 添加实体图层
  addEntityLayersToMap();

  // 监听地图渲染完成事件，如果实体图层还没加载成功，再次尝试
  newMap.once('rendercomplete', () => {
    if (!entityLayersLoaded.value) {
      console.log('地图渲染完成但实体图层未加载，重新尝试添加');
      addEntityLayersToMap();
    }
  });

  // 初始化弹窗管理器
  initPopupManager(overlayElement);

  // 添加交互和事件监听
  newMap.addInteraction(selectInteraction);
  selectInteraction.on('select', pointSelectHandler);
  newMap.on('click', mapClickHandler);
  registerMapEventListeners();

  // 加载初始文本点位
  loadTextPoints(true, mapIndex === 'map002' ? 'map02' : 'map01', initialZoom);

  // 设置其他服务的地图实例
  setMapForLines(newMap);
  setMapForIndicator(newMap);

  // 刷新地图以显示初始标点
  refreshMap();

  console.log('地图创建完成');
}

/**
 * 更新地图视图和图层
 * @param mapIndex 新的地图索引
 */
export async function updateMap(mapIndex: string): Promise<void> {
  if (!map.value) return;

  if (process.env.NODE_ENV === 'development') {
    console.log('更新地图', mapIndex);
  }

  // 重置实体图层加载状态
  setEntityLayersLoaded(false);

  // 从IndexedDB恢复地图视图状态
  const restoredViewState = await restoreMapViewState(mapIndex);

  // 创建新的瓦片图层
  const tileLayer = new TileLayer({
    source: new XYZ({
      projection: simpleProjection,
      url: `/map/${mapIndex}/{z}/{y}/{x}.png`,
      tileLoadFunction: tileLoad,
      cacheSize: 500,
    }),
    opacity: 1,
    visible: true,
  });

  // 移除所有现有图层前，先获取当前图层数组
  const existingLayers = map.value.getLayers().getArray().slice();

  // 清除所有图层
  map.value.getLayers().clear();

  // 重新添加基础图层
  map.value.addLayer(tileLayer);
  map.value.addLayer(areaNameLayer);

  // 断开非基础图层的源连接，以便垃圾回收
  existingLayers.forEach(layer => {
    if (
      layer !== tileLayer &&
      layer !== areaNameLayer &&
      'getSource' in layer
    ) {
      (layer as any).setSource(null); // 使用 any 避免类型问题
    }
  });
  // 理论上不需要手动触发 GC

  // 添加实体图层
  addEntityLayersToMap();

  // 更新视图中心点和缩放级别
  const view = map.value.getView();
  if (
    restoredViewState &&
    restoredViewState.center &&
    restoredViewState.zoom !== undefined
  ) {
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `正在应用已恢复的视图状态，中心点: [${restoredViewState.center[0]}, ${restoredViewState.center[1]}], 缩放级别: ${restoredViewState.zoom}`
      );
    }
    view.setCenter(restoredViewState.center);
    view.setZoom(restoredViewState.zoom);
  } else {
    const defaultCenter =
      DEFAULT_MAP_CENTERS[mapIndex] || DEFAULT_MAP_CENTERS['map001'];
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `使用默认视图设置，中心点: [${defaultCenter[0]}, ${defaultCenter[1]}], 缩放级别: ${DEFAULT_ZOOM}`
      );
    }
    view.setCenter(defaultCenter);
    view.setZoom(DEFAULT_ZOOM);
  }
}

/**
 * 切换地图
 * @param id 新地图的 ID
 */
export const selectMap = async (id: string) => {
  if (getCurrentMapId() === id) return;

  // 关闭可能打开的弹窗
  closePopupInternal();

  // 更新地图ID
  setCurrentMapId(id);

  // 清理线条
  removeAllLines();

  console.log(`开始切换到地图: ${id}`);
  console.time('切换地图 - 加载点位');
  try {
    await updatePoints(id); // 加载并过滤新地图的点位
    const points = await getCurrentPoints(); // 获取新点位
    console.log(`加载了 ${points.length} 个点位`);
    console.timeEnd('切换地图 - 加载点位');

    console.time('切换地图 - 填充渲染存储');
    populateFeaturesFromPoints(points); // <--- 使用新点位填充渲染存储
    console.timeEnd('切换地图 - 填充渲染存储');

    console.time('切换地图 - 初始化实体图层');
    await initializeEntityLayers(); // 这个现在应该基于已填充的 features
    console.timeEnd('切换地图 - 初始化实体图层');

    console.time('切换地图 - 更新地图图层/视图');
    await updateMap(id); // 更新瓦片图层和视图
    console.timeEnd('切换地图 - 更新地图图层/视图');

    console.time('切换地图 - 重新加载地名标注');
    loadTextPoints(true, id === 'map002' ? 'map02' : 'map01', zoomLevel.value);
    console.timeEnd('切换地图 - 重新加载地名标注');

    // 最后刷新一次地图渲染
    refreshMap();

    console.log(`地图切换完成: ${id}`);
    return points; // 返回加载的点位数据
  } catch (error) {
    console.error(`切换地图 ${id} 时出错:`, error);
    // 可以考虑返回空数组或抛出错误
    return [];
  }
};

/**
 * 将地图视图移动到当前地图的默认中心点
 * @param animate 是否使用动画过渡，默认为true
 */
export const moveToCenter = (animate: boolean = true): void => {
  const currentMap = map.value;
  if (!currentMap) {
    console.warn('地图实例不存在，无法居中地图');
    return;
  }

  const currentMapID = getCurrentMapId();
  const defaultCenter =
    DEFAULT_MAP_CENTERS[currentMapID] || DEFAULT_MAP_CENTERS['map001'];

  const view = currentMap.getView();

  // 如果正在显示弹窗，先关闭它
  closePopupInternal();

  if (process.env.NODE_ENV === 'development') {
    console.log(
      `正在将地图重置到默认中心点 [${defaultCenter[0]}, ${defaultCenter[1]}], 缩放级别: ${DEFAULT_ZOOM}`
    );
  }

  if (animate) {
    view.animate({
      center: defaultCenter,
      duration: 500,
      zoom: DEFAULT_ZOOM,
    });
  } else {
    view.setCenter(defaultCenter);
    view.setZoom(DEFAULT_ZOOM);
  }

  saveMapViewState(currentMapID).catch(error => {
    console.error('保存视图状态时出错:', error);
  });
};

/**
 * 刷新当前地图的点位数据和图层
 */
export const refreshPoints = async () => {
  const currentMapId = getCurrentMapId();
  console.log(`Refreshing points for map: ${currentMapId}`);
  try {
    // 1. 重新获取并过滤点位数据
    await updatePoints(currentMapId);
    const currentPoints = await getCurrentPoints();

    // 2. 重新填充渲染存储 (包括 features, itemMap, map source)
    populateFeaturesFromPoints(currentPoints);

    // 3. 重新初始化/更新实体图层（如果需要，但通常 populateFeatures 足够）
    // await initializeEntityLayers(); // 可能不再需要，因为 populate 已更新 source

    // 4. 刷新地图渲染
    refreshMap();

    // 5. 加载文本点位 (如果需要刷新)
    loadTextPoints(
      false,
      currentMapId === 'map002' ? 'map02' : 'map01',
      zoomLevel.value
    );
    console.log(`Points refreshed for map: ${currentMapId}`);
  } catch (error) {
    console.error(`Error refreshing points for map ${currentMapId}:`, error);
  }
};

/**
 * 清理地图资源
 */
export function cleanupMap(): void {
  if (!map.value) return;

  // 清理渲染优化器
  if (renderOptimizerState.value) {
    renderOptimizerState.value.dispose();
    setRenderOptimizer(null);
  }

  // 清除实体图层的加载计时器
  if (entityLayerTimerId !== null) {
    cancelRafTimeout(entityLayerTimerId);
    setEntityLayerTimerId(null);
  }

  // 清理弹窗管理器
  closePopupInternal();
  // initPopupManager 中设置了 popupManager.value，这里不需要再次设置

  // 清理地图交互
  map.value.getInteractions().forEach(interaction => {
    map.value?.removeInteraction(interaction);
  });

  // 清理地图控件
  map.value.getControls().forEach(control => {
    map.value?.removeControl(control);
  });

  // 清理地图叠加层
  map.value.getOverlays().forEach(overlay => {
    map.value?.removeOverlay(overlay);
  });
  setOverlay(null); // 清除 overlay 状态

  // 清理地图图层
  map.value.getLayers().forEach(layer => {
    if ('getSource' in layer) {
      const source = (layer as any).getSource();
      if (source) {
        if (isVectorSource(source)) source.clear();
        if (isClusterSource(source)) {
          const innerSource = source.getSource();
          if (isVectorSource(innerSource)) innerSource.clear();
        }
        (layer as any).setSource(null);
      }
    }
    map.value?.removeLayer(layer);
  });
  map.value.getLayers().clear();

  // 清除事件监听器
  unregisterMapEventListeners();
  if (selectInteraction) {
    selectInteraction.un('select', pointSelectHandler);
    selectInteraction.getFeatures().clear();
  }
  map.value.un('click', mapClickHandler);

  // 分离目标元素
  map.value.setTarget(undefined);
  setMapInstance(null);
  // 重置状态
  setEntityLayersLoaded(false);

  // 清理其他服务引用
  setMapForLines(map.value);
  setMapForIndicator(map.value);

  console.log('地图资源已清理');
}
