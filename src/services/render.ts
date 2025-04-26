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
import { entityInfo, entityShowStates } from '@/data/entity';
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

// 样式缓存类型
interface StyleCacheEntry {
  style: Style | Style[];
  needsUpdate?: boolean;
}

// 常量定义
const CACHE_CLEANUP_TIMEOUT = 300000; // 5分钟
const DEFAULT_RADIUS = 15;
const DEFAULT_STROKE_WIDTH = 2;
const DEFAULT_BACKGROUND_COLOR = '#525152';
const DEFAULT_STROKE_COLOR = '#2E2F2E';
const FINISHED_OPACITY = 0.5;

let isCluster = true;

// 选中样式
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

// 部分选中样式
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

// 这些变量从data/entity.ts中提取
const features: Feature<Point>[] = [];
const itemMap: Record<number, Feature<Point>> = {};
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

// 优化样式创建函数
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

// 提取样式创建辅助函数
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
    createIconStyle(imagePath, optimalScale),
  ];
}

function createOuterCircleStyle(radius: number, color: string): Style {
  return new Style({
    image: new CircleStyle({
      radius: radius + 2,
      fill: new Fill({ color: 'transparent' }),
      stroke: new Stroke({ color, width: DEFAULT_STROKE_WIDTH }),
    }),
  });
}

function createInnerCircleStyle(radius: number): Style {
  return new Style({
    image: new CircleStyle({
      radius,
      fill: new Fill({ color: DEFAULT_BACKGROUND_COLOR }),
      stroke: new Stroke({
        color: DEFAULT_STROKE_COLOR,
        width: DEFAULT_STROKE_WIDTH + 0.5,
      }),
    }),
  });
}

function createLeftDecoration(radius: number): Style {
  return new Style({
    image: new RegularShape({
      points: 3,
      radius: radius * 0.35,
      angle: 0.5 * Math.PI,
      fill: new Fill({ color: DEFAULT_STROKE_COLOR }),
      displacement: [-radius + radius * 0.2, 0],
      rotation: 0,
    }),
  });
}

function createRightDecoration(radius: number): Style {
  return new Style({
    image: new RegularShape({
      points: 3,
      radius: radius * 0.35,
      angle: -0.5 * Math.PI,
      fill: new Fill({ color: DEFAULT_STROKE_COLOR }),
      displacement: [radius - radius * 0.2, 0],
      rotation: 0,
    }),
  });
}

function createIconStyle(imagePath: string, optimalScale: number): Style {
  return new Style({
    image: new Icon({
      src: imagePath,
      scale: optimalScale,
      anchor: [0.5, 0.5],
    }),
  });
}

function createClusterStyle(radius: number, size: number): Style {
  return new Style({
    image: new CircleStyle({
      radius: radius * 0.4,
      fill: new Fill({ color: DEFAULT_STROKE_COLOR }),
      displacement: [0, -radius + 5],
    }),
    text: new Text({
      text: size.toString(),
      fill: new Fill({ color: '#fff' }),
      font: '8px "Noto Sans SC"',
      offsetY: radius - 5,
      stroke: new Stroke({ color: '#000', width: 2 }),
    }),
  });
}

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

// 优化标记创建函数
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

// 优化聚合图层创建函数
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

// 辅助函数：按类型分组特征
function groupFeaturesByType(): Record<string, Feature<Point>[]> {
  const featuresByType: Record<string, Feature<Point>[]> = {};

  features.forEach(feature => {
    const entityType = feature.get('payload')?.entityDataIdKey;
    if (!entityType) return;

    const isCustomType = ['custom', 'custom1', 'custom2'].includes(entityType);
    if (isCustomType || entityInfo[entityType]?.entityInfo.count > 0) {
      if (!featuresByType[entityType]) {
        featuresByType[entityType] = [];
      }
      featuresByType[entityType].push(feature);
    }
  });

  return featuresByType;
}

// 辅助函数：确保自定义标点类型有图层
function ensureCustomPointLayers(
  featuresByType: Record<string, Feature<Point>[]>
): void {
  ['custom', 'custom1', 'custom2'].forEach(customType => {
    if (!featuresByType[customType] && entityInfo[customType]) {
      featuresByType[customType] = [];
    }
  });
}

