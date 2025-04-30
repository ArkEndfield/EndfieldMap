import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorSource from 'ol/source/Vector';
import WebGLVectorLayer from 'ol/layer/WebGLVector';
import VectorLayer from 'ol/layer/Vector';
import Cluster from 'ol/source/Cluster';
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

import { debounce, xyz2crd } from '@/utils/common';
import { customPointTypes, entityInfo, entityShowStates } from '@/data/entity';
import { PointData } from '@/types/points';
import settings from '@/data/settings';
import {
  calculateOptimalScale,
  getColorForEntity,
  getImageSize,
} from '@/utils/render';
import { currentMarkFilter } from '@/data/marks';
import { shouldShowByMarkStatus, isMarked } from './marks';
import { isMultiSelecting, multiSelectMarks } from '@/data/marks';
import { isCustomPointType } from './customPoints';

// 样式缓存类型
interface StyleCacheEntry {
  style: Style | Style[];
  needsUpdate?: boolean;
}

// 常量定义
// 样式缓存清理时间
const CACHE_CLEANUP_TIMEOUT = 5 * 60 * 1000; // 5分钟
// 默认圆形标点半径
const DEFAULT_RADIUS = 15;
// 默认描边宽度
const DEFAULT_STROKE_WIDTH = 2;
// 默认背景颜色
const DEFAULT_BACKGROUND_COLOR = '#525152';
// 默认描边颜色
const DEFAULT_STROKE_COLOR = '#2E2F2E';
// 完成状态透明度
const FINISHED_OPACITY = 0.5;
// 记录是否聚合状态（后续用于对比是否刷新）
let isCluster = true;

// 选中样式，当开启批量操作时，选中标点的描边（当为聚合时，聚合标点(内全选)的描边）
const selectionStyle = new Style({
  image: new CircleStyle({
    radius: DEFAULT_RADIUS + 6,
    stroke: new Stroke({
      color: 'rgba(255, 255, 0, 0.8)',
      width: 4,
    }),
  }),
  zIndex: 1,
});

// 部分选中样式（聚合时，聚合标点(内非全选)的描边）
const partialSelectionStyle = new Style({
  image: new CircleStyle({
    radius: DEFAULT_RADIUS + 6,
    stroke: new Stroke({
      color: 'rgba(255, 255, 0, 0.4)',
      width: 4,
    }),
  }),
  zIndex: 1,
});

// 特征数据
const features: Feature<Point>[] = [];
// 特征数据Map
const itemMap: Record<number, Feature<Point>> = {};
// 实体组
const entityGroup: Record<
  string,
  {
    name: string;
    points: Feature<Point>[];
  }
> = {};

// 源数据管理
const source = new WebGLVectorLayer({
  source: new VectorSource<Feature<Point>>({
    features: [],
  }),
  style: {
    'circle-radius': 6,
    'circle-fill-color': '#3399CC',
    'circle-stroke-color': '#fff',
    'circle-stroke-width': 2,
  },
  disableHitDetection: false,
});

// 样式缓存和图层容器
const styleCache: { [key: string]: StyleCacheEntry } = {};
const entityClusterLayers: VectorLayer<any>[] = [];
const entityClusterSources: { [key: string]: Cluster } = {};

// 样式创建函数缓存
const iconStyleCache: { [key: string]: Promise<Style[] | Style> | undefined } =
  {};
const styleCacheCleanupTimers: { [key: string]: number } = {};

/**
 * 创建圆形标点样式
 * @param entityType 实体类型
 * @param size 标点数量
 * @returns 样式数组
 * @description 创建圆形标点样式
 */
