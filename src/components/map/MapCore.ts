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

// 更新地图视图和图层
export function updateMap(mapIndex: string) {
  if (!map.value) return;

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

  // 重新添加所有图层
  map.value.addLayer(tileLayer);
  map.value.addLayer(areaNameLayer);
  entityClusterLayers.forEach(layer => {
    map.value?.addLayer(layer);
  });

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

  console.log('已清理地图资源');
}

export function createMap(
  mapIndex: string,
  controlsElement: HTMLElement,
  overlay: any
) {
  const zoomControl = createZoomControl(controlsElement);

  map.value = new Map({
    target: 'map',
    layers: [
      new TileLayer({
        source: new XYZ({
          projection: simpleProjection,
          url: `/map/${mapIndex}/{z}/{y}/{x}.png`,
          tileLoadFunction: tileLoad,
        }),
      }),
      areaNameLayer,
      // 使用散开的图层代替单一聚合图层
      ...entityClusterLayers,
    ],
    view: new View({
      projection: simpleProjection,
      center: mapIndex === 'map001' ? [100, 152] : [50, 188],
      zoom: 3,
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
}

// 选择地图
export const selectMap = (id: string) => {
  cacheMapId.value = id;
  localStorage.setItem('map', id);
  updateMap(id);
};
