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
import Icon from 'ol/style/Icon';
import Style from 'ol/style/Style';

const ENTITY_SIZE = DEFAULT_ICON_SIZE;
const ENTITY_RADIUS = ENTITY_SIZE / 2;

export interface EntityGroupStyleConfig {
  iconPath: string;
  enableShadow?: boolean;
}

const BADGE_RADIUS = 7;

/**
 * 将 Badge 的背景圆圈和文字绘制到离屏 Canvas 中，作为单一 Image 返回。
 * 解决 OpenLayers 同一 zIndex 层级下 Text 总是浮在 Image 之上的渲染问题。
 */
function createBadgeIcon(clusterSize: number, opacity: number): Icon {
  const text = clusterSize > 999 ? '999+' : clusterSize.toString();
  const fontSize = clusterSize > 99 ? 8 : clusterSize > 9 ? 9 : 10;

  // 画布大小，预留出描边 (Stroke) 的空间
  const canvasSize = BADGE_RADIUS * 2 + 8;
  const center = canvasSize / 2;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  // 提升 2 倍分辨率来绘制，防止 Canvas 在高分屏下文字模糊
  const pixelRatio = 2;
  canvas.width = canvasSize * pixelRatio;
  canvas.height = canvasSize * pixelRatio;
  ctx.scale(pixelRatio, pixelRatio);

  ctx.globalAlpha = opacity;

  // 1. 绘制背景圆
  ctx.beginPath();
  ctx.arc(center, center, BADGE_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = DEFAULT_STROKE_COLOR;
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = DEFAULT_FILL_COLOR;
  ctx.stroke();

  // 2. 绘制文字
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${fontSize}px Outfit, Arial, sans-serif`;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(text, center, center + 1);

  return new Icon({
    img: canvas,
    width: canvasSize,
    height: canvasSize,
    displacement: [ENTITY_RADIUS, ICON_DISPLACEMENT_Y + ENTITY_RADIUS],
  });
}

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
      styles.push(
        new Style({
          image: createBadgeIcon(clusterSize, opacity),
        })
      );
    }

    // 4. Z-Index 层级管理：选中/活跃标点整体覆盖在普通标点之上
    const zIndex = selected === 1 ? 10 : active === 1 ? 5 : 0;
    styles.forEach((s) => s.setZIndex(zIndex));

    cache.set(key, styles);
    return styles;
  };
}
