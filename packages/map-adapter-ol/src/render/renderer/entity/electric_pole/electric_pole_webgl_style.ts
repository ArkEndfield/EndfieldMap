import {
  DEFAULT_FILL_COLOR,
  DEFAULT_ICON_SIZE,
  DEFAULT_STROKE_COLOR,
  DEFAULT_STROKE_WIDTH,
} from '@endfieldmap/map-core';
import type { ColorExpression, FlatStyle, NumberExpression } from 'ol/style/flat';

const ENTITY_SIZE = DEFAULT_ICON_SIZE;
const ENTITY_RADIUS = ENTITY_SIZE / 2;

export interface ElectricPoleWebGLStyleConfig {
  iconPath: string;
  enableShadow?: boolean;
}

/**
 * 将 CSS 颜色字符串转为 RGBA 数组
 */
function hexToRgba(color: string): [number, number, number, number] {
  if (color.startsWith('rgba')) {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([\d.]+)?\)/);
    if (match) {
      return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3]), match[4] ? parseFloat(match[4]) : 1];
    }
  }
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      return [parseInt(hex[0] + hex[0], 16), parseInt(hex[1] + hex[1], 16), parseInt(hex[2] + hex[2], 16), 1];
    }
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
      hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1,
    ];
  }
  return [0, 0, 0, 1];
}

/**
 * WebGL opacity 表达式
 * active=1 → 半透明 (0.75)
 * 默认 → 不透明 (1.0)
 */
const OPACITY_EXPRESSION = ['case', ['==', ['get', 'active'], 1], 0.75, 1] as NumberExpression;

/**
 * 创建电线杆实体点层的 WebGL FlatStyle 样式
 */
export function createElectricPoleWebGLStyle(config: ElectricPoleWebGLStyleConfig): FlatStyle[] {
  const { iconPath, enableShadow = false } = config;
  const radius = ENTITY_RADIUS;
  const strokeWidth = DEFAULT_STROKE_WIDTH;
  const fillColor = hexToRgba(DEFAULT_FILL_COLOR);
  const strokeColor = hexToRgba(DEFAULT_STROKE_COLOR);

  // displacement Y
  const displacementY = radius + strokeWidth * 2;

  const styles: FlatStyle[] = [];

  // 1. 阴影层（可选）
  if (enableShadow) {
    styles.push({
      'circle-radius': radius,
      'circle-fill-color': [0, 0, 0, 0.3],
      'circle-displacement': [0, displacementY],
      'circle-opacity': OPACITY_EXPRESSION,
    } as FlatStyle);
  }

  // 2. 外圈描边层
  styles.push({
    'circle-radius': radius + strokeWidth + 2,
    'circle-stroke-color': [...fillColor] as ColorExpression,
    'circle-stroke-width': strokeWidth,
    'circle-displacement': [0, displacementY],
    'circle-opacity': OPACITY_EXPRESSION,
  } as FlatStyle);

  // 3. 背景圆填充层
  styles.push({
    'circle-radius': radius + strokeWidth,
    'circle-fill-color': [...fillColor] as ColorExpression,
    'circle-stroke-color': [...strokeColor] as ColorExpression,
    'circle-stroke-width': strokeWidth,
    'circle-displacement': [0, displacementY],
    'circle-opacity': OPACITY_EXPRESSION,
  } as FlatStyle);

  // 4. 左三角装饰
  styles.push({
    'shape-points': 3,
    'shape-radius': radius * 0.35,
    'shape-angle': 0.5 * Math.PI,
    'shape-fill-color': [...strokeColor] as ColorExpression,
    'shape-displacement': [-radius, displacementY],
    'shape-opacity': OPACITY_EXPRESSION,
  } as FlatStyle);

  // 5. 右三角装饰
  styles.push({
    'shape-points': 3,
    'shape-radius': radius * 0.35,
    'shape-angle': -0.5 * Math.PI,
    'shape-fill-color': [...strokeColor] as ColorExpression,
    'shape-displacement': [radius, displacementY],
    'shape-opacity': OPACITY_EXPRESSION,
  } as FlatStyle);

  // 6. 底部三角指示器
  styles.push({
    'shape-points': 3,
    'shape-radius': 4,
    'shape-angle': 0,
    'shape-rotation': Math.PI,
    'shape-fill-color': [...strokeColor] as ColorExpression,
    'shape-displacement': [0, -1.5],
    'shape-opacity': OPACITY_EXPRESSION,
  } as FlatStyle);

  // 7. 图标层
  styles.push({
    'icon-src': iconPath,
    'icon-anchor': [0.5, 0.5],
    'icon-width': ENTITY_SIZE,
    'icon-height': ENTITY_SIZE,
    'icon-displacement': [0, displacementY],
    'icon-opacity': OPACITY_EXPRESSION,
  } as FlatStyle);

  return styles;
}
