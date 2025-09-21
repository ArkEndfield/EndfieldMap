import { ref, shallowRef } from 'vue';
import { Map } from 'ol';
import Overlay from 'ol/Overlay';
import { Select } from 'ol/interaction';
import { click } from 'ol/events/condition';
import type { Coordinate } from 'ol/coordinate';
import type { PointData } from '@/types/points';
import type { RenderOptimizer } from '@/utils/renderOptimizer';
import type { PopupManager } from '@/services/PopupManager';
import { MAP_ID_KEY, ZOOM_KEY } from '@/services/map/constants';
import { isMultiSelecting } from '@/data/marks';

// 核心状态
export const map = shallowRef<Map | null>(null);
export const renderOptimizer = shallowRef<RenderOptimizer | null>(null);
export const popupManager = shallowRef<PopupManager | null>(null);

// 地图配置状态
export const cacheMapId = ref<string>(
  localStorage.getItem(MAP_ID_KEY) || 'map001'
);
export const zoomLevel = ref(Number(localStorage.getItem(ZOOM_KEY)) || 3);
export const mapZooming = ref(false); // 添加地图缩放状态

// 交互和弹出层状态
export const point = ref<PointData | null>(null); // 当前选中的点位数据
export let overlay: Overlay | null = null; // 全局 Overlay 实例

export const selectInteraction: Select = new Select({
  condition: event => {
    // 如果处于多选状态，阻止选择
    if (isMultiSelecting.value) {
      return false;
    }
    return click(event);
  },
  style: null,
  layers: layer => {
    // 优化图层过滤，只选择可见的图层
    return layer.getVisible();
  },
});

export let entityLayerTimerId: number | null = null; // 用于取消延迟加载的计时器ID

// 右键菜单监听器集合
export const mapContextMenuListeners = new Set<
  (event: MouseEvent, coordinate?: Coordinate, pointData?: PointData, lineGroupId?: string) => void
>();

// 图像池
export const imagePool: Record<string, HTMLImageElement> = {};

// --- Helper Functions ---

export function setMapInstance(instance: Map | null): void {
  map.value = instance;
}

export function setRenderOptimizer(instance: RenderOptimizer | null): void {
  renderOptimizer.value = instance;
}

export function setPopupManager(instance: PopupManager | null): void {
  popupManager.value = instance;
}

export function setCurrentMapId(id: string): void {
  cacheMapId.value = id;
  localStorage.setItem(MAP_ID_KEY, id);
}

export function setCurrentZoomLevel(zoom: number): void {
  zoomLevel.value = zoom;
  localStorage.setItem(ZOOM_KEY, zoom.toString());
}

export function setMapZooming(zooming: boolean): void {
  // 添加 setter
  mapZooming.value = zooming;
}

export function setCurrentPoint(data: PointData | null): void {
  point.value = data;
}

export function setOverlay(instance: Overlay | null): void {
  overlay = instance;
}

export function setEntityLayerTimerId(id: number | null): void {
  entityLayerTimerId = id;
}

export function addImageToPool(src: string, img: HTMLImageElement): void {
  imagePool[src] = img;
}

export function removeImageFromPool(src: string): void {
  delete imagePool[src];
}

export function getImageFromPool(src: string): HTMLImageElement | undefined {
  return imagePool[src];
}

export function getMapContextMenuListeners(): Set<
  (event: MouseEvent, coordinate?: Coordinate, pointData?: PointData) => void
> {
  return mapContextMenuListeners;
}
