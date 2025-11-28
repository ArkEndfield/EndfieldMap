import {
  DEFAULT_ICON_SIZE,
  DEFAULT_STROKE_WIDTH,
  EntityInstanceKey,
  FeatureType,
  FeatureTypeKey,
  MarkedFeatureFilterMode,
} from '@endfieldmap/map-core/const/map';
import type { CommonPointEntityLayer } from '@endfieldmap/map-core/render/layers/entity/common_point';
import type { ElectricPoleEntityLayer } from '@endfieldmap/map-core/render/layers/entity/electric_pole';
import type { CustomPointEntityLayer } from '@endfieldmap/map-core/render/layers/entity/custom_point';
import type { Map as OlMap } from 'ol';
import type { Coordinate } from 'ol/coordinate';
import type { Feature } from 'ol';
import type { Point } from 'ol/geom';
import type { MapFeature } from '../types';

export interface EntityHitTestInput {
  coordinate: Coordinate | undefined;
  pixel: [number, number];
  map: OlMap;
}

export interface EntityHitTestResult {
  features: Feature<Point>[];
  layer: CommonPointEntityLayer | ElectricPoleEntityLayer | CustomPointEntityLayer;
}

/**
 * 在多个命中结果中选择视觉上“最上层”的那个
 * - 优先比较图层的 zIndex
 * - 若 zIndex 一致，后出现的（添加顺序更靠后）优先
 */
export function selectTopmostHitResult(results: EntityHitTestResult[]): EntityHitTestResult | null {
  if (results.length === 0) {
    return null;
  }

  let topIndex = 0;
  let topZIndex = results[0].layer.layer.getZIndex() ?? 0;

  for (let i = 1; i < results.length; i += 1) {
    const zIndex = results[i].layer.layer.getZIndex() ?? 0;
    if (zIndex > topZIndex || (zIndex === topZIndex && i > topIndex)) {
      topIndex = i;
      topZIndex = zIndex;
    }
  }

  return results[topIndex];
}

export interface EntityHitTestOptions {
  /**
   * 是否启用基于 `layer.getFeatures(pixel)` 的高精度命中检测
   * - `true`：使用像素级命中检测，命中顺序与实际渲染顺序一致（推荐用于 click / hover）
   * - `false`/未传：使用几何近邻 + 包络盒命中（性能更好，但在复杂重叠情况下可能与渲染顺序不完全一致）
   */
  enableHitDetectionFallback?: boolean;
}

/**
 * 基于实体样式（圆 + 底部指示器）的几何关系，统一执行点击 / hover 的实体命中检测。
 * 命中区域与 CommonPointEntityLayer / ElectricPoleEntityLayer / CustomPointEntityLayer 的样式保持一致：
 * - 上方覆盖圆和装饰
 * - 下方只保留靠近锚点的一小段（底部指示器附近）
 */
export async function hitTestEntitiesAt(
  input: EntityHitTestInput,
  electricPoleLayers: (ElectricPoleEntityLayer | CustomPointEntityLayer)[],
  entityLayers: CommonPointEntityLayer[],
  options?: EntityHitTestOptions
): Promise<EntityHitTestResult[]> {
  const { coordinate } = input;

  if (!coordinate) {
    return [];
  }

  if (options?.enableHitDetectionFallback) {
    return hitTestEntitiesByPixel(input, electricPoleLayers, entityLayers);
  }

  return hitTestEntitiesByGeometry(input, electricPoleLayers, entityLayers);
}

/**
 * 使用几何近邻 + 包络盒的快速命中检测（旧实现，性能较好）
 */
