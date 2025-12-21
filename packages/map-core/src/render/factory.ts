import { DEFAULT_FILL_COLOR, DEFAULT_STROKE_COLOR } from '@endfieldmap/map-core/const/map';
import CircleStyle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import Icon from 'ol/style/Icon';
import RegularShape from 'ol/style/RegularShape';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import Text from 'ol/style/Text';

export type OpacityLevel = '50' | '75' | '100';

/**
 * 创建模糊阴影的SVG字符串
 * @param radius 半径
 * @param blurAmount 模糊程度
 * @param color 阴影颜色
 * @returns SVG字符串
 */
function createShadowSVG(radius: number, blurAmount: number = 3, color: string = 'rgba(0,0,0,0.5)'): string {
  // 计算SVG尺寸，需要足够大以容纳模糊扩散
  const size = (radius + blurAmount * 2) * 2;
  const center = size / 2;

  // 创建带有唯一ID的滤镜
  const filterId = `shadow-blur-${radius}-${blurAmount}`;

  return `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
        <defs>
          <filter id="${filterId}" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="${blurAmount}" />
          </filter>
        </defs>
        <circle cx="${center}" cy="${center}" r="${radius}" fill="${color}" filter="url(#${filterId})" />
      </svg>
    `;
}
/**
 * 创建模糊的阴影样式
 * @param radius 半径
 * @returns 阴影样式
 */
export function createBlurredShadowStyles(radius: number): Style {
  const shadowSVG = createShadowSVG(radius, 2, 'rgba(0,0,0,0.4)');
  const svgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(shadowSVG);

  return new Style({
    image: new Icon({
      src: svgUrl,
      scale: 1,
      displacement: [0, radius],
    }),
  });
}

/**
 * 创建圆形样式
 * @param radius 半径
 * @param color 填充颜色
 * @param strokeWidth 描边宽度
 * @param strokeColor 描边颜色
 */
export function createCircleStyle(
  radius: number,
  color: string = DEFAULT_FILL_COLOR,
  strokeWidth: number = 0,
  strokeColor: string = DEFAULT_STROKE_COLOR
): Style {
  return new Style({
    image: new CircleStyle({
      radius: radius + strokeWidth,
      fill: new Fill({ color: color }),
      stroke: new Stroke({ color: strokeColor, width: strokeWidth }),
      displacement: [0, radius + strokeWidth * 2],
    }),
  });
}

/**
 * 创建装饰样式
 * @param radius 半径
 * @param color 颜色
 * @param direction 方向，'left'、'right'、'top' 或 'bottom'
 */
export function createDecoration(
  radius: number,
  direction: 'left' | 'right' | 'top' | 'bottom',
  strokeWidth: number = 0,
  color: string = DEFAULT_STROKE_COLOR
): Style {
  let displacementX: number;
  let displacementY: number;
  let angle: number;

  switch (direction) {
    case 'left':
      displacementX = -radius;
      displacementY = radius + strokeWidth * 2;
      angle = 0.5 * Math.PI;
      break;
    case 'right':
      displacementX = radius;
      displacementY = radius + strokeWidth * 2;
      angle = -0.5 * Math.PI;
      break;
    case 'top':
      displacementX = 0;
      displacementY = -radius - radius * 0.2 - strokeWidth * 2;
      angle = Math.PI;
      break;
    case 'bottom':
      displacementX = 0;
      displacementY = radius + radius * 0.2 + strokeWidth * 2;
      angle = 0;
      break;
  }

  return new Style({
    image: new RegularShape({
      points: 3,
      radius: radius * 0.35,
      angle: angle,
      fill: new Fill({ color: color }),
      displacement: [displacementX, displacementY],
      rotation: 0,
    }),
  });
}

/**
 * 创建底部三角指示器
 * @param color 颜色
 */
export function createBottomTriangleIndicator(color: string = DEFAULT_STROKE_COLOR): Style {
  return new Style({
    image: new RegularShape({
      points: 3,
      radius: 4,
      angle: 0,
      fill: new Fill({ color }),
      displacement: [0, -1.5],
      rotation: Math.PI,
    }),
  });
}

/**
 * 创建实体点位的背景样式（圆形 + 两侧装饰 + 底部三角）
 * 生成以 `${fillOpacity}-${strokeOpacity}` 为键的样式组合
 */
