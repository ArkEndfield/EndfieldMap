import type { Coordinate } from 'ol/coordinate';
import type { Geometry } from 'ol/geom';
import type Style from 'ol/style/Style';

/**
 * DevTools 绘制形状类型
 */
export enum DevToolsShapeType {
  /** 点 */
  POINT = 'point',
  /** 圆形 */
  CIRCLE = 'circle',
  /** 多边形 */
  POLYGON = 'polygon',
  /** 线段 */
  LINE = 'line',
  /** 矩形 */
  RECTANGLE = 'rectangle',
}

/**
 * DevTools 绘制数据基础接口
 */
export interface DevToolsDrawData {
  /** 唯一标识 */
  id: number;
  /** 形状类型 */
  type: DevToolsShapeType;
  /** 坐标（点为单坐标，其他为坐标数组） */
  coordinates: Coordinate | Coordinate[];
  /** 样式配置 */
  style: DevToolsStyleConfig;
  /** z-index 排序 */
  zIndex: number;
}

/**
 * DevTools 样式配置
 */
export interface DevToolsStyleConfig {
  /** 填充颜色 */
  fillColor?: string;
  /** 描边颜色 */
  strokeColor?: string;
  /** 描边宽度 */
  strokeWidth?: number;
  /** 点/圆的半径 */
  radius?: number;
}

/**
 * DevTools 点数据
 */
export interface DevToolsPointData extends DevToolsDrawData {
  type: DevToolsShapeType.POINT;
  coordinates: Coordinate;
}

/**
 * DevTools 圆形数据
 */
export interface DevToolsCircleData extends DevToolsDrawData {
  type: DevToolsShapeType.CIRCLE;
  coordinates: Coordinate;
  /** 圆的半径（地图单位） */
  circleRadius: number;
}

/**
 * DevTools 多边形数据
 */
export interface DevToolsPolygonData extends DevToolsDrawData {
  type: DevToolsShapeType.POLYGON;
  coordinates: Coordinate[];
}

/**
 * DevTools 线段数据
 */
export interface DevToolsLineData extends DevToolsDrawData {
  type: DevToolsShapeType.LINE;
  coordinates: Coordinate[];
}

/**
 * DevTools 矩形数据
 */
export interface DevToolsRectangleData extends DevToolsDrawData {
  type: DevToolsShapeType.RECTANGLE;
  coordinates: Coordinate[];
}

/**
 * DevTools 联合数据类型
 */
export type DevToolsUnionData =
  | DevToolsPointData
  | DevToolsCircleData
  | DevToolsPolygonData
  | DevToolsLineData
  | DevToolsRectangleData;

/**
 * DevTools Feature 属性键
 */
export const DevToolsFeatureIdKey = 'devtools_id';
export const DevToolsFeatureTypeKey = 'devtools_type';
export const DevToolsFeatureZIndexKey = 'devtools_zindex';
export const DevToolsFeatureVisibleKey = 'devtools_visible';
export const DevToolsFeatureBaseStyleKey = 'devtools_base_style';

/**
 * 从 Feature 获取样式的辅助类型
 */
export interface DevToolsFeatureData {
  id: number;
  type: DevToolsShapeType;
  geometry: Geometry;
  style: Style | Style[];
  zIndex: number;
  visible: boolean;
}

export interface DevToolsLayerItem {
  id: number;
  type: DevToolsShapeType;
  zIndex: number;
  visible: boolean;
}
