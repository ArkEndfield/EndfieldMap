import {
  DEFAULT_ICON_SIZE,
  DEFAULT_STROKE_WIDTH,
  EntityInstanceKey,
  FeatureType,
  FeatureTypeKey,
  MarkedFeatureFilterMode,
} from '@endfieldmap/map-core/const/map';
import type { CommonPointEntityLayer } from '@endfieldmap/map-core/render/layers/entity/common_point';
import type { CustomPointEntityLayer } from '@endfieldmap/map-core/render/layers/entity/custom_point';
import type { ElectricPoleEntityLayer } from '@endfieldmap/map-core/render/layers/entity/electric_pole';
import type { MapFeature } from '@endfieldmap/map-core/types';
import type { Map as OlMap } from 'ol';
import type { Feature } from 'ol';
import type { Coordinate } from 'ol/coordinate';
import type { Point } from 'ol/geom';

// ============================================================================
// Types
// ============================================================================

export interface EntityHitTestInput {
  coordinate: Coordinate | undefined;
  pixel: [number, number];
  map: OlMap;
}

export interface EntityHitTestResult {
  features: Feature<Point>[];
  layer: CommonPointEntityLayer | ElectricPoleEntityLayer | CustomPointEntityLayer;
}

export interface EntityHitTestOptions {
  /**
   * Debounce delay in milliseconds.
   * Used by createDebouncedHitTest to control debounce timing.
   * @default 16 (approximately 60fps)
   */
  debounceDelay?: number;
}

type EntityLayer = CommonPointEntityLayer | ElectricPoleEntityLayer | CustomPointEntityLayer;

// ============================================================================
// Constants - Cached hit test geometry calculations
// ============================================================================

const BASE_RADIUS_PX = DEFAULT_ICON_SIZE / 2;
const STROKE_WIDTH_PX = DEFAULT_STROKE_WIDTH;
const CIRCLE_RADIUS_PX = BASE_RADIUS_PX + STROKE_WIDTH_PX;
const CIRCLE_CENTER_OFFSET_Y_PX = BASE_RADIUS_PX + STROKE_WIDTH_PX * 2;
const CIRCLE_BOTTOM_FROM_ANCHOR_PX = CIRCLE_CENTER_OFFSET_Y_PX + CIRCLE_RADIUS_PX;
const INDICATOR_CENTER_OFFSET_Y_PX = -1.5;
const INDICATOR_RADIUS_PX = 4;
const INDICATOR_TOP_FROM_ANCHOR_PX = INDICATOR_CENTER_OFFSET_Y_PX - INDICATOR_RADIUS_PX;

const RAW_TOP_FROM_ANCHOR_PX = INDICATOR_TOP_FROM_ANCHOR_PX - 2;
const RAW_BOTTOM_FROM_ANCHOR_PX = CIRCLE_BOTTOM_FROM_ANCHOR_PX + 2;
const UPWARD_OFFSET_PX = 5;
const VISUAL_TOP_FROM_ANCHOR_PX = -RAW_BOTTOM_FROM_ANCHOR_PX - UPWARD_OFFSET_PX;
const VISUAL_BOTTOM_FROM_ANCHOR_PX = -RAW_TOP_FROM_ANCHOR_PX - UPWARD_OFFSET_PX;
const HALF_WIDTH_PX = CIRCLE_RADIUS_PX + 2;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * 检查特征是否通过可见性和过滤模式检查
 * 提取以减少代码重复并提高性能
 */
function isFeatureVisible(feature: Feature<Point>, layer: EntityLayer): boolean {
  if (feature.get(FeatureTypeKey) !== FeatureType.ENTITY) {
    return false;
  }

  const instance = feature.get(EntityInstanceKey) as MapFeature | undefined;

  if (instance && 'visible' in instance && instance.visible === false) {
    return false;
  }

  if (!instance?.markable) {
    return true;
  }

  const marked = instance.marked ?? false;

  if (!('markedFilterMode' in layer)) {
    return true;
  }

  if (layer.markedFilterMode === MarkedFeatureFilterMode.Marked && !marked) {
    return false;
  }

  if (layer.markedFilterMode === MarkedFeatureFilterMode.Unmarked && marked) {
    return false;
  }

  return true;
}

/**
 * 检查像素坐标是否在击中测试范围内
 * 用于高频率悬停事件的早期退出优化
 */
function isWithinHitBounds(dxPx: number, dyPx: number): boolean {
  if (dyPx < VISUAL_TOP_FROM_ANCHOR_PX || dyPx > VISUAL_BOTTOM_FROM_ANCHOR_PX) {
    return false;
  }

  if (Math.abs(dxPx) > HALF_WIDTH_PX) {
    return false;
  }

  return true;
}

/**
 * 选择重叠特征中基于 order 属性的最上层特征
 * 如果没有找到有效特征，则返回 null
 */
