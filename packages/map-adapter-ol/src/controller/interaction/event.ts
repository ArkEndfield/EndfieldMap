import {
  type EntityHitTestResult,
  hitTestEntitiesAt,
  selectTopmostHitResult,
} from '@endfieldmap/map-adapter-ol/event/entity_hit_test';
import type { OLMapEventPayloads } from '@endfieldmap/map-adapter-ol/types/event';
import type { HitTestableLayer } from '@endfieldmap/map-adapter-ol/types/layer';
import type { ElectricPoleDataInstance, EndfieldMapEmitter, EntityDataInstance } from '@endfieldmap/map-core';
import { ConnectionTargetIdKey, EntityInstanceKey, MAP_EVENT } from '@endfieldmap/map-core';
import { boundingExtent } from 'ol/extent';
import type { FeatureLike } from 'ol/Feature';

/**
 * 具备连接线命中测试能力的渲染器接口
 */
export interface ConnectionCapableRenderer {
  visible: boolean;
  getConnectionVisible(): boolean;
  getConnectionFeatures(pixel: [number, number]): Promise<FeatureLike[]>;
}

export interface EventControllerConfig {
  getClusteredLayers: () => HitTestableLayer[];
  getNonClusteredLayers: () => HitTestableLayer[];
  getConnectionRenderers?: () => ConnectionCapableRenderer[];
  emitter: EndfieldMapEmitter<OLMapEventPayloads>;
}

export class EventController {
  private getClusteredLayers: () => HitTestableLayer[];
  private getNonClusteredLayers: () => HitTestableLayer[];
  private getConnectionRenderers: () => ConnectionCapableRenderer[];
  private emitter: EndfieldMapEmitter<OLMapEventPayloads>;
  private disposeListeners: Array<() => void> = [];

  constructor(config: EventControllerConfig) {
    this.getClusteredLayers = config.getClusteredLayers;
    this.getNonClusteredLayers = config.getNonClusteredLayers;
    this.getConnectionRenderers = config.getConnectionRenderers ?? (() => []);
    this.emitter = config.emitter;
    this.registerClickEventHandlers();
    this.registerContextMenuEventHandlers();
  }

  public dispose() {
    this.disposeListeners.forEach((dispose) => dispose());
    this.disposeListeners = [];
  }

  private registerClickEventHandlers() {
    // 点击事件
    const disposeClick = this.emitter.on(MAP_EVENT.MAP_CLICK, async (event) => {
      const nonClusteredLayers = this.getNonClusteredLayers().filter((r) => r.visible);
      const clusteredLayers = this.getClusteredLayers().filter((layer) => layer.visible);

      const allClickedFeatures: EntityHitTestResult[] = hitTestEntitiesAt(
        {
          coordinate: event.coordinate as [number, number] | undefined,
          pixel: event.pixel as [number, number],
          map: event.map,
        },
        nonClusteredLayers,
        clusteredLayers
      );

      // 如果没有命中实体，尝试命中电线连接
      if (allClickedFeatures.length === 0) {
        const connectionRenderers = this.getConnectionRenderers().filter((r) => r.visible);
        for (const renderer of connectionRenderers) {
          if (!renderer.getConnectionVisible()) continue;

          const clickedFeatures = await renderer.getConnectionFeatures(event.pixel as [number, number]);
          if (clickedFeatures.length === 0) continue;
          const feature = clickedFeatures[0];
          const instance = feature.get(EntityInstanceKey) as ElectricPoleDataInstance;
          const targetId = feature.get(ConnectionTargetIdKey);
          if (typeof targetId !== 'number') continue;
          this.emitter.fire(MAP_EVENT.CONNECTION_CLICK, {
            feature: feature,
            instance,
            targetId,
            event,
          });
          return;
        }
        return;
      }

      // 选择最上层的 layer（基于 z-index 和添加顺序）
      const selectedLayerFeatures = selectTopmostHitResult(allClickedFeatures);
      if (!selectedLayerFeatures) return;
      const features = selectedLayerFeatures.features;

      if (features.length > 1) {
        // 处理聚合点击
        const coordinates = features.map((r) => r.getGeometry()?.getCoordinates?.()).filter((coord) => !!coord);
        const extent = boundingExtent(coordinates);
        const instances = features.map((r) => r.get(EntityInstanceKey) as EntityDataInstance);
        this.emitter.fire(MAP_EVENT.CLUSTER_CLICK, {
          features,
          instances,
          coordinates,
          extent,
          event,
        });
      } else {
        // 处理单个实体点击
        const feature = features[0];
        const instance = feature.get(EntityInstanceKey) as EntityDataInstance;
        // 标记事件已被处理，防止被视为地图空白处点击
        event.hasHit = true;

        this.emitter.fire(MAP_EVENT.ENTITY_CLICK, {
          instance,
          feature,
          event,
        });
      }
    });
    this.disposeListeners.push(disposeClick);
  }

  private registerContextMenuEventHandlers() {
    const disposeContextMenu = this.emitter.on(MAP_EVENT.MAP_CONTEXT_MENU, async (detail) => {
      const nonClusteredLayers = this.getNonClusteredLayers().filter((r) => r.visible);
      const clusteredLayers = this.getClusteredLayers().filter((layer) => layer.visible);

      const allClickedFeatures: EntityHitTestResult[] = hitTestEntitiesAt(
        {
          coordinate: detail.coordinate,
          pixel: detail.pixel,
          map: detail.map,
        },
        nonClusteredLayers,
        clusteredLayers
      );

      // 如果没有命中实体，尝试命中电线连接
      if (allClickedFeatures.length === 0) {
        const connectionRenderers = this.getConnectionRenderers().filter((r) => r.visible);
        for (const renderer of connectionRenderers) {
          if (!renderer.getConnectionVisible()) continue;

          const clickedFeatures = await renderer.getConnectionFeatures(detail.pixel);
          if (clickedFeatures.length === 0) continue;

          this.emitter.fire(MAP_EVENT.CONNECTION_CONTEXT_MENU, {
            feature: clickedFeatures[0],
            event: detail,
          });
          return;
        }
        return;
      }

      // 选择最上层的 layer（基于 z-index 和添加顺序）
      const selectedLayerFeatures = selectTopmostHitResult(allClickedFeatures);
      if (!selectedLayerFeatures) return;
      const features = selectedLayerFeatures.features;

      // 右键只针对单个实体触发上下文菜单，如果命中多个，选择第一个
      const feature = features[0];
      const instance = feature.get(EntityInstanceKey) as EntityDataInstance;

      this.emitter.fire(MAP_EVENT.ENTITY_CONTEXT_MENU, {
        instance,
        feature,
        layer: selectedLayerFeatures.layer,
        event: detail,
      });
    });
    this.disposeListeners.push(disposeContextMenu);
  }
}