// 辅助函数：为特定类型创建聚合图层
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

// 辅助函数：创建聚合样式函数
function createClusterStyleFunction(entityType: string) {
  return (feature: Feature): Style | Style[] | undefined => {
    const featuresArray = feature.get('features') as Feature<Point>[];
    const size = featuresArray?.length || 0;
    const styleKey = `${entityType}-${size}`;

    let selectionStatus: 'none' | 'partial' | 'all' = 'none';

    if (
      size > 0 &&
      isMultiSelecting.value &&
      multiSelectMarks.value.length > 0
    ) {
      const selectedCount = featuresArray.reduce((count, f) => {
        const payload = f.get('payload');
        if (
          payload?.levelLogicId &&
          multiSelectMarks.value.includes(payload.levelLogicId)
        ) {
          return count + 1;
        }
        return count;
      }, 0);

      if (selectedCount === size) {
        selectionStatus = 'all';
      } else if (selectedCount > 0) {
        selectionStatus = 'partial';
      }
    }

    const cachedBaseStyleEntry = styleCache[styleKey];

    if (!cachedBaseStyleEntry) {
      createCircleIconStyle(entityType, size).then(baseStyle => {
        styleCache[styleKey] = { style: baseStyle };
        feature.changed(); // 请求重绘以应用新加载的样式
      });
      // 返回一个临时的空样式，或者你可以提供一个默认的基础样式
      return new Style({});
    } else {
      const baseStyle = cachedBaseStyleEntry.style;
      // Always work with an array, potentially adding selection styles later
      let finalStyles = Array.isArray(baseStyle) ? [...baseStyle] : [baseStyle];

      // --- Start: Apply Opacity for Finished Items in 'all' filter mode ---
      if (currentMarkFilter.value === 'all') {
        // 检查是否应用透明度
        let shouldApplyOpacity = false;

        if (size === 1) {
          // 单个标点的情况，直接检查其标记状态
          const singleFeature = featuresArray[0];
          const payload = singleFeature.get('payload');
          shouldApplyOpacity = payload?.levelLogicId
            ? isMarked(payload.levelLogicId)
            : false;
        } else if (size > 1) {
          // 聚合标点的情况，检查所有内部标点的标记状态
          // 只有当全部标点都已标记完成时，聚合标点才应用透明度
          shouldApplyOpacity = featuresArray.every(feature => {
            const payload = feature.get('payload');
            return payload?.levelLogicId
              ? isMarked(payload.levelLogicId)
              : false;
          });
        }

        if (shouldApplyOpacity) {
          // Apply opacity to a *copy* of the styles to avoid modifying the cache
          finalStyles = finalStyles.map(style => {
            const clonedStyle = style.clone(); // Clone the style

            // Apply opacity to image (icon and shapes)
            const image = clonedStyle.getImage();
            if (image) {
              // 直接对所有图像类型设置整体透明度
              image.setOpacity(FINISHED_OPACITY);

              // 对于圆形和规则形状，还需要设置填充和描边的透明度
              if (
                image instanceof CircleStyle ||
                image instanceof RegularShape
              ) {
                const fill = image.getFill();
                if (fill) {
                  const color = fill.getColor();
                  // Check if color is string or array before processing
                  if (typeof color === 'string' || Array.isArray(color)) {
                    const rgbaColor = asArray(color).slice(); // Use slice to copy
                    rgbaColor[3] = (rgbaColor[3] ?? 1) * FINISHED_OPACITY;
                    fill.setColor(rgbaColor); // This should now be type-safe
                  } else if (color) {
                    // Handle unexpected color types (Pattern/Gradient) if necessary, or log a warning
                    console.warn(
                      'Unexpected fill color type for shape:',
                      color
                    );
                  }
                }
                const stroke = image.getStroke();
                if (stroke) {
                  const color = stroke.getColor();
                  // Check if color is string or array before processing
                  if (typeof color === 'string' || Array.isArray(color)) {
                    const rgbaColor = asArray(color).slice(); // Use slice to copy
                    rgbaColor[3] = (rgbaColor[3] ?? 1) * FINISHED_OPACITY;
                    stroke.setColor(rgbaColor); // This should now be type-safe
                  } else if (color) {
                    // Handle unexpected color types (Pattern/Gradient) if necessary, or log a warning
                    console.warn(
                      'Unexpected stroke color type for shape:',
                      color
                    );
                  }
                }
              }
            }

            // Apply opacity to text (though unlikely for size === 1)
            const text = clonedStyle.getText();
            if (text) {
              // Text 类型没有 setOpacity 方法，只能通过修改填充和描边颜色来应用透明度

              const fill = text.getFill();
              if (fill) {
                const color = fill.getColor();
                // Check if color is string or array before processing
                if (typeof color === 'string' || Array.isArray(color)) {
                  const rgbaColor = asArray(color).slice(); // Use slice to copy
                  rgbaColor[3] = (rgbaColor[3] ?? 1) * FINISHED_OPACITY;
                  fill.setColor(rgbaColor); // This should now be type-safe
                } else if (color) {
                  // Handle unexpected color types (Pattern/Gradient) if necessary, or log a warning
                  console.warn('Unexpected fill color type for text:', color);
                }
              }
              const stroke = text.getStroke();
              if (stroke) {
                const color = stroke.getColor();
                // Check if color is string or array before processing
                if (typeof color === 'string' || Array.isArray(color)) {
                  const rgbaColor = asArray(color).slice(); // Use slice to copy
                  rgbaColor[3] = (rgbaColor[3] ?? 1) * FINISHED_OPACITY;
                  stroke.setColor(rgbaColor); // This should now be type-safe
                } else if (color) {
                  // Handle unexpected color types (Pattern/Gradient) if necessary, or log a warning
                  console.warn('Unexpected stroke color type for text:', color);
                }
              }
            }
            return clonedStyle;
          });
        }
      }
      // --- End: Apply Opacity ---

      // Apply selection styling *after* potential opacity modification
      if (selectionStatus === 'all') {
        // Ensure selectionStyle is distinct from potentially modified base styles
        return [...finalStyles, selectionStyle];
      } else if (selectionStatus === 'partial') {
        // Ensure partialSelectionStyle is distinct
        return [...finalStyles, partialSelectionStyle];
      } else {
        return finalStyles; // Return potentially opacity-modified styles
      }
    }
  };
}

