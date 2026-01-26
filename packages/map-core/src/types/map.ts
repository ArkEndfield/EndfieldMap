import type { Position } from '@endfieldmap/map-core/types/position';

/** 简单地图配置 */
export interface SimpleMapConfig {
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
}

// region: 地图数据
export interface OverrideRegionData {
  /** 层级，Override 表示小区域 */
  priority: 'Override';
  saveId: number;
  /** 地图名称（hash） */
  name: string; // 原 areaname 的 subTitle 直接简化成可以使用i18n的
  /** 深度文本（hash） */
  depthText?: string; // 直接简化成可以使用i18n的
  /** 位置 */
  position: Position; // 原 areaname 的 subTitle 的 position
}

export interface MapBaseRegionData {
  /** 层级，Base 表示大区域 */
  priority: 'Base';
  saveId: number;
  /** 地图ID */
  id: string; // 原 areaname 的 map，可以是 map01_lv001 这种，也可以是 lv001 这种
  /** 地图名称（hash） */
  name: string; // 原 areaname 的 subTitle 直接简化成可以使用i18n的
  /** 深度文本（hash） */
  depthText: string; // 直接简化成可以使用i18n的
  /** 位置 */
  position: Position; // Base 可能是没有，可能需要眼瞪法
  /** 小区域 */
  overrides: OverrideRegionData[];
}

export interface MapData {
  /** 地图ID（map01, ...etc） */
  id: string;
  /** 地图名称（hash） */
  name: string;
  /** 地图中心点 */
  center: Position;
  /** 缩放倍率（用于计算 xyz2crd 坐标） */
  scale: number;
  /** 偏移（用于计算 xyz2crd 坐标） */
  offset: Position;
  /** 电线杆基准尺寸 */
  electricZoneBaseSize: number;
  /** 地图区域（大区域） */
  regions: MapBaseRegionData[];
  /** 用户缩放配置 */
  zoom?: {
    /** 默认缩放大小 */
    default: number;
    /** 最小缩放大小 */
    min: number;
    /** 最大缩放大小 */
    max: number;
  };
}

export interface MapDataJson {
  version: string;
  data: MapData[];
}

// endregion
