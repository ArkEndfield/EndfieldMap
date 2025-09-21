import {
  Circle as CircleStyle,
  Fill,
  Icon,
  Stroke,
  Style,
  Text,
  RegularShape,
} from 'ol/style';
import { asArray } from 'ol/color';
import Feature from 'ol/Feature';
import {
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_RADIUS,
  DEFAULT_STROKE_COLOR,
  DEFAULT_STROKE_WIDTH,
  FINISHED_OPACITY,
  partialSelectionStyle,
  selectionStyle,
} from '@/services/render/constants';
import {
  calculateOptimalScale,
  getColorForEntity,
  getImageSize,
} from '@/utils/render';
import { addStyleToCache, getStore } from '@/services/render/store';
import { entityInfo } from '@/data/entity';
import { setupCacheCleanup } from '@/services/render/cache';
import { isMarked } from '@/services/marks';
import {
  currentMarkFilter,
  isMultiSelecting,
  multiSelectMarks,
} from '@/data/marks';

/**
 * 创建圆形标点样式
 * @param entityType 实体类型
 * @param size 标点数量
 * @returns 样式数组
 */
export async function createCircleIconStyle(
  entityType: string,
  size: number = 1
): Promise<Style[]> {
  const store = getStore();
  const cacheKey = `${entityType}-${size}`;

  if (store.iconStyleCache[cacheKey] !== undefined) {
    // 清除之前的清理定时器
    if (store.styleCacheCleanupTimers[cacheKey]) {
      clearTimeout(store.styleCacheCleanupTimers[cacheKey]);
    }
    return store.iconStyleCache[cacheKey] as Promise<Style[]>;
  }

  const stylePromise = (async () => {
    const color = getColorForEntity(entityType);
    const radius = DEFAULT_RADIUS;
    const targetIconSize = radius * 2;

    const imagePath = `/assets/${
      entityInfo[entityType]?.category || 'default'
    }/${entityInfo[entityType]?.entityInfo.pic || 'default'}.png`;

    const imageSize = await getImageSize(imagePath);
    const optimalScale = calculateOptimalScale(
      imageSize.width,
      imageSize.height,
      targetIconSize
    );

    const baseStyles = createBaseStyles(radius, color, imagePath, optimalScale);

    if (size > 1) {
      baseStyles.push(createClusterStyle(radius, size));
    }

    return baseStyles;
  })();

  store.iconStyleCache[cacheKey] = stylePromise;
  setupCacheCleanup(stylePromise, cacheKey);

  return stylePromise;
}

/**
 * 创建基础样式
 * @param radius 半径
 * @param color 颜色
 * @param imagePath 图片路径
 * @param optimalScale 最佳缩放比例
 * @param isElectricPole 是否为电线杆
 */
export function createBaseStyles(
  radius: number,
  color: string,
  imagePath: string,
  optimalScale: number,
): Style[] {
  const styles = [
    ...createBlurredShadowStyles(radius),
    createOuterCircleStyle(radius, color),
    createInnerCircleStyle(radius),
    createLeftDecoration(radius),
    createRightDecoration(radius),
    createBottomTriangleIndicator(color),
    createIconStyle(imagePath, radius, optimalScale),
  ];

  // 电线杆范围现在使用独立的层，不再在标点样式中添加
  return styles;
}

/**
 * 创建外层圆形样式
 * @param radius 半径
 * @param color 颜色
 */
export function createOuterCircleStyle(radius: number, color: string): Style {
  return new Style({
    image: new CircleStyle({
      radius: radius + 2,
      fill: new Fill({ color: 'transparent' }),
      stroke: new Stroke({ color, width: DEFAULT_STROKE_WIDTH }),
      displacement: [0, radius + 6],
    }),
  });
}

/**
 * 创建内层圆形样式
 * @param radius 半径
 */
export function createInnerCircleStyle(radius: number): Style {
  return new Style({
    image: new CircleStyle({
      radius,
      fill: new Fill({ color: DEFAULT_BACKGROUND_COLOR }),
      stroke: new Stroke({
        color: DEFAULT_STROKE_COLOR,
        width: DEFAULT_STROKE_WIDTH + 0.5,
      }),
      displacement: [0, radius + 6],
    }),
  });
}

/**
 * 创建左侧装饰样式
 * @param radius 半径
 */
