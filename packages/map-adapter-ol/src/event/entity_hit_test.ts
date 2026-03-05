import {
  SVG_DISPLACEMENT_Y,
  SVG_HEIGHT,
  SVG_WIDTH,
} from '@endfieldmap/map-adapter-ol/render/renderer/entity/common/marker_background_svg';
import type { HitTestableLayer } from '@endfieldmap/map-adapter-ol/types/layer';
import { EntityInstanceKey, FeatureType, FeatureTypeKey } from '@endfieldmap/map-core';
import type { Map as OlMap } from 'ol';
import type { Feature } from 'ol';
import type { Coordinate } from 'ol/coordinate';
import type { Extent } from 'ol/extent';
import type { Point } from 'ol/geom';

// ============================================================================
// Hit area (marker bounds in screen pixels relative to feature pixel position)
// ============================================================================

const HIT_HALF_WIDTH = SVG_WIDTH / 2;
const HIT_ABOVE = SVG_DISPLACEMENT_Y + SVG_HEIGHT / 2;
const HIT_BELOW = SVG_HEIGHT / 2 - SVG_DISPLACEMENT_Y;

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
  layer: HitTestableLayer;
}

export interface EntityHitTestOptions {
  /**
   * Debounce delay in milliseconds.
   * Used by createDebouncedHitTest to control debounce timing.
   * @default 16 (approximately 60fps)
   */
  debounceDelay?: number;
}

type EntityLayer = HitTestableLayer;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * 根据点击坐标和当前分辨率，构建用于 R-tree 空间查询的 extent（地图坐标）。
 * 将 marker 的像素边界转换为地图单位。
 */
function createSearchExtent(coordinate: Coordinate, resolution: number): Extent {
  const [cx, cy] = coordinate;
  const r = resolution;
  return [
    cx - HIT_HALF_WIDTH * r,
    cy - HIT_ABOVE * r,
    cx + HIT_HALF_WIDTH * r,
    cy + HIT_BELOW * r,
  ];
}

/**
 * 判断点击像素是否在 feature 的 marker 边界内（屏幕像素）。
 * 与 createSearchExtent 对应的精确像素级检查。
 */
function isPixelInMarkerBounds(clickPixel: [number, number], featurePixel: [number, number]): boolean {
  const [cpx, cpy] = clickPixel;
  const [fpx, fpy] = featurePixel;
  if (Math.abs(cpx - fpx) > HIT_HALF_WIDTH) return false;
  const dy = cpy - fpy;
  return dy >= -HIT_ABOVE && dy <= HIT_BELOW;
}

/**
 * 从 feature 的 style 属性推断 z-index（与 entity_group_style 中 selected=10, active=5, normal=0 一致）
 */
function getFeatureStyleZIndex(feature: Feature<Point>): number {
  const selected = (feature.get('selected') as number) ?? 0;
  const active = (feature.get('active') as number) ?? 0;
  if (selected === 1) return 10;
  if (active === 1) return 5;
  return 0;
}

/**
 * 检查特征是否为有效的 Entity 特征
 * 可见性和 markedFilterMode 过滤已在渲染器层通过 feature.visible 属性和 geometryFunction 处理，
 * hit test 命中的 feature 一定是可见的，无需再检查
 */
function isFeatureVisible(feature: Feature<Point>, _layer: EntityLayer): boolean {
  if (feature.get(FeatureTypeKey) !== FeatureType.ENTITY) {
    return false;
  }

  // 检查是否有关联的数据实例
  const instance = feature.get(EntityInstanceKey);
  return !!instance;
}

/**
 * 过滤聚簇特征，保持 OpenLayers 原始顺序
 * 如果没有找到有效特征，则返回空数组
 */
function filterAndSortClusterFeatures(clusterFeatures: Feature<Point>[], layer: EntityLayer): Feature<Point>[] {
  const validFeatures: Feature<Point>[] = [];

  for (const feature of clusterFeatures) {
    if (!isFeatureVisible(feature, layer)) {
      continue;
    }

    validFeatures.push(feature);
  }

  return validFeatures;
}

// ============================================================================
// Hit Test Functions
// ============================================================================

/**
 * 处理非聚簇实体图层（电线杆，自定义点）
 * 使用 R-tree 空间查询 + 像素精确检查，避免 getImageData 调用
 */
