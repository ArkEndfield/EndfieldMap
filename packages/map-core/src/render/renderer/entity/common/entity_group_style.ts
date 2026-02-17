import {
  DEFAULT_FILL_COLOR,
  DEFAULT_ICON_SIZE,
  DEFAULT_SELECTED_COLOR,
  DEFAULT_STROKE_COLOR,
  DEFAULT_STROKE_WIDTH,
} from '@endfieldmap/map-core/const/map';
import type { ColorExpression, FlatStyle, NumberExpression } from 'ol/style/flat';

const ENTITY_SIZE = DEFAULT_ICON_SIZE;
const ENTITY_RADIUS = ENTITY_SIZE / 2;

export interface EntityGroupStyleConfig {
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
 * WebGL 样式中用于控制 opacity 的表达式
 * 根据 feature 上的 selected / marked 属性动态计算透明度
 *
 * selected=1 → 不透明 (1.0)
 * marked=1 且未选中 → 半透明 (0.4)
 * 默认 → 不透明 (1.0)
 */
const OPACITY_EXPRESSION = [
  'case',
  ['==', ['get', 'selected'], 1],
  1,
  ['==', ['get', 'marked'], 1],
  0.4,
  1,
] as NumberExpression;

/**
 * 描边颜色表达式：selected 时为金色，否则为默认描边色
 */
const STROKE_COLOR_EXPRESSION = [
  'case',
  ['==', ['get', 'selected'], 1],
  [...hexToRgba(DEFAULT_SELECTED_COLOR)],
  [...hexToRgba(DEFAULT_STROKE_COLOR)],
] as ColorExpression;

/**
 * 创建 Entity 组的 WebGL FlatStyle 样式
 * 返回 FlatStyle 数组用于叠加渲染多个样式层
 */
export function createEntityGroupWebGLStyle(config: EntityGroupStyleConfig): FlatStyle[] {
  const { iconPath, enableShadow = false } = config;
  const radius = ENTITY_RADIUS;
  const strokeWidth = DEFAULT_STROKE_WIDTH;
  const fillColor = hexToRgba(DEFAULT_FILL_COLOR);
  const selectedColor = hexToRgba(DEFAULT_SELECTED_COLOR);

  // displacement Y：将图标从底部锚点提升到中心
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
    'circle-stroke-color': [
      'case',
      ['==', ['get', 'selected'], 1],
      [...selectedColor],
      [...fillColor],
    ] as ColorExpression,
    'circle-stroke-width': strokeWidth,
    'circle-displacement': [0, displacementY],
    'circle-opacity': OPACITY_EXPRESSION,
  } as FlatStyle);

  // 3. 背景圆填充层
  styles.push({
    'circle-radius': radius + strokeWidth,
    'circle-fill-color': [...fillColor],
    'circle-stroke-color': STROKE_COLOR_EXPRESSION,
    'circle-stroke-width': strokeWidth,
    'circle-displacement': [0, displacementY],
    'circle-opacity': OPACITY_EXPRESSION,
  } as FlatStyle);

  // 4. 左三角装饰
  styles.push({
    'shape-points': 3,
    'shape-radius': radius * 0.35,
    'shape-angle': 0.5 * Math.PI,
    'shape-fill-color': STROKE_COLOR_EXPRESSION,
    'shape-displacement': [-radius, displacementY],
    'shape-opacity': OPACITY_EXPRESSION,
  } as FlatStyle);

  // 5. 右三角装饰
  styles.push({
    'shape-points': 3,
    'shape-radius': radius * 0.35,
    'shape-angle': -0.5 * Math.PI,
    'shape-fill-color': STROKE_COLOR_EXPRESSION,
    'shape-displacement': [radius, displacementY],
    'shape-opacity': OPACITY_EXPRESSION,
  } as FlatStyle);

  // 6. 底部三角指示器
  styles.push({
    'shape-points': 3,
    'shape-radius': 4,
    'shape-angle': 0,
    'shape-rotation': Math.PI,
    'shape-fill-color': STROKE_COLOR_EXPRESSION,
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

  // 8. 聚合 badge 圆形（仅在 clusterSize > 1 时显示）
  // 通过 opacity 控制显隐：clusterSize > 1 时显示，否则隐藏
  styles.push({
    'circle-radius': [
      'interpolate',
      ['linear'],
      ['get', 'clusterSize'],
      2,
      8, // 2个点: 半径8
      10,
      10, // 10个点: 半径10
      50,
      12, // 50个点: 半径12
      100,
      14, // 100+个点: 半径14
    ] as NumberExpression,
    'circle-fill-color': [0xe0, 0x40, 0x40, 1],
    'circle-stroke-color': [0xff, 0xff, 0xff, 1],
    'circle-stroke-width': 1.5,
    'circle-displacement': [radius, displacementY + radius],
    'circle-opacity': ['case', ['>', ['get', 'clusterSize'], 1], 1, 0] as NumberExpression,
  } as FlatStyle);

  return styles;
}