export function createLeftDecoration(radius: number): Style {
  return new Style({
    image: new RegularShape({
      points: 3,
      radius: radius * 0.35,
      angle: 0.5 * Math.PI,
      fill: new Fill({ color: DEFAULT_STROKE_COLOR }),
      displacement: [-radius + radius * 0.2, radius + 6],
      rotation: 0,
    }),
  });
}

/**
 * 创建右侧装饰样式
 * @param radius 半径
 */
export function createRightDecoration(radius: number): Style {
  return new Style({
    image: new RegularShape({
      points: 3,
      radius: radius * 0.35,
      angle: -0.5 * Math.PI,
      fill: new Fill({ color: DEFAULT_STROKE_COLOR }),
      displacement: [radius - radius * 0.2, radius + 6],
      rotation: 0,
    }),
  });
}

/**
 * 创建底部三角指示器
 * @param color 颜色
 */
export function createBottomTriangleIndicator(color: string): Style {
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
 * 创建模糊阴影的SVG字符串
 * @param radius 半径
 * @param blurAmount 模糊程度
 * @param color 阴影颜色
 * @returns SVG字符串
 */
function createShadowSVG(
  radius: number,
  blurAmount: number = 3,
  color: string = 'rgba(0,0,0,0.5)'
): string {
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
export function createBlurredShadowStyles(radius: number): Style[] {
  const shadowSVG = createShadowSVG(radius, 2, 'rgba(0,0,0,0.4)');
  const svgUrl =
    'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(shadowSVG);

  return [
    new Style({
      image: new Icon({
        src: svgUrl,
        scale: 1,
        displacement: [0, radius],
      }),
    }),
  ];
}

/**
 * 创建图标样式
 * @param imagePath 图片路径
 * @param radius 半径
 * @param optimalScale 最佳缩放比例
 */
export function createIconStyle(
  imagePath: string,
  radius: number,
  optimalScale: number
): Style {
  return new Style({
    image: new Icon({
      src: imagePath,
      scale: optimalScale,
      anchor: [0.5, 0.5],
      displacement: [0, radius + 6],
    }),
  });
}

/**
 * 创建聚合样式
 * @param radius 半径
 * @param size 数量
 */
export function createClusterStyle(radius: number, size: number): Style {
  return new Style({
    image: new CircleStyle({
      radius: radius * 0.4,
      fill: new Fill({ color: DEFAULT_STROKE_COLOR }),
      displacement: [0, radius / 2 + 3],
    }),
    text: new Text({
      text: size.toString(),
      fill: new Fill({ color: '#fff' }),
      font: '8px "Noto Sans SC"',
      offsetY: -11,
      stroke: new Stroke({ color: '#000', width: 2 }),
    }),
  });
}

/**
 * 创建聚合样式函数
 * @param entityType 实体类型
 * @returns 聚合样式函数
 */
export function createClusterStyleFunction(entityType: string): (feature: Feature) => Style | Style[] | undefined {
  return (feature: Feature): Style | Style[] | undefined => {
    const store = getStore();
    const featuresArray = feature.get('features') as Feature[];
    const size = featuresArray?.length || 0;
    const styleKey = `${entityType}-${size}`;

    // 检查是否需要特殊渲染状态
    let selectionStatus: 'none' | 'partial' | 'all' = 'none';
    let needsOpacity = false;

    // 计算选择状态
    if (size > 0) {
      selectionStatus = calculateSelectionStatus(featuresArray);
    }

    // 计算不透明度状态
    if (currentMarkFilter.value === 'all') {
      needsOpacity = calculateOpacityStatus(featuresArray, size);
    }

    // 构建最终的样式缓存键
    const finalStyleKey = needsOpacity ? `${styleKey}-opacity` : styleKey;

    // 检查缓存中是否已有样式
    const cachedBaseStyleEntry = store.styleCache[finalStyleKey];
    if (cachedBaseStyleEntry) {
      // 直接使用缓存的样式，并添加选择状态样式
      return applySelectionStatus(cachedBaseStyleEntry.style, selectionStatus);
    }

    // 缓存中没有找到样式
    if (!store.styleCache[styleKey]) {
      // 基础样式不存在，异步创建
      createCircleIconStyle(entityType, size).then(baseStyle => {
        // 保存原始样式
        addStyleToCache(styleKey, { style: baseStyle });

        // 如果需要不透明度，创建并缓存不透明度版本
        if (needsOpacity) {
          const opacityStyles = applyOpacityToStyles(baseStyle);
          addStyleToCache(`${styleKey}-opacity`, { style: opacityStyles });
        }

        // 请求重绘
        feature.changed();
      });

      // 返回临时空样式
      return new Style({});
    } else if (needsOpacity && !store.styleCache[finalStyleKey]) {
      // 基础样式存在但不透明度版本不存在
      const baseStyle = store.styleCache[styleKey].style;
      const opacityStyles = applyOpacityToStyles(baseStyle);
      addStyleToCache(finalStyleKey, { style: opacityStyles });

      // 添加选择样式
      return applySelectionStatus(opacityStyles, selectionStatus);
    }

    // 不应该到达这里，返回默认样式防止未定义
    return new Style({});
  };
}

/**
 * 计算选择状态
 * @param featuresArray 特征数组
 * @returns 选择状态
 */
function calculateSelectionStatus(
  featuresArray: Feature[]
): 'none' | 'partial' | 'all' {
  // 从外部模块导入，避免循环依赖

  if (!isMultiSelecting.value || multiSelectMarks.value.length === 0) {
    return 'none';
  }

  let selectedCount = 0;
  for (let i = 0; i < featuresArray.length; i++) {
    const payload = featuresArray[i].get('payload');
    if (
      payload?.levelLogicId &&
      multiSelectMarks.value.includes(payload.levelLogicId)
    ) {
      selectedCount++;
    }
  }

  if (selectedCount === featuresArray.length) {
    return 'all';
  } else if (selectedCount > 0) {
    return 'partial';
  }
  return 'none';
}

/**
 * 计算不透明度状态
 * @param featuresArray 特征数组
 * @param size 数量
 * @returns 是否需要不透明度
 */
function calculateOpacityStatus(
  featuresArray: Feature[],
  size: number
): boolean {
  if (size === 1) {
    // 单个标点的情况
    const payload = featuresArray[0].get('payload');
    return payload?.levelLogicId ? isMarked(payload.levelLogicId) : false;
  } else if (size > 1) {
    // 聚合标点的情况，只有全部标记才需要不透明度
    for (let i = 0; i < featuresArray.length; i++) {
      const payload = featuresArray[i].get('payload');
      if (!(payload?.levelLogicId && isMarked(payload.levelLogicId))) {
        return false;
      }
    }
    return true;
  }
  return false;
}

/**
 * 应用选择状态
 * @param style 样式
 * @param status 状态
 * @returns 样式数组
 */
function applySelectionStatus(
  style: Style | Style[],
  status: 'none' | 'partial' | 'all'
): Style[] {
  const finalStyles = Array.isArray(style) ? style : [style];
  if (status === 'all') {
    return [...finalStyles, selectionStyle];
  } else if (status === 'partial') {
    return [...finalStyles, partialSelectionStyle];
  }
  return finalStyles;
}

/**
 * 应用不透明度到样式
 * @param styles 样式
 * @returns 样式数组
 */
export function applyOpacityToStyles(styles: Style | Style[]): Style[] {
  const styleArray = Array.isArray(styles) ? styles : [styles];
  return styleArray.map(style => {
    const clonedStyle = style.clone();

    // 应用到图像
    const image = clonedStyle.getImage();
    if (image) {
      image.setOpacity(FINISHED_OPACITY);

      // 处理特殊形状
      if (image instanceof CircleStyle || image instanceof RegularShape) {
        applyOpacityToFillAndStroke(image.getFill(), image.getStroke());
      }
    }

    // 应用到文本
    const text = clonedStyle.getText();
    if (text) {
      applyOpacityToFillAndStroke(text.getFill(), text.getStroke());
    }

    return clonedStyle;
  });
}

/**
 * 应用不透明度到填充和描边
 * @param fill 填充
 * @param stroke 描边
 */
export function applyOpacityToFillAndStroke(
  fill: Fill | null,
  stroke: Stroke | null
): void {
  if (fill) {
    const color = fill.getColor();
    if (typeof color === 'string' || Array.isArray(color)) {
      const rgbaColor = asArray(color).slice();
      rgbaColor[3] = (rgbaColor[3] ?? 1) * FINISHED_OPACITY;
      fill.setColor(rgbaColor);
    }
  }

  if (stroke) {
    const color = stroke.getColor();
    if (typeof color === 'string' || Array.isArray(color)) {
      const rgbaColor = asArray(color).slice();
      rgbaColor[3] = (rgbaColor[3] ?? 1) * FINISHED_OPACITY;
      stroke.setColor(rgbaColor);
    }
  }
}
