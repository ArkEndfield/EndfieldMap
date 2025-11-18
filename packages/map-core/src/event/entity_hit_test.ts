import { DEFAULT_ICON_SIZE, DEFAULT_STROKE_WIDTH, FeatureType, FeatureTypeKey } from '@endfieldmap/map-core/const/map';
import type { CommonPointEntityLayer } from '@endfieldmap/map-core/render/layers/entity/common_point';
import type { ElectricPoleEntityLayer } from '@endfieldmap/map-core/render/layers/entity/electric_pole';
import type { Map as OlMap } from 'ol';
import type { Coordinate } from 'ol/coordinate';
import type { Feature } from 'ol';
import type { Point } from 'ol/geom';

export interface EntityHitTestInput {
  coordinate: Coordinate | undefined;
  pixel: [number, number];
  map: OlMap;
}

export interface EntityHitTestResult {
  features: Feature<Point>[];
  layer: CommonPointEntityLayer | ElectricPoleEntityLayer;
}

export interface EntityHitTestOptions {
  /** 是否在未命中时回退到基于 getFeatures(pixel) 的命中检测（仅用于点击/右键，避免 hover 卡顿） */
  enableHitDetectionFallback?: boolean;
}

/**
 * 基于实体样式（圆 + 底部指示器）的几何关系，统一执行点击 / hover 的实体命中检测。
 * 命中区域与 CommonPointEntityLayer / ElectricPoleEntityLayer 的样式保持一致：
 * - 上方覆盖圆和装饰
 * - 下方只保留靠近锚点的一小段（底部指示器附近）
 */
export async function hitTestEntitiesAt(
  input: EntityHitTestInput,
  electricPoleLayers: ElectricPoleEntityLayer[],
  entityLayers: CommonPointEntityLayer[],
  options?: EntityHitTestOptions,
): Promise<EntityHitTestResult[]> {
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
  const visualTopFromAnchorPx = -rawBottomFromAnchorPx; // 大部分区域在锚点上方
  const visualBottomFromAnchorPx = -rawTopFromAnchorPx; // 锚点下方保留一小段
  const halfWidthPx = circleRadiusPx + 2; // 水平方向以圆半径为主，稍微放大一点

  const [pointerPx, pointerPy] = pixel;

  const results: EntityHitTestResult[] = [];

  // 处理电线杆（非聚合）- 使用空间索引
  for (const layer of electricPoleLayers) {
    const source = layer.layer.getSource();
    if (!source) continue;

    const closestFeature = source.getClosestFeatureToCoordinate(coordinate);
    if (!closestFeature) continue;

    const geometry = closestFeature.getGeometry();
    if (!geometry) continue;

    const closestCoordinate = geometry.getCoordinates() as Coordinate;
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

    const features = [closestFeature].filter(
      (feature) => feature.get(FeatureTypeKey) === FeatureType.ENTITY,
    ) as Feature<Point>[];

    if (features.length > 0) {
      results.push({ features, layer });
    }
  }

  // 处理普通实体（聚合，使用 Cluster 源）
  for (const layer of entityLayers) {
    const source = layer.layer.getSource();
    if (!source) continue;

    const closestClusterFeature = source.getClosestFeatureToCoordinate(coordinate);
    if (!closestClusterFeature) continue;

    const geometry = closestClusterFeature.getGeometry();
    if (!geometry) continue;

    const closestCoordinate = geometry.getCoordinates() as Coordinate;
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

    const features = clusterFeatures.filter(
      (feature) => feature.get(FeatureTypeKey) === FeatureType.ENTITY,
    );

    if (features.length > 0) {
      results.push({ features, layer });
    }
  }

  // 如果需要，回退到基于 getFeatures(pixel) 的命中检测（点击 / 右键时使用，hover 不使用）
  if (results.length === 0 && options?.enableHitDetectionFallback) {
    // 电线杆：非聚合图层，直接使用命中的要素
    for (const layer of electricPoleLayers) {
      const clickedFeatures = await layer.layer.getFeatures(pixel);
      if (!clickedFeatures.length) {
        continue;
      }

      const features = clickedFeatures.filter(
        (feature) => feature.get(FeatureTypeKey) === FeatureType.ENTITY,
      ) as Feature<Point>[];

      if (features.length > 0) {
        results.push({ features, layer });
      }
    }

    // 普通实体：聚合图层，使用第一个聚合要素的底层 features
    for (const layer of entityLayers) {
      const clickedFeatures = await layer.layer.getFeatures(pixel);
      if (!clickedFeatures.length) {
        continue;
      }

      const clusterFeatures = clickedFeatures[0].get('features') as Feature<Point>[] | undefined;
      if (!clusterFeatures || clusterFeatures.length === 0) {
        continue;
      }

      const features = clusterFeatures.filter(
        (feature) => feature.get(FeatureTypeKey) === FeatureType.ENTITY,
      );

      if (features.length > 0) {
        results.push({ features, layer });
      }
    }
  }

  return results;
}
