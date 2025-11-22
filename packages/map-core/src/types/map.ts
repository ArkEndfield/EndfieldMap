/** 简单地图配置 */
export interface SimpleMapConfig {
  /** 最小缩放级别 */
  minZoom?: number;
  /** 最大缩放级别 */
  maxZoom?: number;
  /** 像素比 */
  pixelRatio?: number;
  /** 控制元素 */
  controlElement?: HTMLElement;
  /** 覆盖层元素 */
  overlayElement?: HTMLElement;
  /** 是否禁用active feature */
  disableActiveFeature?: boolean;
  /** 是否禁用hover feature */
  disableHoverFeature?: boolean;
}

/** 地图配置 */
export interface MapConfig extends SimpleMapConfig {
  /** 容器 */
  container: HTMLElement;
  /** 静态资源地址 */
  mapImageUrl: string;
}

export type { MapFeature } from '@endfieldmap/map-core/render/source/feature/feature';
