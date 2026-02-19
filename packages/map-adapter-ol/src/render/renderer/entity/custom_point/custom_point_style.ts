import { DEFAULT_ICON_SIZE, DEFAULT_STROKE_WIDTH } from '@endfieldmap/map-core/const/map';
import type { ColorExpression, FlatStyle, NumberExpression } from 'ol/style/flat';

const ENTITY_SIZE = DEFAULT_ICON_SIZE;
const ENTITY_RADIUS = ENTITY_SIZE / 2;

// 自定义标点使用深色样式
const FILL_COLOR: [number, number, number, number] = [0x3a, 0x3a, 0x3a, 1]; // #3A3A3A
const STROKE_COLOR: [number, number, number, number] = [0x1a, 0x1a, 0x1a, 1]; // #1A1A1A

export interface CustomPointStyleConfig {
  iconPath: string;
}

/**
 * WebGL 样式中用于控制 opacity 的表达式
 * active=1 → 半透明 (0.75)
 * 默认 → 不透明 (1.0)
 */
const OPACITY_EXPRESSION = ['case', ['==', ['get', 'active'], 1], 0.75, 1] as NumberExpression;

/**
 * 创建 CustomPoint 的 WebGL FlatStyle 样式
 */
export function createCustomPointWebGLStyle(config: CustomPointStyleConfig): FlatStyle[] {
  const { iconPath } = config;
  const radius = ENTITY_RADIUS;
  const strokeWidth = DEFAULT_STROKE_WIDTH;

  // displacement Y：将图标从底部锚点提升到中心
  const displacementY = radius + strokeWidth * 2;

  const styles: FlatStyle[] = [];

  // 1. 外圈描边层
  styles.push({
    'circle-radius': radius + strokeWidth + 2,
    'circle-stroke-color': [...FILL_COLOR] as ColorExpression,
    'circle-stroke-width': strokeWidth,
    'circle-displacement': [0, displacementY],
    'circle-opacity': OPACITY_EXPRESSION,
  } as FlatStyle);

  // 2. 背景圆填充层
  styles.push({
    'circle-radius': radius + strokeWidth,
    'circle-fill-color': [...FILL_COLOR] as ColorExpression,
    'circle-stroke-color': [...STROKE_COLOR] as ColorExpression,
    'circle-stroke-width': strokeWidth,
    'circle-displacement': [0, displacementY],
    'circle-opacity': OPACITY_EXPRESSION,
  } as FlatStyle);

  // 3. 左三角装饰
  styles.push({
    'shape-points': 3,
    'shape-radius': radius * 0.35,
    'shape-angle': 0.5 * Math.PI,
    'shape-fill-color': [...STROKE_COLOR] as ColorExpression,
    'shape-displacement': [-radius, displacementY],
    'shape-opacity': OPACITY_EXPRESSION,
  } as FlatStyle);

  // 4. 右三角装饰
  styles.push({
    'shape-points': 3,
    'shape-radius': radius * 0.35,
    'shape-angle': -0.5 * Math.PI,
    'shape-fill-color': [...STROKE_COLOR] as ColorExpression,
    'shape-displacement': [radius, displacementY],
    'shape-opacity': OPACITY_EXPRESSION,
  } as FlatStyle);

  // 5. 底部三角指示器
  styles.push({
    'shape-points': 3,
    'shape-radius': 4,
    'shape-angle': 0,
    'shape-rotation': Math.PI,
    'shape-fill-color': [...STROKE_COLOR] as ColorExpression,
    'shape-displacement': [0, -1.5],
    'shape-opacity': OPACITY_EXPRESSION,
  } as FlatStyle);

  // 6. 图标层
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
