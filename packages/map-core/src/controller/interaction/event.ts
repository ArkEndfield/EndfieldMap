import { MAP_EVENT } from '@endfieldmap/map-core/const/event';
import { ConnectionTargetIdKey, EntityInstanceKey } from '@endfieldmap/map-core/const/map';
import { CustomPointController } from '@endfieldmap/map-core/controller/entity/custom_point_controller';
import { ElectricPoleController } from '@endfieldmap/map-core/controller/entity/electric_pole_controller';
import { EntityController } from '@endfieldmap/map-core/controller/entity/entity_controller';
import type { ElectricPoleDataInstance } from '@endfieldmap/map-core/data/electric_pole';
import type { EntityDataInstance } from '@endfieldmap/map-core/data/entity';
import mapEventEmitter from '@endfieldmap/map-core/event/emitter';
import {
  type EntityHitTestResult,
  hitTestEntitiesAt,
  selectTopmostHitResult,
} from '@endfieldmap/map-core/event/entity_hit_test';
import { boundingExtent } from 'ol/extent';

export interface EventControllerConfig {
  entityController: EntityController;
  electricPoleController: ElectricPoleController;
  customPointController: CustomPointController;
}

export class EventController {
  private entityController: EntityController;
  private electricPoleController: ElectricPoleController;
  private customPointController: CustomPointController;

  constructor(config: EventControllerConfig) {
    this.entityController = config.entityController;
    this.electricPoleController = config.electricPoleController;
    this.customPointController = config.customPointController;
    this.registerClickEventHandlers();
    this.registerContextMenuEventHandlers();
  }

  private registerClickEventHandlers() {
    // 点击事件
    mapEventEmitter.on(MAP_EVENT.MAP_CLICK, async (event) => {
      const electricPoleLayers = this.electricPoleController.currentRenderer?.visible
        ? [this.electricPoleController.currentRenderer]
        : [];
      const customPointLayers = this.customPointController.layerContainer
        ? [this.customPointController.layerContainer].filter((layer) => layer.visible)
        : [];
      const entityLayers = this.entityController.currentRenderers.filter((layer) => layer.visible);

      const allClickedFeatures: EntityHitTestResult[] = await hitTestEntitiesAt(
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
        const renderer = this.electricPoleController.currentRenderer;
        if (!renderer || !renderer.getConnectionVisible()) return;

        const clickedFeatures = await renderer.getConnectionFeatures(event.pixel as [number, number]);
        if (clickedFeatures.length === 0) return;
        const feature = clickedFeatures[0];
        const instance = feature.get(EntityInstanceKey) as ElectricPoleDataInstance;
        const targetId = feature.get(ConnectionTargetIdKey);
        if (typeof targetId !== 'number') return;
        mapEventEmitter.fire(MAP_EVENT.CONNECTION_CLICK, {
          feature: feature,
          instance,
          targetId,
          renderer,
          event,
        });
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
        mapEventEmitter.fire(MAP_EVENT.CLUSTER_CLICK, {
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
        mapEventEmitter.fire(MAP_EVENT.ENTITY_CLICK, {
          instance,
          feature,
          event,
        });
      }
    });
  }

  private registerContextMenuEventHandlers() {
    mapEventEmitter.on(MAP_EVENT.MAP_CONTEXT_MENU, async (detail) => {
      const electricPoleLayers = this.electricPoleController.currentRenderer?.visible
        ? [this.electricPoleController.currentRenderer]
        : [];
      const customPointLayers = this.customPointController.layerContainer
        ? [this.customPointController.layerContainer].filter((layer) => layer.visible)
        : [];
      const entityLayers = this.entityController.currentRenderers.filter((layer) => layer.visible);

      const allClickedFeatures: EntityHitTestResult[] = await hitTestEntitiesAt(
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
        const renderer = this.electricPoleController.currentRenderer;
        if (!renderer || !renderer.getConnectionVisible()) return;

        const clickedFeatures = await renderer.getConnectionFeatures(detail.pixel);
        if (clickedFeatures.length === 0) return;

        mapEventEmitter.fire(MAP_EVENT.CONNECTION_CONTEXT_MENU, {
          feature: clickedFeatures[0],
          renderer,
          event: detail,
        });
        return;
      }

      // 选择最上层的 layer（基于 z-index 和添加顺序）
      const selectedLayerFeatures = selectTopmostHitResult(allClickedFeatures);
      if (!selectedLayerFeatures) return;
      const features = selectedLayerFeatures.features;

      // 右键只针对单个实体触发上下文菜单，如果命中多个，选择第一个
      const feature = features[0];
      const instance = feature.get(EntityInstanceKey) as EntityDataInstance;

      mapEventEmitter.fire(MAP_EVENT.ENTITY_CONTEXT_MENU, {
        instance,
        feature,
        layer: selectedLayerFeatures.layer,
        event: detail,
      });
    });
  }
}
