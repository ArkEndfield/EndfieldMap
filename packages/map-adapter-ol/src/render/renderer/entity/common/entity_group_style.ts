import {
  DEFAULT_FILL_COLOR,
  DEFAULT_ICON_SIZE,
  DEFAULT_SELECTED_COLOR,
  DEFAULT_STROKE_COLOR,
  DEFAULT_STROKE_WIDTH,
} from '@endfieldmap/map-core';
import type { FeatureLike } from 'ol/Feature';
import CircleStyle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import type { ColorExpression, FlatStyle, NumberExpression } from 'ol/style/flat';
import Stroke from 'ol/style/Stroke';
import Style, { type StyleFunction } from 'ol/style/Style';
import Text from 'ol/style/Text';

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
 * WebGL 样式中用于控制填充和图标 opacity 的表达式
 * 只根据 markedState 计算透明度，不受 selectedState 影响
 *
 * markedState=2 (全部marked) → 半透明 (0.4)
 * markedState=1 (部分marked) → 较透明 (0.6)
 * 默认 → 不透明 (1.0)
 */
const FILL_OPACITY_EXPRESSION = [
  'case',
  ['==', ['get', 'markedState'], 2],
  0.4,
  ['==', ['get', 'markedState'], 1],
  0.6,
  1,
] as NumberExpression;

/**
 * WebGL 样式中用于控制描边 opacity 的表达式
 * 根据 selectedState 和 markedState 计算透明度
 *
 * 优先级（从高到低）：
 * 1. selectedState=2 (全部selected) → 不透明 (1.0)
 * 2. selectedState=1 (部分selected) → 较透明 (0.7)
 * 3. markedState=2 (全部marked) → 半透明 (0.4)
 * 4. markedState=1 (部分marked) → 较透明 (0.6)
 * 5. 默认 → 不透明 (1.0)
 */
const STROKE_OPACITY_EXPRESSION = [
  'case',
  ['==', ['get', 'selectedState'], 2],
  1,
  ['==', ['get', 'selectedState'], 1],
  0.7,
  ['==', ['get', 'markedState'], 2],
  0.4,
  ['==', ['get', 'markedState'], 1],
  0.6,
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
      'circle-opacity': FILL_OPACITY_EXPRESSION,
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
    'circle-opacity': STROKE_OPACITY_EXPRESSION,
  } as FlatStyle);

  // 3a. 背景圆填充层（只有填充，无描边）
  styles.push({
    'circle-radius': radius + strokeWidth,
    'circle-fill-color': [...fillColor],
    'circle-displacement': [0, displacementY],
    'circle-opacity': FILL_OPACITY_EXPRESSION,
  } as FlatStyle);

  // 3b. 背景圆描边层（只有描边，无填充）
  styles.push({
    'circle-radius': radius + strokeWidth,
    'circle-stroke-color': STROKE_COLOR_EXPRESSION,
    'circle-stroke-width': strokeWidth,
    'circle-displacement': [0, displacementY],
    'circle-opacity': STROKE_OPACITY_EXPRESSION,
  } as FlatStyle);

  // 4. 左三角装饰
  styles.push({
    'shape-points': 3,
    'shape-radius': radius * 0.35,
    'shape-angle': 0.5 * Math.PI,
    'shape-fill-color': STROKE_COLOR_EXPRESSION,
    'shape-displacement': [-radius, displacementY],
    'shape-opacity': STROKE_OPACITY_EXPRESSION,
  } as FlatStyle);

  // 5. 右三角装饰
  styles.push({
    'shape-points': 3,
    'shape-radius': radius * 0.35,
    'shape-angle': -0.5 * Math.PI,
    'shape-fill-color': STROKE_COLOR_EXPRESSION,
    'shape-displacement': [radius, displacementY],
    'shape-opacity': STROKE_OPACITY_EXPRESSION,
  } as FlatStyle);

  // 6. 底部三角指示器
  styles.push({
    'shape-points': 3,
    'shape-radius': 4,
    'shape-angle': 0,
    'shape-rotation': Math.PI,
    'shape-fill-color': STROKE_COLOR_EXPRESSION,
    'shape-displacement': [0, -1.5],
    'shape-opacity': STROKE_OPACITY_EXPRESSION,
  } as FlatStyle);

  // 7. 图标层
  styles.push({
    'icon-src': iconPath,
    'icon-anchor': [0.5, 0.5],
    'icon-width': ENTITY_SIZE,
    'icon-height': ENTITY_SIZE,
    'icon-displacement': [0, displacementY],
    'icon-opacity': FILL_OPACITY_EXPRESSION,
  } as FlatStyle);

  // 8. 聚合 badge 在单独的 Canvas 图层中渲染（支持文本）

  return styles;
}

/**
 * 创建聚合 badge 的 Canvas 样式函数
 * Canvas 支持文本渲染,用于在聚合点上显示数量
 */
export function createClusterBadgeCanvasStyle(): StyleFunction {
  const radius = ENTITY_RADIUS;
  const strokeWidth = DEFAULT_STROKE_WIDTH;
  const displacementY = radius + strokeWidth * 2;

  return (feature: FeatureLike) => {
    const clusterSize = feature.get('clusterSize') as number;

    // 只为聚合要素（size > 1）显示 badge
    if (!clusterSize || clusterSize <= 1) {
      return [];
    }

    const text = clusterSize > 999 ? '999+' : clusterSize.toString();
    // 缩小字体大小
    const fontSize = clusterSize > 99 ? 8 : clusterSize > 9 ? 9 : 10;

    // Badge 圆形半径
    const badgeRadius = 7;

    // 使用固定的颜色风格，不受 selected 状态影响
    const fillColor = hexToRgba(DEFAULT_FILL_COLOR);
    const strokeColor = hexToRgba(DEFAULT_STROKE_COLOR);

    // 返回两个样式：一个用于圆形，一个用于文本
    return [
      // 圆形背景
      new Style({
        image: new CircleStyle({
          radius: badgeRadius,
          fill: new Fill({ color: `rgba(${strokeColor[0]}, ${strokeColor[1]}, ${strokeColor[2]}, ${strokeColor[3]})` }),
          stroke: new Stroke({
            color: `rgba(${fillColor[0]}, ${fillColor[1]}, ${fillColor[2]}, ${fillColor[3]})`,
            width: 2.5,
          }),
          // 圆形偏移：Y轴使用正值
          displacement: [radius, displacementY + radius],
        }),
      }),
      // 文本
      new Style({
        text: new Text({
          text: text,
          font: `bold ${fontSize}px Outfit, Arial, sans-serif`,
          fill: new Fill({ color: '#ffffff' }),
          textAlign: 'center',
          textBaseline: 'middle',
          // 文本偏移：Y轴使用负值
          offsetX: radius,
          offsetY: -(displacementY + radius),
        }),
      }),
    ];
  };
}
