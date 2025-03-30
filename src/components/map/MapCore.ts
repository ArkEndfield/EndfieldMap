import { Map, View } from 'ol';
import { Tile as TileLayer } from 'ol/layer';
import { XYZ } from 'ol/source';
import { Projection } from 'ol/proj';
import { defaults as interactionDefaults } from 'ol/interaction';
import Control from 'ol/control/Control';
import { areaNameLayer } from '@/data/locations';
import { entityClusterLayers } from '@/data/entity';
import { ref } from 'vue';

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
export const cacheMapId = ref<string>(localStorage.getItem('map') || 'map001')
export function createMap(mapIndex: string, controlsElement: HTMLElement, overlay: any) {
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
  cacheMapId.value = id
  localStorage.setItem('map', id)
}