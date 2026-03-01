import {
  type EntityHitTestResult,
  hitTestEntitiesAt,
  selectTopmostHitResult,
} from '@endfieldmap/map-adapter-ol/event/entity_hit_test';
import type { OLMapEventPayloads } from '@endfieldmap/map-adapter-ol/types/event';
import type { OLMapHoverEventDetail } from '@endfieldmap/map-adapter-ol/types/event';
import type { HitTestableLayer } from '@endfieldmap/map-adapter-ol/types/layer';
import type { DataInstance, ElectricPoleDataInstance, EndfieldMapEmitter, EntityDataInstance } from '@endfieldmap/map-core';
import { ConnectionTargetIdKey, EntityInstanceKey, MAP_EVENT } from '@endfieldmap/map-core';
import { debounce, type DebouncedFunction } from '@endfieldmap/tools';
import { boundingExtent } from 'ol/extent';
import type { FeatureLike } from 'ol/Feature';

/**
 * 具备连接线命中测试能力的渲染器接口
 */
export interface ConnectionCapableRenderer {
  visible: boolean;
  getConnectionVisible(): boolean;
  getConnectionFeatures(pixel: [number, number]): Promise<FeatureLike[]>;
  setHoveredFeature(feature: FeatureLike | null): void;
}

export interface EventControllerConfig {
  getClusteredLayers: () => HitTestableLayer[];
  getNonClusteredLayers: () => HitTestableLayer[];
  getConnectionRenderers?: () => ConnectionCapableRenderer[];
  emitter: EndfieldMapEmitter<OLMapEventPayloads>;
  disableHover?: boolean;
}

export class EventController {
  private getClusteredLayers: () => HitTestableLayer[];
  private getNonClusteredLayers: () => HitTestableLayer[];
  private getConnectionRenderers: () => ConnectionCapableRenderer[];
  private emitter: EndfieldMapEmitter<OLMapEventPayloads>;
  private disposeListeners: Array<() => void> = [];
  /** Hover 是否禁用 */
  private hoverDisabled: boolean;
  /** Hover 防抖时间 */
  private hoverDebounceTime: number = 0;
  /** 防抖后的 hover 处理函数 */
  private debouncedHandleHover: DebouncedFunction<[OLMapHoverEventDetail], Promise<void>> | null = null;

  constructor(config: EventControllerConfig) {
    this.getClusteredLayers = config.getClusteredLayers;
    this.getNonClusteredLayers = config.getNonClusteredLayers;
    this.getConnectionRenderers = config.getConnectionRenderers ?? (() => []);
    this.emitter = config.emitter;
    this.hoverDisabled = config.disableHover ?? false;
    this.registerClickEventHandlers();
    this.registerContextMenuEventHandlers();
    if (!this.hoverDisabled) {
      this.registerHoverEventHandlers();
    }
  }

  public dispose() {
    this.debouncedHandleHover?.cancel();
    this.debouncedHandleHover = null;
    this.unregisterHoverEventHandlers();
    this.disposeListeners.forEach((dispose) => dispose());
    this.disposeListeners = [];
  }

  /**
   * 设置是否启用 hover 事件处理
   */
  public setHoverEnable(enable: boolean) {
    if (enable === !this.hoverDisabled) return;
    this.hoverDisabled = !enable;
    if (enable) {
      this.registerHoverEventHandlers();
    } else {
      this.unregisterHoverEventHandlers();
    }
  }

  /**
   * 设置 hover 防抖时间
   */
  public setHoverDebounceTime(time: number) {
    this.hoverDebounceTime = time;
    this.updateDebouncedHoverHandler();
  }

