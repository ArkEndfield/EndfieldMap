import { DEFAULT_ICON_SIZE } from '@endfieldmap/map-core';
import type { FlatStyle, NumberExpression } from 'ol/style/flat';

import {
  CUSTOM_POINT_BG_SVG,
  ICON_DISPLACEMENT_Y,
  RENDER_SCALE,
  SVG_DISPLACEMENT_Y,
  SVG_HEIGHT,
  SVG_WIDTH,
} from '@endfieldmap/map-adapter-ol/render/renderer/entity/common/marker_background_svg';

const ENTITY_SIZE = DEFAULT_ICON_SIZE;

export interface CustomPointStyleConfig {
  iconPath: string;
}

/**
 * 统一透明度表达式
 * active=1 → 0.75
 * 默认 → 1.0
 */
const OPACITY_EXPRESSION = ['case', ['==', ['get', 'active'], 1], 0.75, 1] as NumberExpression;

/**
 * 创建 CustomPoint 的 WebGL FlatStyle 样式
 * 使用预生成的 SVG 背景替代多层 WebGL 图形
 */
export function createCustomPointWebGLStyle(config: CustomPointStyleConfig): FlatStyle[] {
  const { iconPath } = config;

  const styles: FlatStyle[] = [];

  // 1. 背景 SVG（深色配色）
  styles.push({
    'icon-src': CUSTOM_POINT_BG_SVG,
    'icon-anchor': [0.5, 0.5],
    'icon-width': SVG_WIDTH * RENDER_SCALE,
    'icon-height': SVG_HEIGHT * RENDER_SCALE,
    'icon-scale': 1 / RENDER_SCALE,
    'icon-displacement': [0, SVG_DISPLACEMENT_Y],
    'icon-opacity': OPACITY_EXPRESSION,
  } as FlatStyle);

  // 2. 图标层
  styles.push({
    'icon-src': iconPath,
    'icon-anchor': [0.5, 0.5],
    'icon-width': ENTITY_SIZE,
    'icon-height': ENTITY_SIZE,
    'icon-displacement': [0, ICON_DISPLACEMENT_Y],
    'icon-opacity': OPACITY_EXPRESSION,
  } as FlatStyle);

  return styles;
}