async function createCircleIconStyle(
  entityType: string,
  size: number = 1
): Promise<Style[]> {
  const cacheKey = `${entityType}-${size}`;

  if (iconStyleCache[cacheKey] !== undefined) {
    // 清除之前的清理定时器
    if (styleCacheCleanupTimers[cacheKey]) {
      clearTimeout(styleCacheCleanupTimers[cacheKey]);
    }
    return iconStyleCache[cacheKey] as Promise<Style[]>;
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

  iconStyleCache[cacheKey] = stylePromise;
  setupCacheCleanup(stylePromise, cacheKey);

  return stylePromise;
}

/**
 * 创建基础样式
 * @param radius 半径
 * @param color 颜色
 * @param imagePath 图片路径
 * @param optimalScale 最佳缩放比例
 * @description 创建基础样式，用于创建圆形标点样式
 */
function createBaseStyles(
  radius: number,
  color: string,
  imagePath: string,
  optimalScale: number
): Style[] {
  return [
    createOuterCircleStyle(radius, color),
    createInnerCircleStyle(radius),
    createLeftDecoration(radius),
    createRightDecoration(radius),
    createBottomTriangleIndicator(color),
    createIconStyle(imagePath, radius, optimalScale),
  ];
}

/**
 * 创建外层圆形样式
 * @param radius 半径
 * @param color 颜色
 * @description 创建外层圆形样式
 */
function createOuterCircleStyle(radius: number, color: string): Style {
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
 * @description 创建内层圆形样式
 */
function createInnerCircleStyle(radius: number): Style {
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
 * @description 创建左侧装饰样式（三角形）
 */
function createLeftDecoration(radius: number): Style {
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
 * @description 创建右侧装饰样式（三角形）
 */
function createRightDecoration(radius: number): Style {
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
 *
 * @param color
 * @returns
 */
function createBottomTriangleIndicator(color: string): Style {
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
 * 创建图标样式
 * @param imagePath 图片路径
 * @param radius 半径
 * @param optimalScale 最佳缩放比例
 * @description 创建图标样式
 */
function createIconStyle(
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
 * @description 创建聚合样式
 */
function createClusterStyle(radius: number, size: number): Style {
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
 * 设置样式缓存清理
 * @param promise 承诺
 * @param cacheKey 缓存键
 * @description 设置样式缓存清理
 */
function setupCacheCleanup(promise: Promise<any>, cacheKey: string): void {
  promise.finally(() => {
    // 清除之前的清理定时器
    if (styleCacheCleanupTimers[cacheKey]) {
      clearTimeout(styleCacheCleanupTimers[cacheKey]);
    }

    // 设置新的清理定时器
    styleCacheCleanupTimers[cacheKey] = window.setTimeout(() => {
      delete iconStyleCache[cacheKey];
      delete styleCacheCleanupTimers[cacheKey];
    }, CACHE_CLEANUP_TIMEOUT);
  });
}

/**
 * 创建标记
 * @param entry 点数据
 * @returns 特征点
 * @description 创建标记
 */
export const marker = (entry: PointData): Feature<Point> | undefined => {
  const info = entityInfo[entry.entityDataIdKey];
  if (!info) return undefined;

  const feature = new Feature({
    geometry: new Point(xyz2crd(entry.position)),
    payload: entry,
  });

  const entityType = entry.entityDataIdKey;
  if (!entityGroup[entityType]) {
    entityGroup[entityType] = {
      name: info.entityInfo.name,
      points: [],
    };
  }
  entityGroup[entityType].points.push(feature);

  return feature;
};

/**
 * 创建聚合图层
 * @returns 聚合图层
 * @description 创建聚合图层
 */
export const createEntityClusterLayers = (): VectorLayer<any>[] => {
  entityClusterLayers.length = 0;
  const featuresByType = groupFeaturesByType();

  // 确保自定义标点类型总是有图层
  ensureCustomPointLayers(featuresByType);

  // 为每种类型创建聚合源和图层
  Object.entries(featuresByType).forEach(([entityType, typeFeatures]) => {
    createClusterLayerForType(entityType, typeFeatures);
  });

  return entityClusterLayers;
};

/**
 * 按类型分组特征
 * @returns 按类型分组特征
 * @description 按类型分组特征
 */
function groupFeaturesByType(): Record<string, Feature<Point>[]> {
  const featuresByType: Record<string, Feature<Point>[]> = {};

  // 一次遍历完成分组
  for (let i = 0; i < features.length; i++) {
    const feature = features[i];
    const payload = feature.get('payload');
    const entityType = payload?.entityDataIdKey as string;

    if (!entityType) continue;

    const isCustomType = isCustomPointType(entityType);
    // 检查是否为自定义类型或者有数量
    if (isCustomType || entityInfo[entityType]?.entityInfo.count > 0) {
      if (!featuresByType[entityType]) {
        featuresByType[entityType] = [];
      }
      featuresByType[entityType].push(feature);
    }
  }

  return featuresByType;
}

/**
 * 确保自定义标点类型总是有图层
 * @param featuresByType 按类型分组特征
 * @description 确保自定义标点类型总是有图层
 */
function ensureCustomPointLayers(
  featuresByType: Record<string, Feature<Point>[]>
): void {
  customPointTypes.forEach(customType => {
    if (!featuresByType[customType] && entityInfo[customType]) {
      featuresByType[customType] = [];
    }
  });
}

/**
 * 为特定类型创建聚合图层
 * @param entityType 实体类型
 * @param typeFeatures 类型特征
 * @description 为特定类型创建聚合图层
 */
function createClusterLayerForType(
  entityType: string,
  typeFeatures: Feature<Point>[]
): void {
  const typeSource = new VectorSource({ features: typeFeatures });
  const clusterSource = new Cluster({
    distance: 20,
    source: typeSource,
    geometryFunction: feature => {
      const geometry = feature.getGeometry();
      if (geometry instanceof Point) {
        return geometry;
      }
      return null;
    },
  });

  entityClusterSources[entityType] = clusterSource;

  const layer = new VectorLayer({
    source: clusterSource,
    style: createClusterStyleFunction(entityType),
    zIndex: 10,
    visible: false,
    updateWhileAnimating: true,
    updateWhileInteracting: true,
  });

  entityClusterLayers.push(layer);
}

/**
 * 创建聚合样式函数
 * @param entityType 实体类型
 * @returns 聚合样式函数
 * @description 创建聚合样式函数
 */
function createClusterStyleFunction(entityType: string) {
  return (feature: Feature): Style | Style[] | undefined => {
    const featuresArray = feature.get('features') as Feature<Point>[];
    const size = featuresArray?.length || 0;
    const styleKey = `${entityType}-${size}`;

    // 检查是否需要特殊渲染状态
    let selectionStatus: 'none' | 'partial' | 'all' = 'none';
    let needsOpacity = false;

    // 计算选择状态
    if (
      size > 0 &&
      isMultiSelecting.value &&
      multiSelectMarks.value.length > 0
    ) {
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

      if (selectedCount === size) {
        selectionStatus = 'all';
      } else if (selectedCount > 0) {
        selectionStatus = 'partial';
      }
    }

    // 计算不透明度状态
    if (currentMarkFilter.value === 'all') {
      if (size === 1) {
        // 单个标点的情况
        const payload = featuresArray[0].get('payload');
        needsOpacity = payload?.levelLogicId
          ? isMarked(payload.levelLogicId)
          : false;
      } else if (size > 1) {
        // 聚合标点的情况，只有全部标记才需要不透明度
        needsOpacity = true;
        for (let i = 0; i < featuresArray.length; i++) {
          const payload = featuresArray[i].get('payload');
          if (!(payload?.levelLogicId && isMarked(payload.levelLogicId))) {
            needsOpacity = false;
            break;
          }
        }
      }
    }

    // 构建最终的样式缓存键
    const finalStyleKey = needsOpacity ? `${styleKey}-opacity` : styleKey;

    // 检查缓存中是否已有样式
    const cachedBaseStyleEntry = styleCache[finalStyleKey];
    if (cachedBaseStyleEntry) {
      // 直接使用缓存的样式，并添加选择状态样式
      const baseStyle = cachedBaseStyleEntry.style;
      const finalStyles = Array.isArray(baseStyle) ? baseStyle : [baseStyle];

      // 添加选择样式（这些样式是共享的，不需要克隆）
      if (selectionStatus === 'all') {
        return [...finalStyles, selectionStyle];
      } else if (selectionStatus === 'partial') {
        return [...finalStyles, partialSelectionStyle];
      }
      return finalStyles;
    }

    // 缓存中没有找到样式
    if (!styleCache[styleKey]) {
      // 基础样式不存在，异步创建
      createCircleIconStyle(entityType, size).then(baseStyle => {
        // 保存原始样式
        styleCache[styleKey] = { style: baseStyle };

        // 如果需要不透明度，创建并缓存不透明度版本
        if (needsOpacity) {
          const opacityStyles = applyOpacityToStyles(baseStyle);
          styleCache[`${styleKey}-opacity`] = { style: opacityStyles };
        }

        // 请求重绘
        feature.changed();
      });

      // 返回临时空样式
      return new Style({});
    } else if (needsOpacity && !styleCache[finalStyleKey]) {
      // 基础样式存在但不透明度版本不存在
      const baseStyle = styleCache[styleKey].style;
      const opacityStyles = applyOpacityToStyles(baseStyle);
      styleCache[finalStyleKey] = { style: opacityStyles };

      // 添加选择样式
      if (selectionStatus === 'all') {
        return [...opacityStyles, selectionStyle];
      } else if (selectionStatus === 'partial') {
        return [...opacityStyles, partialSelectionStyle];
      }
      return opacityStyles;
    }

    // 不应该到达这里，返回默认样式防止未定义
    return new Style({});
  };
}

/**
 * 应用不透明度到样式（避免重复代码）
 * @param styles 样式
 * @returns 样式数组
 * @description 应用不透明度到样式（避免重复代码）
 */
function applyOpacityToStyles(styles: Style | Style[]): Style[] {
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
 * @description 应用不透明度到填充和描边
 */
function applyOpacityToFillAndStroke(
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

/**
 * 优化聚合距离更新函数
 * @param zoom 缩放
 * @description 优化聚合距离更新函数
 */
export const updateClusterDistance = debounce(
  (zoom: number): void => {
    const shouldCluster = settings.value.isClusteringEnabled && zoom < 4;
    const newDistance = shouldCluster ? 30 : 0;

    const currentSources = Object.values(entityClusterSources);
    if (currentSources.length === 0) {
      console.log('聚合源尚未初始化，跳过更新');
      return;
    }

    const currentDistance = currentSources[0].getDistance();
    if (
      (shouldCluster && currentDistance === 0) ||
      (!shouldCluster && currentDistance > 0) ||
      isCluster !== shouldCluster
    ) {
      console.log(`聚合状态变化：${currentDistance} -> ${newDistance}`);
      isCluster = shouldCluster;
      updateAllClusterDistances(newDistance);
    }
  },
  100,
  { leading: false, trailing: true }
);

/**
 * 更新所有聚合距离
 * @param distance 距离
 * @description 更新所有聚合距离
 */
function updateAllClusterDistances(distance: number): void {
  Object.values(entityClusterSources).forEach(source => {
    source.setDistance(distance);
    source.refresh();
  });
}

/**
 * 刷新聚合
 * @description 刷新聚合
 */
function refreshCluster(): void {
  Object.values(entityClusterSources).forEach(source => {
    source.refresh();
  });
}

/**
 * 创建自定义标点标记
 * @param point 点数据
 * @returns 特征点
 * @description 创建自定义标点标记
 */
export function createCustomPointMarker(
  point: PointData
): Feature<Point> | null {
  const feature = marker(point);
  if (!feature) return null;

  features.push(feature);
  itemMap[point.levelLogicId] = feature;

  const vectorSource = source.getSource();
  if (vectorSource && vectorSource instanceof VectorSource) {
    vectorSource.addFeature(feature);
  } else {
    console.error('source.getSource() is not an instance of VectorSource');
  }

  return feature;
}

/**
 * 删除自定义标点标记
 * @param levelLogicId 逻辑ID
 * @description 删除自定义标点标记
 */
export function removeCustomPointMarker(levelLogicId: string | number): void {
  // 如果itemMap已经有对应的feature，直接使用
  const featureFromMap = itemMap[levelLogicId];
  const toRemove: Feature<Point>[] = [];

  if (featureFromMap) {
    // 已有缓存，直接使用
    toRemove.push(featureFromMap);
  } else {
    // 没有缓存，需要查找
    toRemove.push(
      ...features.filter(f => f.get('payload')?.levelLogicId === levelLogicId)
    );
  }

  if (toRemove.length === 0) return;

  const vectorSource = source.getSource();
  toRemove.forEach(feature => {
    // 从 features 数组移除
    const idx = features.indexOf(feature);
    if (idx !== -1) features.splice(idx, 1);
    // 从 VectorSource 移除
    if (vectorSource && vectorSource instanceof VectorSource) {
      vectorSource.removeFeature(feature);
    }
  });

  // 从 itemMap 移除
  delete itemMap[levelLogicId];
}

/**
 * 更新自定义标点标记
 * @param levelLogicId 逻辑ID
 * @param point 点数据
 * @description 更新自定义标点标记
 */
export function updateCustomPointMarker(
  levelLogicId: string | number,
  point: PointData
): void {
  removeCustomPointMarker(levelLogicId);
  createCustomPointMarker(point);
}

/**
 * 刷新地图
 * @description 刷新地图
 */
export function refreshMap(): void {
  if (Object.keys(entityClusterSources).length === 0) {
    createEntityClusterLayers();
  }

  const entityTypes = Object.keys(entityInfo);

  // 预先创建一个图层查找映射，减少嵌套循环中的查找
  const layerBySourceMap = new Map();
  for (let i = 0; i < entityClusterLayers.length; i++) {
    const layer = entityClusterLayers[i];
    const source = layer.getSource();
    if (source) {
      layerBySourceMap.set(source, layer);
    }
  }

  // 使用分批处理来更新图层可见性
  const batchSize = 5; // 每批处理5个实体类型
  const totalEntities = entityTypes.length;

  const processBatch = (startIndex: number) => {
    const endIndex = Math.min(startIndex + batchSize, totalEntities);
    const currentBatch = entityTypes.slice(startIndex, endIndex);

    // 处理当前批次的实体类型
    for (let i = 0; i < currentBatch.length; i++) {
      const key = currentBatch[i];
      const source = entityClusterSources[key];
      if (!source) continue;

      const layer = layerBySourceMap.get(source);
      if (!layer) continue;

      const shouldShowEntityType = entityShowStates[key];
      layer.setVisible(shouldShowEntityType);

      if (shouldShowEntityType) {
        updateSourceFeatures(source, key);
      }
    }

    // 如果还有剩余实体类型，继续处理下一批
    if (endIndex < totalEntities) {
      setTimeout(() => {
        processBatch(endIndex);
      }, 0);
    } else {
      // 所有实体类型处理完成，刷新聚合
      setTimeout(() => {
        refreshCluster();
      }, 0);
    }
  };

  // 开始分批处理
  processBatch(0);
}

/**
 * 更新源特征
 * @param source 源
 * @param entityType 实体类型
 * @description 更新源特征
 */
function updateSourceFeatures(source: Cluster, entityType: string): void {
  const vectorSource = source.getSource();
  if (!vectorSource) return;

  vectorSource.clear();

  // 过滤符合当前实体类型的特征
  let typeFeatures = features.filter(f => {
    const payload = f.get('payload');
    return payload?.entityDataIdKey === entityType;
  });

  // 标记过滤处理
  if (currentMarkFilter.value !== 'all') {
    // 创建一个Set或Map用于快速查找，而不是重复过滤
    const validFeaturesMap = new Map<Feature<Point>, boolean>();

    for (let i = 0; i < typeFeatures.length; i++) {
      const feature = typeFeatures[i];
      const payload = feature.get('payload');
      if (shouldShowByMarkStatus(payload?.levelLogicId)) {
        validFeaturesMap.set(feature, true);
      }
    }

    // 使用过滤后的Map重建特征数组
    typeFeatures = Array.from(validFeaturesMap.keys());
  }

  // 批量添加特征，减少单独添加的次数
  if (typeFeatures.length > 0) {
    vectorSource.addFeatures(typeFeatures);
    source.refresh();
  }
}

/**
 * 清理自定义标点相关内容
 * @param types 类型
 * @description 清理自定义标点相关内容
 */
export function clearCustomPointsOnMap(types = customPointTypes) {
  // 使用一个Set来存储类型以便快速查找
  const typeSet = new Set(types);

  // 收集要删除的features
  const featuresToRemove: Feature<Point>[] = [];
  const logicIdsToRemove: (string | number)[] = [];

  // 按类型筛选要删除的特征
  for (let i = 0; i < features.length; i++) {
    const feature = features[i];
    const payload = feature.get('payload');
    const entityType = payload?.entityDataIdKey;

    if (entityType && typeSet.has(entityType)) {
      featuresToRemove.push(feature);
      if (payload.levelLogicId) {
        logicIdsToRemove.push(payload.levelLogicId);
      }
    }
  }

  // 批量删除特征
  featuresToRemove.forEach(feature => {
    removeCustomPointMarker(feature.get('payload').levelLogicId);
  });

  // 清理entityGroup
  types.forEach(type => {
    if (entityGroup[type]) entityGroup[type].points = [];
  });
}

/**
 * 重置所有实体类型的计数
 * @description 重置所有实体类型的计数
 */
export function resetEntityInfoCount() {
  Object.keys(entityInfo).forEach(key => {
    if (entityInfo[key]?.entityInfo) entityInfo[key].entityInfo.count = 0;
  });
}

/**
 * 根据点位更新实体类型计数
 * @param points 点位
 * @description 根据点位更新实体类型计数
 */
export function updateEntityInfoCount(points: PointData[]) {
  // 创建临时计数对象，避免频繁更新entityInfo
  const countMap: Record<string, number> = {};

  // 统计每种类型的数量
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const type = point.entityDataIdKey;

    if (entityInfo[type]?.entityInfo) {
      countMap[type] = (countMap[type] || 0) + 1;
    }
  }

  // 一次性更新entityInfo
  Object.entries(countMap).forEach(([type, count]) => {
    if (entityInfo[type]?.entityInfo) {
      entityInfo[type].entityInfo.count += count;
    }
  });
}

/**
 * 导出操作函数
 * @description 导出操作函数
 */
export const getFeatures = () => [...features];
export const getItemMap = () => ({ ...itemMap });
export const getEntityGroup = () => ({ ...entityGroup });
export const getSource = () => source;
export const getStyleCache = () => ({ ...styleCache });
export const getEntityClusterLayers = () => [...entityClusterLayers];
export const getEntityClusterSources = () => ({ ...entityClusterSources });

/**
 * 添加特征
 * @param feature 特征
 * @description 添加特征
 */
export const addFeature = (feature: Feature<Point>) => {
  features.push(feature);
};

/**
 * 添加特征到itemMap
 * @param id 逻辑ID
 * @param feature 特征
 * @description 添加特征到itemMap
 */
export const addFeatureToItemMap = (id: number, feature: Feature<Point>) => {
  itemMap[id] = feature;
};

/**
 * 从itemMap中移除特征
 * @param id 逻辑ID
 * @description 从itemMap中移除特征
 */
export const removeFeatureFromItemMap = (id: number) => {
  delete itemMap[id];
};

/**
 * 添加特征到实体组
 * @param entityType 实体类型
 * @param feature 特征
 * @description 添加特征到实体组
 */
export const addFeatureToEntityGroup = (
  entityType: string,
  feature: Feature<Point>
) => {
  if (!entityGroup[entityType]) {
    entityGroup[entityType] = {
      name: entityInfo[entityType]?.entityInfo.name || '',
      points: [],
    };
  }
  entityGroup[entityType].points.push(feature);
};

/**
 * 从实体组中移除特征
 * @param entityType 实体类型
 * @param feature 特征
 * @description 从实体组中移除特征
 */
export const removeFeatureFromEntityGroup = (
  entityType: string,
  feature: Feature<Point>
) => {
  if (entityGroup[entityType]) {
    const index = entityGroup[entityType].points.indexOf(feature);
    if (index !== -1) {
      entityGroup[entityType].points.splice(index, 1);
    }
  }
};

/**
 * 添加样式到缓存
 * @param key 键
 * @param style 样式
 * @description 添加样式到缓存
 */
export const addStyleToCache = (key: string, style: StyleCacheEntry) => {
  styleCache[key] = style;
};

/**
 * 从缓存中移除样式
 * @param key 键
 * @description 从缓存中移除样式
 */
export const removeStyleFromCache = (key: string) => {
  delete styleCache[key];
};

/**
 * 添加图层
 * @param layer 图层
 * @description 添加图层
 */
export const addEntityClusterLayer = (layer: VectorLayer<any>) => {
  entityClusterLayers.push(layer);
};

/**
 * 移除图层
 * @param layer 图层
 * @description 移除图层
 */
export const removeEntityClusterLayer = (layer: VectorLayer<any>) => {
  const index = entityClusterLayers.indexOf(layer);
  if (index !== -1) {
    entityClusterLayers.splice(index, 1);
  }
};

/**
 * 添加聚合源
 * @param key 键
 * @param source 源
 * @description 添加聚合源
 */
export const addEntityClusterSource = (key: string, source: Cluster) => {
  entityClusterSources[key] = source;
};

/**
 * 移除聚合源
 * @param key 键
 * @description 移除聚合源
 */
export const removeEntityClusterSource = (key: string) => {
  delete entityClusterSources[key];
};

/**
 * 优化清空所有数据函数
 * @description 优化清空所有数据函数
 */
export const clearAllData = () => {
  // 清除所有定时器
  Object.values(styleCacheCleanupTimers).forEach(clearTimeout);

  // 先清空图层和源
  for (let i = 0; i < entityClusterLayers.length; i++) {
    const layer = entityClusterLayers[i];
    const source = layer.getSource();
    if (source) {
      source.getSource()?.clear();
    }
  }

  // 然后一次性清空主源
  const vectorSource = source.getSource();
  if (vectorSource) {
    vectorSource.clear();
  }

  // 最后批量清空所有缓存对象
  // 使用Object.keys一次性获取键列表，减少重复遍历
  const iconStyleKeys = Object.keys(iconStyleCache);
  const timerKeys = Object.keys(styleCacheCleanupTimers);
  const styleCacheKeys = Object.keys(styleCache);
  const itemMapKeys = Object.keys(itemMap);
  const entityGroupKeys = Object.keys(entityGroup);
  const entityClusterSourceKeys = Object.keys(entityClusterSources);

  // 清空各缓存对象
  iconStyleKeys.forEach(key => delete iconStyleCache[key]);
  timerKeys.forEach(key => delete styleCacheCleanupTimers[key]);
  styleCacheKeys.forEach(key => delete styleCache[key]);
  itemMapKeys.forEach(key => delete itemMap[key]);
  entityGroupKeys.forEach(key => delete entityGroup[key]);
  entityClusterSourceKeys.forEach(key => delete entityClusterSources[key]);

  // 清空数组
  features.length = 0;
  entityClusterLayers.length = 0;
};
