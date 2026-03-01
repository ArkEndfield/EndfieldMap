import {
  ENTITY_BG_SVG,
  ENTITY_SELECTED_BG_SVG,
  ICON_DISPLACEMENT_Y,
  SVG_DISPLACEMENT_Y,
  SVG_HEIGHT,
  SVG_WIDTH,
} from '@endfieldmap/map-adapter-ol/render/renderer/entity/common/marker_background_svg';
import { DEFAULT_FILL_COLOR, DEFAULT_ICON_SIZE, DEFAULT_STROKE_COLOR } from '@endfieldmap/map-core';
import type { FeatureLike } from 'ol/Feature';
import CircleStyle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import Icon from 'ol/style/Icon';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import Text from 'ol/style/Text';

const ENTITY_SIZE = DEFAULT_ICON_SIZE;
const ENTITY_RADIUS = ENTITY_SIZE / 2;

export interface EntityGroupStyleConfig {
  iconPath: string;
  enableShadow?: boolean;
}

const BADGE_RADIUS = 7;

/**
 * 创建 Entity 组的 Canvas StyleFunction 样式
 * 合并了背景 SVG、实体图标和聚合 badge 渲染
 */
export function createEntityGroupCanvasStyle(config: EntityGroupStyleConfig): (feature: FeatureLike) => Style[] {
  const { iconPath } = config;

  // 预创建 Icon 实例
  const normalBgIcon = new Icon({
    src: ENTITY_BG_SVG,
    anchor: [0.5, 0.5],
    width: SVG_WIDTH,
    height: SVG_HEIGHT,
    displacement: [0, SVG_DISPLACEMENT_Y],
  });

  const selectedBgIcon = new Icon({
    src: ENTITY_SELECTED_BG_SVG,
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
  const cache = new Map<string, Style[]>();

  return (feature: FeatureLike): Style[] => {
    const markedState = (feature.get('markedState') as number) ?? 0;
    const selected = (feature.get('selected') as number) ?? 0;
    const active = (feature.get('active') as number) ?? 0;
    const clusterSize = (feature.get('clusterSize') as number) ?? 1;

    const key = `${markedState}-${selected}-${active}-${clusterSize}`;
    const cached = cache.get(key);
    if (cached) return cached;

    // 计算 opacity
    // markedState=2 (全部marked) → 0.4, markedState=1 (部分marked) → 0.7
    const opacity = markedState === 2 ? 0.4 : markedState === 1 ? 0.7 : 1;

    const styles: Style[] = [];

    // 1. 背景 SVG（根据 selected 切换）
    const bgIcon = selected === 1 ? selectedBgIcon.clone() : normalBgIcon.clone();
    bgIcon.setOpacity(opacity);
    styles.push(new Style({ image: bgIcon }));

    // 2. 实体图标
    const icon = entityIcon.clone();
    icon.setOpacity(opacity);
    styles.push(new Style({ image: icon }));

    // 3. 聚合 badge（如果 clusterSize > 1）
    if (clusterSize > 1) {
      const badgeCircle = new CircleStyle({
        radius: BADGE_RADIUS,
        fill: new Fill({ color: DEFAULT_STROKE_COLOR }),
        stroke: new Stroke({ color: DEFAULT_FILL_COLOR, width: 2.5 }),
        displacement: [ENTITY_RADIUS, ICON_DISPLACEMENT_Y + ENTITY_RADIUS],
      });
      badgeCircle.setOpacity(opacity);
      styles.push(new Style({ image: badgeCircle }));

      const text = clusterSize > 999 ? '999+' : clusterSize.toString();
      const fontSize = clusterSize > 99 ? 8 : clusterSize > 9 ? 9 : 10;

      const badgeText = new Text({
        text: text,
        font: `bold ${fontSize}px Outfit, Arial, sans-serif`,
        fill: new Fill({ color: `rgba(255, 255, 255, ${opacity})` }),
        textAlign: 'center',
        textBaseline: 'middle',
        offsetX: ENTITY_RADIUS,
        offsetY: -(ICON_DISPLACEMENT_Y + ENTITY_RADIUS),
      });
      styles.push(new Style({ text: badgeText }));
    }

    cache.set(key, styles);
    return styles;
  };
}
