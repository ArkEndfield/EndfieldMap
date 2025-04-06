import { Map, View } from 'ol';
import { Tile as TileLayer } from 'ol/layer';
import { XYZ } from 'ol/source';
import { Projection } from 'ol/proj';
import { defaults as interactionDefaults } from 'ol/interaction';
import Control from 'ol/control/Control';
import { areaNameLayer } from '@/data/locations';
import { entityClusterLayers } from '@/data/entity';
import { ref } from 'vue';
import { Layer } from 'ol/layer';
import VectorSource from 'ol/source/Vector';
import Cluster from 'ol/source/Cluster';

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

// 创建并返回地图实例
export const map = ref<Map | null>(null);
export const cacheMapId = ref<string>(localStorage.getItem('map') || 'map001');

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
    clearTimeout(entityLayerTimerId);
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

      // 延迟显示图层，确保它们已经渲染完成
      requestAnimationFrame(() => {
        entityClusterLayers.forEach(layer => {
          layer.setVisible(true);
        });
      });
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

    entityLayerTimerId = window.setTimeout(() => {
      addEntityLayersToMap(currentRetry + 1);
    }, delay);
  } else {
    console.warn('达到最大重试次数，实体图层加载失败');
  }
}

// 更新地图视图和图层
export function updateMap(mapIndex: string) {
  if (!map.value) return;

  // 重置实体图层加载状态
  entityLayersLoaded.value = false;

  // 移除所有现有图层前，先清理它们
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
      }
    }
  });

  // 移除所有现有图层
  map.value.getLayers().clear();

  // 创建新的瓦片图层
  const tileLayer = new TileLayer({
    source: new XYZ({
      projection: simpleProjection,
      url: `/map/${mapIndex}/{z}/{y}/{x}.png`,
      tileLoadFunction: tileLoad,
    }),
  });

  // 重新添加基础图层
  map.value.addLayer(tileLayer);
  map.value.addLayer(areaNameLayer);

  // 使用改进的方法添加实体图层
  addEntityLayersToMap();

  // 更新视图中心点
  const view = map.value.getView();
  view.setCenter(mapIndex === 'map001' ? [100, 152] : [50, 188]);
  view.setZoom(3);

  // 强制更新地图尺寸和重新渲染
  map.value.updateSize();
  map.value.render();

  console.log(`已更新地图到 ${mapIndex}`);
}

// 清理地图资源的函数
export function cleanupMap() {
  if (!map.value) return;

  // 清除实体图层的加载计时器
  if (entityLayerTimerId !== null) {
    clearTimeout(entityLayerTimerId);
    entityLayerTimerId = null;
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

  // 分离目标元素
  map.value.setTarget(undefined);

  // 重置状态
  entityLayersLoaded.value = false;
}

export function createMap(
  mapIndex: string,
  controlsElement: HTMLElement,
  overlay: any
) {
  const zoomControl = createZoomControl(controlsElement);

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
      center: mapIndex === 'map001' ? [100, 152] : [50, 188],
      zoom: Number(localStorage.getItem('zoom')) || 3,
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

  // 使用改进的方法添加实体图层
  addEntityLayersToMap();

  // 监听地图渲染完成事件，如果实体图层还没加载成功，再次尝试
  map.value.once('rendercomplete', () => {
    if (!entityLayersLoaded.value) {
      console.log('地图渲染完成但实体图层未加载，重新尝试添加');
      addEntityLayersToMap();
    }
  });
}

// 选择地图
export const selectMap = (id: string) => {
  console.log('选择地图', id);
  if (cacheMapId.value === id) return;
  cacheMapId.value = id;
  localStorage.setItem('map', id);
  updateMap(id);
};
