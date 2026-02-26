import {
  DEFAULT_FILL_COLOR,
  DEFAULT_ICON_SIZE,
  DEFAULT_SELECTED_COLOR,
  DEFAULT_STROKE_COLOR,
  DEFAULT_STROKE_WIDTH,
} from '@endfieldmap/map-core';

const RADIUS = DEFAULT_ICON_SIZE / 2;
const SW = DEFAULT_STROKE_WIDTH;

const OUTER_RING_R = RADIUS + SW + 2;
const BG_CIRCLE_R = RADIUS + SW;
const DISPLACEMENT_Y = RADIUS + SW * 2;
const DECO_R = RADIUS * 0.35;
const BOTTOM_R = 4;
const BOTTOM_OFFSET = 1.5;

const FULL_EXTENT = OUTER_RING_R + SW / 2;
const CX = Math.ceil(FULL_EXTENT) + 1;
const CY = CX;
const TIP_Y = CY + DISPLACEMENT_Y + BOTTOM_OFFSET + BOTTOM_R;

export const SVG_WIDTH = CX * 2;
export const SVG_HEIGHT = Math.ceil(TIP_Y + 0.5);

const POSITION_OFFSET = BOTTOM_R;

/** 图标层 displacement */
export const ICON_DISPLACEMENT_Y = DISPLACEMENT_Y + POSITION_OFFSET;

/** SVG 背景 displacement：补偿 SVG 中心与圆心的偏移 */
export const SVG_DISPLACEMENT_Y = DISPLACEMENT_Y + POSITION_OFFSET - (SVG_HEIGHT / 2 - CY);

/** 2x 渲染，通过 icon-scale 缩回显示尺寸以保证高 DPI 清晰度 */
export const RENDER_SCALE = 2;

function trianglePoints(cx: number, cy: number, r: number, startAngle: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 3; i++) {
    const a = (i * 2 * Math.PI) / 3 - Math.PI / 2 + startAngle;
    const x = Math.round((cx + r * Math.cos(a)) * 100) / 100;
    const y = Math.round((cy + r * Math.sin(a)) * 100) / 100;
    pts.push(`${x},${y}`);
  }
  return pts.join(' ');
}

function buildSvgDataUri(fillColor: string, strokeColor: string, outerStrokeColor?: string): string {
  const outerStroke = outerStrokeColor ?? fillColor;
  const bottomCy = CY + DISPLACEMENT_Y + BOTTOM_OFFSET;

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SVG_WIDTH * RENDER_SCALE}" height="${SVG_HEIGHT * RENDER_SCALE}" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}">`,
    `<circle cx="${CX}" cy="${CY}" r="${OUTER_RING_R}" fill="none" stroke="${outerStroke}" stroke-width="${SW}"/>`,
    `<circle cx="${CX}" cy="${CY}" r="${BG_CIRCLE_R}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${SW}"/>`,
    `<polygon points="${trianglePoints(CX - RADIUS, CY, DECO_R, Math.PI / 2)}" fill="${strokeColor}"/>`,
    `<polygon points="${trianglePoints(CX + RADIUS, CY, DECO_R, -Math.PI / 2)}" fill="${strokeColor}"/>`,
    `<polygon points="${trianglePoints(CX, bottomCy, BOTTOM_R, Math.PI)}" fill="${strokeColor}"/>`,
    '</svg>',
  ].join('');

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Entity 组默认背景 */
export const ENTITY_BG_SVG = buildSvgDataUri(DEFAULT_FILL_COLOR, DEFAULT_STROKE_COLOR);

/** Entity 组选中状态背景（描边和装饰使用金色） */
export const ENTITY_SELECTED_BG_SVG = buildSvgDataUri(
  DEFAULT_FILL_COLOR,
  DEFAULT_SELECTED_COLOR,
  DEFAULT_SELECTED_COLOR,
);

/** 电线杆背景（与 Entity 组相同配色） */
export const ELECTRIC_POLE_BG_SVG = ENTITY_BG_SVG;

/** 自定义标点背景（深色配色） */
export const CUSTOM_POINT_BG_SVG = buildSvgDataUri('#3A3A3A', '#1A1A1A');