function hitTestEntitiesByGeometry(
  input: EntityHitTestInput,
  electricPoleLayers: (ElectricPoleEntityLayer | CustomPointEntityLayer)[],
  entityLayers: CommonPointEntityLayer[]
): EntityHitTestResult[] {
  const { coordinate, pixel, map } = input;

  if (!coordinate) {
    return [];
  }

  // 参考实体样式计算命中区域
  const baseRadiusPx = DEFAULT_ICON_SIZE / 2;
  const strokeWidthPx = DEFAULT_STROKE_WIDTH;
  // 底部圆样式：radius = baseRadiusPx + strokeWidthPx，中心相对锚点位移 = baseRadiusPx + strokeWidthPx * 2
  const circleRadiusPx = baseRadiusPx + strokeWidthPx;
  const circleCenterOffsetYPx = baseRadiusPx + strokeWidthPx * 2;
  const circleBottomFromAnchorPx = circleCenterOffsetYPx + circleRadiusPx; // 约 33px
  // 底部三角指示器：中心位移 -1.5px，半径约 4px
  const indicatorCenterOffsetYPx = -1.5;
  const indicatorRadiusPx = 4;
  const indicatorTopFromAnchorPx = indicatorCenterOffsetYPx - indicatorRadiusPx; // 约 -5.5px

  // 先按样式坐标系得到一个包络盒，再根据屏幕坐标系（y 向下为正）反转，保证“上多下少”
  const rawTopFromAnchorPx = indicatorTopFromAnchorPx - 2; // 再往上多给 2px
  const rawBottomFromAnchorPx = circleBottomFromAnchorPx + 2; // 再往下多给 2px
  // 样式里“上”是负、“下”是正；屏幕坐标 y 反向，所以这里反转一次：
  const upwardOffsetPx = 5; // 整体向上偏移 5px
  const visualTopFromAnchorPx = -rawBottomFromAnchorPx - upwardOffsetPx; // 大部分区域在锚点上方
  const visualBottomFromAnchorPx = -rawTopFromAnchorPx - upwardOffsetPx; // 锚点下方保留一小段
  const halfWidthPx = circleRadiusPx + 2; // 水平方向以圆半径为主，稍微放大一点

  const [pointerPx, pointerPy] = pixel;

  const results: EntityHitTestResult[] = [];

  // 处理电线杆（非聚合）- 使用空间索引
  for (const layer of electricPoleLayers) {
    const source = layer.layer.getSource();
    if (!source) continue;

    const closestFeature = source.getClosestFeatureToCoordinate(coordinate) as Feature<Point>;
    if (!closestFeature) continue;

    const geometry = closestFeature.getGeometry();
    if (!geometry) continue;

    const closestCoordinate = geometry.getCoordinates();
    const [featurePx, featurePy] = map.getPixelFromCoordinate(closestCoordinate);
    const dxPx = pointerPx - featurePx;
    const dyPx = pointerPy - featurePy;

    // 垂直范围裁剪
    if (dyPx < visualTopFromAnchorPx || dyPx > visualBottomFromAnchorPx) {
      continue;
    }

    // 水平方向裁剪
    if (Math.abs(dxPx) > halfWidthPx) {
      continue;
    }

    // 在相同坐标上可能有多根电线杆（例如叠放），这里按 feature 的创建顺序选择“最上面”的一个
    const overlappedFeatures = source.getFeaturesAtCoordinate(closestCoordinate) as Feature<Point>[];

    let selectedFeature: Feature<Point> | null = null;
    let maxOrder = -Infinity;

    for (const candidate of overlappedFeatures) {
      if (candidate.get(FeatureTypeKey) !== FeatureType.ENTITY) {
        continue;
      }
      const instance = candidate.get(EntityInstanceKey) as MapFeature | undefined;

      // 根据 layer 的 markedFilterMode 过滤（仅对支持的图层类型）
      const marked = instance?.marked ?? false;
      const markable = instance?.markable ?? false;
      if (markable && 'markedFilterMode' in layer && layer.markedFilterMode === MarkedFeatureFilterMode.Marked && !marked) {
        continue;
      }
      if (markable && 'markedFilterMode' in layer && layer.markedFilterMode === MarkedFeatureFilterMode.Unmarked && marked) {
        continue;
      }

      const order = instance?.order ?? 0;
      if (!selectedFeature || order > maxOrder) {
        selectedFeature = candidate;
        maxOrder = order;
      }
    }

    if (selectedFeature) {
      results.push({ features: [selectedFeature], layer });
    }
  }

  // 处理普通实体（聚合，使用 Cluster 源）
  for (const layer of entityLayers) {
    const source = layer.layer.getSource();
    if (!source) continue;

    const closestClusterFeature = source.getClosestFeatureToCoordinate(coordinate) as Feature<Point>;
    if (!closestClusterFeature) continue;

    const geometry = closestClusterFeature.getGeometry();
    if (!geometry || geometry.getType() !== 'Point') continue;

    const closestCoordinate = (geometry as Point).getCoordinates();
    const [featurePx, featurePy] = map.getPixelFromCoordinate(closestCoordinate);
    const dxPx = pointerPx - featurePx;
    const dyPx = pointerPy - featurePy;

    if (dyPx < visualTopFromAnchorPx || dyPx > visualBottomFromAnchorPx) {
      continue;
    }

    if (Math.abs(dxPx) > halfWidthPx) {
      continue;
    }

    const clusterFeatures = closestClusterFeature.get('features') as Feature<Point>[] | undefined;
    if (!clusterFeatures || clusterFeatures.length === 0) {
      continue;
    }

    // 过滤出实体特征后，按创建顺序从“上到下”排序（order 越大越在上）
    const features = clusterFeatures
      .filter((feature) => {
        if (feature.get(FeatureTypeKey) !== FeatureType.ENTITY) {
          return false;
        }
        // 根据 layer 的 markedFilterMode 过滤（仅对支持的图层类型）
        const instance = feature.get(EntityInstanceKey) as MapFeature | undefined;
        const marked = instance?.marked ?? false;
        const markable = instance?.markable ?? false;
        if (markable && 'markedFilterMode' in layer && layer.markedFilterMode === MarkedFeatureFilterMode.Marked && !marked) {
          return false;
        }
        if (markable && 'markedFilterMode' in layer && layer.markedFilterMode === MarkedFeatureFilterMode.Unmarked && marked) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const aInstance = a.get(EntityInstanceKey) as { order?: number } | undefined;
        const bInstance = b.get(EntityInstanceKey) as { order?: number } | undefined;
        const aOrder = aInstance?.order ?? 0;
        const bOrder = bInstance?.order ?? 0;
        return bOrder - aOrder;
      });

    if (features.length > 0) {
      results.push({ features, layer });
    }
  }

  return results;
}

