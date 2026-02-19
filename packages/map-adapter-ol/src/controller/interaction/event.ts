import { CustomPointController } from '@endfieldmap/map-adapter-ol/controller/entity/custom_point_controller';
import { ElectricPoleController } from '@endfieldmap/map-adapter-ol/controller/entity/electric_pole_controller';
import { EntityController } from '@endfieldmap/map-adapter-ol/controller/entity/entity_controller';
import {
  type EntityHitTestResult,
  hitTestEntitiesAt,
  selectTopmostHitResult,
} from '@endfieldmap/map-adapter-ol/event/entity_hit_test';
import type { OLMapEventPayloads } from '@endfieldmap/map-adapter-ol/types/event';
import { MAP_EVENT } from '@endfieldmap/map-core/const/event';
import { ConnectionTargetIdKey, EntityInstanceKey } from '@endfieldmap/map-core/const/map';
import type { EntityDataInstance } from '@endfieldmap/map-core/data/entity';
import type { ElectricPoleDataInstance } from '@endfieldmap/map-core/data/entity/electric_pole';
import type { EndfieldMapEmitter } from '@endfieldmap/map-core/event/emitter';
import { boundingExtent } from 'ol/extent';

export interface EventControllerConfig {
  entityController: EntityController;
  electricPoleController: ElectricPoleController;
  customPointController: CustomPointController;
  emitter: EndfieldMapEmitter<OLMapEventPayloads>;
}

export class EventController {
  private entityController: EntityController;
  private electricPoleController: ElectricPoleController;
  private customPointController: CustomPointController;
  private emitter: EndfieldMapEmitter<OLMapEventPayloads>;

  constructor(config: EventControllerConfig) {
    this.entityController = config.entityController;
    this.electricPoleController = config.electricPoleController;
    this.customPointController = config.customPointController;
    this.emitter = config.emitter;
    this.registerClickEventHandlers();
    this.registerContextMenuEventHandlers();
  }

  private registerClickEventHandlers() {
    // 点击事件
    this.emitter.on(MAP_EVENT.MAP_CLICK, async (event) => {
      // 获取所有当前显示的电线杆渲染器（每种设备类型一个）
      const electricPoleLayers = this.electricPoleController.render.currentPoleRenderers.filter((r) => r.visible);
      // 获取所有当前显示的自定义标点渲染器（每种类型一个）
      const customPointLayers = this.customPointController.currentRenderer.filter((r) => r.visible);
      const entityLayers = this.entityController.render.currentRenderer.filter((layer) => layer.visible);

      const allClickedFeatures: EntityHitTestResult[] = hitTestEntitiesAt(
        {
          coordinate: event.coordinate as [number, number] | undefined,
          pixel: event.pixel as [number, number],
          map: event.map,
        },
        [...electricPoleLayers, ...customPointLayers],
        entityLayers
      );

      // 如果没有命中实体，尝试命中电线连接
      if (allClickedFeatures.length === 0) {
        const renderers = electricPoleLayers;
        for (const renderer of renderers) {
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
            renderer,
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
  }

  private registerContextMenuEventHandlers() {
    this.emitter.on(MAP_EVENT.MAP_CONTEXT_MENU, async (detail) => {
      // 获取所有当前显示的电线杆渲染器
      const electricPoleLayers = this.electricPoleController.render.currentPoleRenderers.filter((r) => r.visible);
      // 获取所有当前显示的自定义标点渲染器
      const customPointLayers = this.customPointController.currentRenderer.filter((r) => r.visible);
      const entityLayers = this.entityController.render.currentRenderer.filter((layer) => layer.visible);

      const allClickedFeatures: EntityHitTestResult[] = hitTestEntitiesAt(
        {
          coordinate: detail.coordinate,
          pixel: detail.pixel,
          map: detail.map,
        },
        [...electricPoleLayers, ...customPointLayers],
        entityLayers
      );

      // 如果没有命中实体，尝试命中电线连接
      if (allClickedFeatures.length === 0) {
        const renderers = electricPoleLayers;
        for (const renderer of renderers) {
          if (!renderer.getConnectionVisible()) continue;

          const clickedFeatures = await renderer.getConnectionFeatures(detail.pixel);
          if (clickedFeatures.length === 0) continue;

          this.emitter.fire(MAP_EVENT.CONNECTION_CONTEXT_MENU, {
            feature: clickedFeatures[0],
            renderer,
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
  }
}