  private updateDebouncedHoverHandler() {
    if (this.hoverDebounceTime > 0) {
      this.debouncedHandleHover = debounce(this.handleHover.bind(this), this.hoverDebounceTime);
    } else {
      this.debouncedHandleHover = null;
    }
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

  // #region Hover 事件处理

  /** hover 事件监听器释放函数（与 click/contextmenu 分开管理，以便独立启停） */
  private hoverDisposeListeners: Array<() => void> = [];

  private registerHoverEventHandlers() {
    const disposeHover = this.emitter.on(MAP_EVENT.MAP_HOVER, (detail) => {
      if (this.hoverDebounceTime > 0 && this.debouncedHandleHover) {
        this.debouncedHandleHover(detail);
      } else {
        this.handleHover(detail);
      }
    });
    this.hoverDisposeListeners.push(disposeHover);
  }

  private unregisterHoverEventHandlers() {
    this.debouncedHandleHover?.cancel();
    this.hoverDisposeListeners.forEach((dispose) => dispose());
    this.hoverDisposeListeners = [];
  }

  /**
   * hover 事件核心处理：实体命中检测 + 连接线命中检测，发出 ENTITY_HOVER / CONNECTION_HOVER
   */
  private async handleHover(detail: OLMapHoverEventDetail): Promise<void> {
    const { event } = detail;
    const coordinate = event.coordinate as [number, number] | undefined;
    const pixel = event.pixel as [number, number];

    // — 实体 hover —
    const nonClusteredLayers = this.getNonClusteredLayers().filter((layer) => layer.visible);
    const clusteredLayers = this.getClusteredLayers().filter((layer) => layer.visible);

    if (!coordinate) {
      this.emitter.fire(MAP_EVENT.ENTITY_HOVER, { instance: null, coordinate: null, event });
      this.emitter.fire(MAP_EVENT.CONNECTION_HOVER, { feature: null, renderer: null, event });
      return;
    }

    const allHoveredFeatures: EntityHitTestResult[] = hitTestEntitiesAt(
      { coordinate, pixel, map: event.map },
      nonClusteredLayers,
      clusteredLayers
    );

    if (allHoveredFeatures.length > 0) {
      const selectedLayerFeatures = selectTopmostHitResult(allHoveredFeatures);
      if (selectedLayerFeatures) {
        const features = selectedLayerFeatures.features;
        const feature = features[0];
        const dataInstance = feature.get(EntityInstanceKey) as DataInstance;

        let hoverCoordinate: [number, number];
        if (features.length > 1) {
          const clusterCenter = selectedLayerFeatures.layer.getClosestClusterCenter?.(coordinate);
          hoverCoordinate = (clusterCenter ?? dataInstance.coordinates) as [number, number];
        } else {
          hoverCoordinate = dataInstance.coordinates as [number, number];
        }

        this.emitter.fire(MAP_EVENT.ENTITY_HOVER, { instance: dataInstance, coordinate: hoverCoordinate, event });
      } else {
        this.emitter.fire(MAP_EVENT.ENTITY_HOVER, { instance: null, coordinate: null, event });
      }
      // 实体层已命中，跳过连接线检测
      this.emitter.fire(MAP_EVENT.CONNECTION_HOVER, { feature: null, renderer: null, event });
      return;
    }

    this.emitter.fire(MAP_EVENT.ENTITY_HOVER, { instance: null, coordinate: null, event });

    // — 连接线 hover（仅在实体层未命中时检测）—
    const connectionRenderers = this.getConnectionRenderers().filter((r) => r.visible);
    const visibleRenderers = connectionRenderers.filter((r) => r.getConnectionVisible());
    if (visibleRenderers.length === 0) {
      this.emitter.fire(MAP_EVENT.CONNECTION_HOVER, { feature: null, renderer: null, event });
      return;
    }

    for (const renderer of visibleRenderers) {
      const hoveredFeatures = await renderer.getConnectionFeatures(pixel);
      if (hoveredFeatures.length > 0) {
        this.emitter.fire(MAP_EVENT.CONNECTION_HOVER, { feature: hoveredFeatures[0], renderer, event });
        return;
      }
    }

    this.emitter.fire(MAP_EVENT.CONNECTION_HOVER, { feature: null, renderer: null, event });
  }

  // #endregion
}