/**
 * 使用 `layer.getFeatures(pixel)` 的像素级命中检测
 * 命中顺序与实际渲染顺序一致，适合需要精确层叠顺序的场景
 */
async function hitTestEntitiesByPixel(
  input: EntityHitTestInput,
  electricPoleLayers: (ElectricPoleEntityLayer | CustomPointEntityLayer)[],
  entityLayers: CommonPointEntityLayer[]
): Promise<EntityHitTestResult[]> {
  const { pixel, map } = input;

  // 参考实体样式计算命中区域
  const baseRadiusPx = DEFAULT_ICON_SIZE / 2;
  const strokeWidthPx = DEFAULT_STROKE_WIDTH;
  const circleRadiusPx = baseRadiusPx + strokeWidthPx;
  const circleCenterOffsetYPx = baseRadiusPx + strokeWidthPx * 2;
  const circleBottomFromAnchorPx = circleCenterOffsetYPx + circleRadiusPx;
  const indicatorCenterOffsetYPx = -1.5;
  const indicatorRadiusPx = 4;
  const indicatorTopFromAnchorPx = indicatorCenterOffsetYPx - indicatorRadiusPx;

  const rawTopFromAnchorPx = indicatorTopFromAnchorPx - 2;
  const rawBottomFromAnchorPx = circleBottomFromAnchorPx + 2;
  const upwardOffsetPx = 5; // 整体向上偏移 5px
  const visualTopFromAnchorPx = -rawBottomFromAnchorPx - upwardOffsetPx;
  const visualBottomFromAnchorPx = -rawTopFromAnchorPx - upwardOffsetPx;
  const halfWidthPx = circleRadiusPx + 2;

  const [pointerPx, pointerPy] = pixel;

  const results: EntityHitTestResult[] = [];

  // 电线杆：直接基于像素命中结果过滤（顺序与渲染一致）
  for (const layer of electricPoleLayers) {
    const clickedFeatures = await layer.layer.getFeatures(pixel);
    if (!clickedFeatures.length) {
      continue;
    }

    const hitFeatures: Feature<Point>[] = [];

    for (const feature of clickedFeatures) {
      if (feature.get(FeatureTypeKey) !== FeatureType.ENTITY) {
        continue;
      }

      // 根据 layer 的 markedFilterMode 过滤（仅对支持的图层类型）
      const instance = feature.get(EntityInstanceKey) as MapFeature | undefined;
      const marked = instance?.marked ?? false;
      const markable = instance?.markable ?? false;
      if (markable && 'markedFilterMode' in layer && layer.markedFilterMode === MarkedFeatureFilterMode.Marked && !marked) {
        continue;
      }
      if (markable && 'markedFilterMode' in layer && layer.markedFilterMode === MarkedFeatureFilterMode.Unmarked && marked) {
        continue;
      }

      const geometry = feature.getGeometry();
      if (!geometry || geometry.getType() !== 'Point') {
        continue;
      }

      const coordinate = (geometry as Point).getCoordinates();
      const [featurePx, featurePy] = map.getPixelFromCoordinate(coordinate);
      const dxPx = pointerPx - featurePx;
      const dyPx = pointerPy - featurePy;

      if (dyPx < visualTopFromAnchorPx || dyPx > visualBottomFromAnchorPx) {
        continue;
      }

      if (Math.abs(dxPx) > halfWidthPx) {
        continue;
      }

      hitFeatures.push(feature as Feature<Point>);
    }

    if (hitFeatures.length > 0) {
      results.push({ features: hitFeatures, layer });
    }
  }

  // 普通实体：基于 Cluster 图层的像素命中结果
  for (const layer of entityLayers) {
    const clickedClusterFeatures = await layer.layer.getFeatures(pixel);
    if (!clickedClusterFeatures.length) {
      continue;
    }

    // 只取渲染顺序中最上面的一个聚合要素
    const topClusterFeature = clickedClusterFeatures[0];
    const geometry = topClusterFeature.getGeometry();
    if (!geometry || geometry.getType() !== 'Point') {
      continue;
    }

    const [featurePx, featurePy] = map.getPixelFromCoordinate((geometry as Point).getCoordinates());
    const dxPx = pointerPx - featurePx;
    const dyPx = pointerPy - featurePy;

    if (dyPx < visualTopFromAnchorPx || dyPx > visualBottomFromAnchorPx) {
      continue;
    }

    if (Math.abs(dxPx) > halfWidthPx) {
      continue;
    }

    const clusterFeatures = topClusterFeature.get('features') as Feature<Point>[] | undefined;
    if (!clusterFeatures || clusterFeatures.length === 0) {
      continue;
    }

    const entityFeatures = clusterFeatures.filter((feature) => {
      if (feature.get(FeatureTypeKey) !== FeatureType.ENTITY) {
        return false;
      }
      // 根据 layer 的 markedFilterMode 过滤（仅对支持的图层类型）
      const instance = feature.get(EntityInstanceKey) as MapFeature | undefined;
      const marked = instance?.marked ?? false;
      const markable = instance?.markable ?? false;

      if (markable && 'markedFilterMode' in layer && layer.markedFilterMode === MarkedFeatureFilterMode.Marked && !marked) {
        return false;
      }
      if (markable && 'markedFilterMode' in layer && layer.markedFilterMode === MarkedFeatureFilterMode.Unmarked && marked) {
        return false;
      }
      return true;
    }) as Feature<Point>[];

    if (entityFeatures.length > 0) {
      results.push({ features: entityFeatures, layer });
    }
  }

  return results;
}