function selectTopmostFeature(features: Feature<Point>[], layer: EntityLayer): Feature<Point> | null {
  let selectedFeature: Feature<Point> | null = null;
  let maxOrder = -Infinity;

  for (const candidate of features) {
    if (!isFeatureVisible(candidate, layer)) {
      continue;
    }

    const instance = candidate.get(EntityInstanceKey) as MapFeature | undefined;
    const order = instance?.order ?? 0;

    if (!selectedFeature || order > maxOrder) {
      selectedFeature = candidate;
      maxOrder = order;
    }
  }

  return selectedFeature;
}

/**
 * 过滤和排序聚簇特征，按可见性和顺序排序
 * 如果没有找到有效特征，则返回空数组
 */
function filterAndSortClusterFeatures(clusterFeatures: Feature<Point>[], layer: EntityLayer): Feature<Point>[] {
  const validFeatures: Array<{ feature: Feature<Point>; order: number }> = [];

  for (const feature of clusterFeatures) {
    if (!isFeatureVisible(feature, layer)) {
      continue;
    }

    const instance = feature.get(EntityInstanceKey) as MapFeature | undefined;
    const order = instance?.order ?? 0;
    validFeatures.push({ feature, order });
  }

  if (validFeatures.length === 0) {
    return [];
  }

  validFeatures.sort((a, b) => b.order - a.order);
  return validFeatures.map((item) => item.feature);
}

// ============================================================================
// Hit Test Functions
// ============================================================================

/**
 * 处理非聚簇实体图层（电线杆，自定义点）
 * 使用空间索引快速查找最近特征
 */
function hitTestNonClusteredLayer(
  input: EntityHitTestInput,
  layer: ElectricPoleEntityLayer | CustomPointEntityLayer,
  results: EntityHitTestResult[]
): void {
  const { coordinate, pixel, map } = input;
  const source = layer.layer.getSource();

  if (!source || !coordinate) {
    return;
  }

  const closestFeature = source.getClosestFeatureToCoordinate(coordinate) as Feature<Point>;
  if (!closestFeature) {
    return;
  }

  const geometry = closestFeature.getGeometry();
  if (!geometry) {
    return;
  }

  const closestCoordinate = geometry.getCoordinates();
  const [featurePx, featurePy] = map.getPixelFromCoordinate(closestCoordinate);
  const dxPx = pixel[0] - featurePx;
  const dyPx = pixel[1] - featurePy;

  if (!isWithinHitBounds(dxPx, dyPx)) {
    return;
  }

  const overlappedFeatures = source.getFeaturesAtCoordinate(closestCoordinate) as Feature<Point>[];
  const selectedFeature = selectTopmostFeature(overlappedFeatures, layer);

  if (selectedFeature) {
    results.push({ features: [selectedFeature], layer });
  }
}

/**
 * 处理聚簇实体图层（通用点）
 * 处理聚簇特征提取和排序
 */
function hitTestClusteredLayer(
  input: EntityHitTestInput,
  layer: CommonPointEntityLayer,
  results: EntityHitTestResult[]
): void {
  const { coordinate, pixel, map } = input;
  const source = layer.layer.getSource();

  if (!source || !coordinate) {
    return;
  }

  const closestClusterFeature = source.getClosestFeatureToCoordinate(coordinate) as Feature<Point>;
  if (!closestClusterFeature) {
    return;
  }

  const geometry = closestClusterFeature.getGeometry();
  if (!geometry || geometry.getType() !== 'Point') {
    return;
  }

  const closestCoordinate = (geometry as Point).getCoordinates();
  const [featurePx, featurePy] = map.getPixelFromCoordinate(closestCoordinate);
  const dxPx = pixel[0] - featurePx;
  const dyPx = pixel[1] - featurePy;

  if (!isWithinHitBounds(dxPx, dyPx)) {
    return;
  }

  const clusterFeatures = closestClusterFeature.get('features') as Feature<Point>[] | undefined;
  if (!clusterFeatures || clusterFeatures.length === 0) {
    return;
  }

  const features = filterAndSortClusterFeatures(clusterFeatures, layer);

  if (features.length > 0) {
    results.push({ features, layer });
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * 选择多个击中测试结果中的最上层结果
 * 优先级：图层 zIndex，图层在数组中的顺序
 *
 * @param results - 多个击中测试结果
 * @returns 最上层结果，如果数组为空则返回 null
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

/**
 * 地图实体击中测试
 * @param input - 包含坐标、像素和地图的击中测试输入
 * @param electricPoleLayers - 非聚簇实体图层（电线杆，自定义点）
 * @param entityLayers - 聚簇实体图层（通用点）
 * @returns 地图实体击中测试结果
 */
export function hitTestEntitiesAt(
  input: EntityHitTestInput,
  electricPoleLayers: (ElectricPoleEntityLayer | CustomPointEntityLayer)[],
  entityLayers: CommonPointEntityLayer[]
): EntityHitTestResult[] {
  const { coordinate } = input;

  if (!coordinate) {
    return [];
  }

  const results: EntityHitTestResult[] = [];

  for (const layer of electricPoleLayers) {
    hitTestNonClusteredLayer(input, layer, results);
  }

  for (const layer of entityLayers) {
    hitTestClusteredLayer(input, layer, results);
  }

  return results;
}
