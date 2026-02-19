import type { HitTestableLayer } from '@endfieldmap/map-adapter-ol/types/layer';
import { EntityInstanceKey, FeatureType, FeatureTypeKey } from '@endfieldmap/map-core/const/map';
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
 * 使用 map.forEachFeatureAtPixel 获取正确的渲染顺序
 */
function hitTestNonClusteredLayer(
  input: EntityHitTestInput,
  layer: HitTestableLayer,
  results: EntityHitTestResult[]
): void {
  const { pixel, map } = input;

  // 使用 OpenLayers 的 forEachFeatureAtPixel 来获取正确的渲染顺序
  // 这个方法会按照实际渲染顺序返回特征（从上到下）
  let hitFeature: Feature<Point> | null = null;

  map.forEachFeatureAtPixel(
    pixel,
    (feature) => {
      const pointFeature = feature as Feature<Point>;

      // 检查特征是否可见
      if (!isFeatureVisible(pointFeature, layer)) {
        return false; // 继续查找
      }

      // 找到第一个可见的特征
      hitFeature = pointFeature;
      return true; // 停止查找
    },
    {
      layerFilter: (l) => l === layer.layer,
      hitTolerance: 0,
    }
  );

  if (hitFeature) {
    results.push({ features: [hitFeature], layer });
  }
}

/**
 * 处理聚簇实体图层（通用点）
 * 使用 map.forEachFeatureAtPixel 获取正确的渲染顺序
 */
function hitTestClusteredLayer(
  input: EntityHitTestInput,
  layer: HitTestableLayer,
  results: EntityHitTestResult[]
): void {
  const { pixel, map } = input;

  // 使用 OpenLayers 的 forEachFeatureAtPixel 来获取正确的渲染顺序
  // 这个方法会按照实际渲染顺序返回特征（从上到下）
  let hitClusterFeature: Feature<Point> | undefined;

  map.forEachFeatureAtPixel(
    pixel,
    (feature) => {
      // 只处理当前图层的特征
      const clusterFeature = feature as Feature<Point>;
      let clusterFeatures = clusterFeature.get('features') as Feature<Point>[] | undefined;

      // 兼容非 Cluster Source 的情况（当聚合被禁用时，使用的是 baseSource）
      if (!clusterFeatures) {
        // 如果是原始 feature，将其包装为数组
        if (clusterFeature.get(EntityInstanceKey)) {
          clusterFeatures = [clusterFeature];
        }
      }

      if (!clusterFeatures || clusterFeatures.length === 0) {
        return false; // 继续查找
      }

      // 检查是否有可见特征
      const hasVisibleFeatures = clusterFeatures.some((f) => isFeatureVisible(f, layer));
      if (!hasVisibleFeatures) {
        return false; // 继续查找
      }

      // 找到第一个包含可见特征的聚簇
      hitClusterFeature = clusterFeature;
      return true; // 停止查找
    },
    {
      layerFilter: (l) => l === layer.layer,
      hitTolerance: 0,
    }
  );

  if (!hitClusterFeature) {
    return;
  }

  // 获取聚簇中的所有特征并过滤
  // 获取聚簇中的所有特征并过滤
  let clusterFeatures = hitClusterFeature.get('features') as Feature<Point>[] | undefined;
  if (!clusterFeatures && hitClusterFeature.get(EntityInstanceKey)) {
    clusterFeatures = [hitClusterFeature];
  }
  clusterFeatures = clusterFeatures || [];
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