function hitTestNonClusteredLayer(
  input: EntityHitTestInput,
  layer: HitTestableLayer,
  results: EntityHitTestResult[]
): void {
  const { coordinate, pixel, map } = input;
  const source = layer.layer.getSource();
  if (!source || !('getFeaturesInExtent' in source)) return;

  const view = map.getView();
  const resolution = view.getResolution();
  if (!resolution) return;

  const extent = createSearchExtent(coordinate, resolution);
  const candidates = source.getFeaturesInExtent(extent) as Feature<Point>[];

  const hitCandidates: Feature<Point>[] = [];
  for (const feature of candidates) {
    if (!isFeatureVisible(feature, layer)) continue;
    const geom = feature.getGeometry();
    if (!geom || geom.getType() !== 'Point') continue;
    const coord = (geom as Point).getCoordinates();
    const featurePixel = map.getPixelFromCoordinate(coord) as [number, number];
    if (!isPixelInMarkerBounds(pixel, featurePixel)) continue;
    hitCandidates.push(feature);
  }

  if (hitCandidates.length === 0) return;

  hitCandidates.sort((a, b) => {
    const za = getFeatureStyleZIndex(a);
    const zb = getFeatureStyleZIndex(b);
    if (zb !== za) return zb - za;
    const coordA = (a.getGeometry() as Point).getCoordinates();
    const coordB = (b.getGeometry() as Point).getCoordinates();
    const pxA = map.getPixelFromCoordinate(coordA) as [number, number];
    const pxB = map.getPixelFromCoordinate(coordB) as [number, number];
    const distA = (pixel[0] - pxA[0]) ** 2 + (pixel[1] - pxA[1]) ** 2;
    const distB = (pixel[0] - pxB[0]) ** 2 + (pixel[1] - pxB[1]) ** 2;
    return distA - distB;
  });

  results.push({ features: [hitCandidates[0]], layer });
}

/**
 * 处理聚簇实体图层（通用点）
 * 使用 R-tree 空间查询 + 像素精确检查，兼容 distance=0 非聚合
 */
function hitTestClusteredLayer(
  input: EntityHitTestInput,
  layer: HitTestableLayer,
  results: EntityHitTestResult[]
): void {
  const { coordinate, pixel, map } = input;
  const source = layer.layer.getSource();
  if (!source || !('getFeaturesInExtent' in source)) return;

  const view = map.getView();
  const resolution = view.getResolution();
  if (!resolution) return;

  const extent = createSearchExtent(coordinate, resolution);
  const clusterCandidates = source.getFeaturesInExtent(extent) as Feature<Point>[];

  const hitClusters: Feature<Point>[] = [];
  for (const clusterFeature of clusterCandidates) {
    const geom = clusterFeature.getGeometry();
    if (!geom || geom.getType() !== 'Point') continue;
    const coord = (geom as Point).getCoordinates();
    const featurePixel = map.getPixelFromCoordinate(coord) as [number, number];
    if (!isPixelInMarkerBounds(pixel, featurePixel)) continue;

    let subFeatures = clusterFeature.get('features') as Feature<Point>[] | undefined;
    if (!subFeatures && clusterFeature.get(EntityInstanceKey)) {
      subFeatures = [clusterFeature];
    }
    if (!subFeatures?.length || !subFeatures.some((f) => isFeatureVisible(f, layer))) continue;

    hitClusters.push(clusterFeature);
  }

  if (hitClusters.length === 0) return;

  hitClusters.sort((a, b) => {
    const za = getFeatureStyleZIndex(a);
    const zb = getFeatureStyleZIndex(b);
    if (zb !== za) return zb - za;
    const coordA = (a.getGeometry() as Point).getCoordinates();
    const coordB = (b.getGeometry() as Point).getCoordinates();
    const pxA = map.getPixelFromCoordinate(coordA) as [number, number];
    const pxB = map.getPixelFromCoordinate(coordB) as [number, number];
    const distA = (pixel[0] - pxA[0]) ** 2 + (pixel[1] - pxA[1]) ** 2;
    const distB = (pixel[0] - pxB[0]) ** 2 + (pixel[1] - pxB[1]) ** 2;
    return distA - distB;
  });

  const topCluster = hitClusters[0];
  let clusterFeatures = topCluster.get('features') as Feature<Point>[] | undefined;
  if (!clusterFeatures && topCluster.get(EntityInstanceKey)) {
    clusterFeatures = [topCluster];
  }
  clusterFeatures = clusterFeatures ?? [];
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
  electricPoleLayers: HitTestableLayer[],
  entityLayers: HitTestableLayer[]
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