export function createEntityBackgroundStyles(
  radius: number,
  strokeWidth: number,
  fillColors: Record<OpacityLevel, string>,
  strokeColors: Record<OpacityLevel, string>
): Record<string, Style[]> {
  const result: Record<string, Style[]> = {};

  (['100', '50', '75'] as OpacityLevel[]).forEach((fillOpacity) => {
    (['100', '50', '75'] as OpacityLevel[]).forEach((strokeOpacity) => {
      const strokeColor = strokeColors[strokeOpacity];
      const fillColor = fillColors[fillOpacity];
      const key = `${fillOpacity}-${strokeOpacity}`;
      result[key] = [
        // 外层描边
        new Style({
          image: new CircleStyle({
            radius: radius + strokeWidth + 2,
            stroke: new Stroke({ color: fillColor, width: strokeWidth }),
            displacement: [0, radius + strokeWidth * 2],
          }),
        }),
        createCircleStyle(radius, fillColor, strokeWidth, strokeColor),
        createDecoration(radius, 'left', strokeWidth, strokeColor),
        createDecoration(radius, 'right', strokeWidth, strokeColor),
        createBottomTriangleIndicator(strokeColor),
      ];
    });
  });

  return result;
}

/**
 * 创建聚合样式
 * @param radius 半径
 * @param size 数量
 */
export function createClusterStyle({
  radius,
  size,
  bgColor = DEFAULT_STROKE_COLOR,
  textColor = '#fff',
  textStrokeColor = '#000',
  textStrokeWidth = 2,
}: {
  radius: number;
  size: number;
  bgColor?: string;
  textColor?: string;
  textStrokeColor?: string;
  textStrokeWidth?: number;
}): Style {
  return new Style({
    image: new CircleStyle({
      radius: radius * 0.4,
      fill: new Fill({ color: bgColor }),
      displacement: [0, radius / 2 + 1],
    }),
    text: new Text({
      text: size.toString(),
      fill: new Fill({ color: textColor }),
      font: 'bold 8px Outfit, "Noto Sans SC"',
      offsetY: -6,
      stroke: new Stroke({ color: textStrokeColor, width: textStrokeWidth }),
    }),
  });
}

/**
 * 创建图标样式
 * @param imagePath 图片路径
 * @param size 图标尺寸（像素）
 * @param radius 底部圆半径，用于计算位移
 * @param borderWidth 底部圆边框宽度
 */
export function createIconStyle(imagePath: string, size: number, radius: number, borderWidth: number = 0): Style {
  return new Style({
    image: new Icon({
      src: imagePath,
      anchor: [0.5, 0.5],
      width: size,
      height: size,
      displacement: [0, radius + borderWidth * 2],
    }),
  });
}

/**
 * 创建hover四个角的样式（替代原来的圆环）
 * 使用 custom renderer 直接在 canvas 上绘制，避免 SVG Data URL 每帧重新加载导致的闪烁
 * @param radius 当前半径（由动画控制器提供，表示中心到四角的距离）
 * @param baseRadius 底部圆的基础半径（不含描边）
 * @param strokeWidth 描边宽度
 * @param strokeColor 描边颜色
 * @returns 样式
 */
export function createHoverCornerStyle(
  radius: number,
  baseRadius: number,
  strokeWidth: number = 2,
  strokeColor: string = 'rgba(255, 255, 255, 0.9)'
): Style {
  const displacement = baseRadius + 3 * 2;
  const cornerLength = 6; // 固定角长度

  return new Style({
    renderer: (pixelCoordinates, state) => {
      const { context, pixelRatio } = state;
      const [x, y] = pixelCoordinates as number[];

      // 应用像素比，确保在 Retina 屏等高分屏上尺寸正确
      const r = radius * pixelRatio;
      const cl = cornerLength * pixelRatio;
      const sw = strokeWidth * pixelRatio;
      const disp = displacement * pixelRatio;

      const centerY = y - disp;

      context.save();
      context.beginPath();
      context.strokeStyle = strokeColor;
      context.lineWidth = sw;
      context.lineCap = 'square';

      // 左上
      context.moveTo(x - r, centerY - r + cl);
      context.lineTo(x - r, centerY - r);
      context.lineTo(x - r + cl, centerY - r);

      // 右上
      context.moveTo(x + r - cl, centerY - r);
      context.lineTo(x + r, centerY - r);
      context.lineTo(x + r, centerY - r + cl);

      // 左下
      context.moveTo(x - r, centerY + r - cl);
      context.lineTo(x - r, centerY + r);
      context.lineTo(x - r + cl, centerY + r);

      // 右下
      context.moveTo(x + r - cl, centerY + r);
      context.lineTo(x + r, centerY + r);
      context.lineTo(x + r, centerY + r - cl);

      context.stroke();
      context.restore();
    },
  });
}

/**
 * 创建实体点位的图标样式
 */
export function createEntityIconStyles({
  url,
  size,
  radius,
  borderWidth = 0,
}: {
  url: string;
  size: number;
  radius: number;
  borderWidth?: number;
}): Style {
  return createIconStyle(url, size, radius, borderWidth);
}