// 优化聚合距离更新函数
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

function updateAllClusterDistances(distance: number): void {
  Object.values(entityClusterSources).forEach(source => {
    source.setDistance(distance);
    source.refresh();
  });
}

function refreshCluster(): void {
  Object.values(entityClusterSources).forEach(source => {
    source.refresh();
  });
}

// 优化自定义标点标记函数
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

// 优化删除自定义标点标记函数
export function removeCustomPointMarker(levelLogicId: string | number): void {
  const feature = itemMap[levelLogicId];
  if (!feature) return;

  const vectorSource = source.getSource();
  if (vectorSource && vectorSource instanceof VectorSource) {
    vectorSource.removeFeature(feature);
  } else {
    console.error('source.getSource() is not an instance of VectorSource');
  }

  delete itemMap[levelLogicId];
  removeFeatureFromArray(feature);
}

// 辅助函数：从数组中移除特征
function removeFeatureFromArray(feature: Feature<Point>): void {
  const index = features.findIndex(f => f === feature);
  if (index !== -1) {
    features.splice(index, 1);
  }
}

// 优化更新自定义标点标记函数
export function updateCustomPointMarker(
  levelLogicId: string | number,
  point: PointData
): void {
  removeCustomPointMarker(levelLogicId);
  createCustomPointMarker(point);
}

