import {
  ELECTRIC_POLE_BG_SVG,
  ICON_DISPLACEMENT_Y,
  SVG_DISPLACEMENT_Y,
  SVG_HEIGHT,
  SVG_WIDTH,
} from '@endfieldmap/map-adapter-ol/render/renderer/entity/common/marker_background_svg';
import { DEFAULT_ICON_SIZE } from '@endfieldmap/map-core';
import type { FeatureLike } from 'ol/Feature';
import Icon from 'ol/style/Icon';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';

/**
 * 电线杆连线样式
 */

/** 连线普通样式 */
export const CONNECTION_STYLE_NORMAL = new Style({
  stroke: new Stroke({ color: '#FFD700', width: 2 }),
});

/** 连线 hover 样式（直接悬停在连线上） */
export const CONNECTION_STYLE_HOVER = new Style({
  stroke: new Stroke({ color: '#FFA500', width: 4 }),
});

/** 连线「电线杆悬停」样式：与当前悬停电线杆相关的连线，降低不透明度 */
export const CONNECTION_STYLE_POLE_HOVER = new Style({
  stroke: new Stroke({ color: '#FFA500', width: 2 }),
});

/**
 * 电线杆实体点层样式
 */

const ENTITY_SIZE = DEFAULT_ICON_SIZE;

export interface ElectricPoleCanvasStyleConfig {
  iconPath: string;
  enableShadow?: boolean;
}

/**
 * 创建电线杆实体点层的 Canvas StyleFunction 样式
 * 使用预生成的 SVG 背景 + 图标层
 */
export function createElectricPoleCanvasStyle(config: ElectricPoleCanvasStyleConfig): (feature: FeatureLike) => Style[] {
  const { iconPath } = config;

  // 预创建 Icon 实例
  const bgIcon = new Icon({
    src: ELECTRIC_POLE_BG_SVG,
    anchor: [0.5, 0.5],
    width: SVG_WIDTH,
    height: SVG_HEIGHT,
    displacement: [0, SVG_DISPLACEMENT_Y],
  });

  const entityIcon = new Icon({
    src: iconPath,
    anchor: [0.5, 0.5],
    width: ENTITY_SIZE,
    height: ENTITY_SIZE,
    displacement: [0, ICON_DISPLACEMENT_Y],
  });

  // 样式缓存
  const cache = new Map<number, Style[]>();

  return (feature: FeatureLike): Style[] => {
    const active = (feature.get('active') as number) ?? 0;

    const cached = cache.get(active);
    if (cached) return cached;

    const opacity = active === 1 ? 0.75 : 1;

    const bg = bgIcon.clone();
    bg.setOpacity(opacity);

    const icon = entityIcon.clone();
    icon.setOpacity(opacity);

    const styles = [new Style({ image: bg }), new Style({ image: icon })];

    cache.set(active, styles);
    return styles;
  };
}
