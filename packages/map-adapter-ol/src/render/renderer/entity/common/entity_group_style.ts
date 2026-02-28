import { DEFAULT_FILL_COLOR, DEFAULT_ICON_SIZE, DEFAULT_STROKE_COLOR } from '@endfieldmap/map-core';
import type { FeatureLike } from 'ol/Feature';
import CircleStyle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import type { FlatStyle, NumberExpression } from 'ol/style/flat';
import Stroke from 'ol/style/Stroke';
import Style, { type StyleFunction } from 'ol/style/Style';
import Text from 'ol/style/Text';

import {
  ENTITY_BG_SVG,
  ENTITY_SELECTED_BG_SVG,
  ICON_DISPLACEMENT_Y,
  RENDER_SCALE,
  SVG_DISPLACEMENT_Y,
  SVG_HEIGHT,
  SVG_WIDTH,
} from '@endfieldmap/map-adapter-ol/render/renderer/entity/common/marker_background_svg';

const ENTITY_SIZE = DEFAULT_ICON_SIZE;
const ENTITY_RADIUS = ENTITY_SIZE / 2;

export interface EntityGroupStyleConfig {
  iconPath: string;
  enableShadow?: boolean;
}

/**
 * 统一透明度表达式（基于 markedState）
 * markedState=2 (全部marked) → 0.4
 * markedState=1 (部分marked) → 0.6
 * 默认 → 1.0
 */
const OPACITY_EXPRESSION = [
  'case',
  ['==', ['get', 'markedState'], 2],
  0.4,
  ['==', ['get', 'markedState'], 1],
  0.6,
  1,
] as NumberExpression;

/**
 * 默认背景透明度（selected=1 时隐藏，切换到选中背景）
 */
const NORMAL_BG_OPACITY = [
  'case',
  ['==', ['get', 'selected'], 1],
  0,
  ['==', ['get', 'markedState'], 2],
  0.4,
  ['==', ['get', 'markedState'], 1],
  0.6,
  1,
] as NumberExpression;

/**
 * 选中背景透明度（selected=0 时隐藏）
 */
const SELECTED_BG_OPACITY = [
  'case',
  ['==', ['get', 'selected'], 0],
  0,
  ['==', ['get', 'markedState'], 2],
  0.4,
  ['==', ['get', 'markedState'], 1],
  0.6,
  1,
] as NumberExpression;

/**
 * 创建 Entity 组的 WebGL FlatStyle 样式
 * 使用预生成的 SVG 背景替代多层 WebGL 图形
 */
export function createEntityGroupWebGLStyle(config: EntityGroupStyleConfig): FlatStyle[] {
  const { iconPath } = config;

  const styles: FlatStyle[] = [];

  // 1. 默认背景 SVG（selected 时隐藏）
  styles.push({
    'icon-src': ENTITY_BG_SVG,
    'icon-anchor': [0.5, 0.5],
    'icon-width': SVG_WIDTH * RENDER_SCALE,
    'icon-height': SVG_HEIGHT * RENDER_SCALE,
    'icon-scale': 1 / RENDER_SCALE,
    'icon-displacement': [0, SVG_DISPLACEMENT_Y],
    'icon-opacity': NORMAL_BG_OPACITY,
  } as FlatStyle);

  // 2. 选中背景 SVG（仅 selected 时显示，金色描边和装饰）
  styles.push({
    'icon-src': ENTITY_SELECTED_BG_SVG,
    'icon-anchor': [0.5, 0.5],
    'icon-width': SVG_WIDTH * RENDER_SCALE,
    'icon-height': SVG_HEIGHT * RENDER_SCALE,
    'icon-scale': 1 / RENDER_SCALE,
    'icon-displacement': [0, SVG_DISPLACEMENT_Y],
    'icon-opacity': SELECTED_BG_OPACITY,
  } as FlatStyle);

  // 3. 图标层
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

/**
 * 创建聚合 badge 的 Canvas 样式函数
 * Canvas 支持文本渲染,用于在聚合点上显示数量
 * 使用缓存避免每帧重复创建 Style 对象
 */
export function createClusterBadgeCanvasStyle(): StyleFunction {
  const EMPTY_STYLE: Style[] = [];
  const badgeRadius = 7;
  const styleCache = new Map<number, Style[]>();

  // 预创建共用的 badge 圆形样式（与文本无关，所有 badge 共享同一个圆）
  const badgeCircleStyle = new Style({
    image: new CircleStyle({
      radius: badgeRadius,
      fill: new Fill({ color: DEFAULT_STROKE_COLOR }),
      stroke: new Stroke({ color: DEFAULT_FILL_COLOR, width: 2.5 }),
      displacement: [ENTITY_RADIUS, ICON_DISPLACEMENT_Y + ENTITY_RADIUS],
    }),
  });

  return (feature: FeatureLike) => {
    const clusterSize = feature.get('clusterSize') as number;

    if (!clusterSize || clusterSize <= 1) {
      return EMPTY_STYLE;
    }

    const cached = styleCache.get(clusterSize);
    if (cached) {
      return cached;
    }

    const text = clusterSize > 999 ? '999+' : clusterSize.toString();
    const fontSize = clusterSize > 99 ? 8 : clusterSize > 9 ? 9 : 10;

    const styles = [
      badgeCircleStyle,
      new Style({
        text: new Text({
          text: text,
          font: `bold ${fontSize}px Outfit, Arial, sans-serif`,
          fill: new Fill({ color: '#ffffff' }),
          textAlign: 'center',
          textBaseline: 'middle',
          offsetX: ENTITY_RADIUS,
          offsetY: -(ICON_DISPLACEMENT_Y + ENTITY_RADIUS),
        }),
      }),
    ];

    styleCache.set(clusterSize, styles);
    return styles;
  };
}