// 优化地图刷新函数
export function refreshMap(): void {
  if (Object.keys(entityClusterSources).length === 0) {
    createEntityClusterLayers();
  }

  const entityTypes = Object.keys(entityInfo);

  // 使用分批处理来更新图层可见性
  const batchSize = 5; // 每批处理5个实体类型
  const totalEntities = entityTypes.length;

  const processBatch = (startIndex: number) => {
    const endIndex = Math.min(startIndex + batchSize, totalEntities);
    const currentBatch = entityTypes.slice(startIndex, endIndex);

    // 处理当前批次的实体类型
    currentBatch.forEach(key => {
      const source = entityClusterSources[key];
      if (!source) return;

      const layer = entityClusterLayers.find(l => l.getSource() === source);
      if (!layer) return;

      const shouldShowEntityType = entityShowStates[key];
      layer.setVisible(shouldShowEntityType);

      if (shouldShowEntityType) {
        updateSourceFeatures(source, key);
      }
    });

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

function updateSourceFeatures(source: Cluster, entityType: string): void {
  const vectorSource = source.getSource();
  if (!vectorSource) return;

  vectorSource.clear();

  let typeFeatures = features.filter(f => {
    const payload = f.get('payload');
    return payload?.entityDataIdKey === entityType;
  });

  if (currentMarkFilter.value === 'all') {
    typeFeatures.forEach(f => {
      const payload = f.get('payload');
      if (payload?.levelLogicId) {
        // const marked = isMarked(payload.levelLogicId);
        // 设置透明度
        // console.log(marked);
      }
    });
  } else {
    typeFeatures = typeFeatures.filter(f => {
      const payload = f.get('payload');
      return shouldShowByMarkStatus(payload?.levelLogicId);
    });
  }

  if (typeFeatures.length > 0) {
    vectorSource.addFeatures(typeFeatures);
    source.refresh();
  }
}

// 导出操作函数
export const getFeatures = () => [...features];
export const getItemMap = () => ({ ...itemMap });
export const getEntityGroup = () => ({ ...entityGroup });
export const getSource = () => source;
export const getStyleCache = () => ({ ...styleCache });
export const getEntityClusterLayers = () => [...entityClusterLayers];
export const getEntityClusterSources = () => ({ ...entityClusterSources });

// 添加特征
export const addFeature = (feature: Feature<Point>) => {
  features.push(feature);
};

// 添加特征到itemMap
export const addFeatureToItemMap = (id: number, feature: Feature<Point>) => {
  itemMap[id] = feature;
};

// 从itemMap中移除特征
export const removeFeatureFromItemMap = (id: number) => {
  delete itemMap[id];
};

// 添加特征到实体组
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

// 从实体组中移除特征
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

// 添加样式到缓存
export const addStyleToCache = (key: string, style: StyleCacheEntry) => {
  styleCache[key] = style;
};

// 从缓存中移除样式
export const removeStyleFromCache = (key: string) => {
  delete styleCache[key];
};

// 添加图层
export const addEntityClusterLayer = (layer: VectorLayer<any>) => {
  entityClusterLayers.push(layer);
};

// 移除图层
export const removeEntityClusterLayer = (layer: VectorLayer<any>) => {
  const index = entityClusterLayers.indexOf(layer);
  if (index !== -1) {
    entityClusterLayers.splice(index, 1);
  }
};

// 添加聚合源
export const addEntityClusterSource = (key: string, source: Cluster) => {
  entityClusterSources[key] = source;
};

// 移除聚合源
export const removeEntityClusterSource = (key: string) => {
  delete entityClusterSources[key];
};

// 优化清空所有数据函数
export const clearAllData = () => {
  // 清除所有定时器
  Object.values(styleCacheCleanupTimers).forEach(timer => {
    clearTimeout(timer);
  });

  // 清空所有缓存
  Object.keys(iconStyleCache).forEach(key => {
    delete iconStyleCache[key];
  });
  Object.keys(styleCacheCleanupTimers).forEach(key => {
    delete styleCacheCleanupTimers[key];
  });
  Object.keys(styleCache).forEach(key => {
    delete styleCache[key];
  });

  // 清空特征和映射
  features.length = 0;
  Object.keys(itemMap).forEach(key => delete itemMap[key]);
  Object.keys(entityGroup).forEach(key => delete entityGroup[key]);

  // 清空图层和源
  entityClusterLayers.length = 0;
  Object.keys(entityClusterSources).forEach(key => {
    const source = entityClusterSources[key];
    source.getSource()?.clear();
    delete entityClusterSources[key];
  });

  // 清空主源
  const vectorSource = source.getSource();
  if (vectorSource) {
    vectorSource.clear();
  }
};
