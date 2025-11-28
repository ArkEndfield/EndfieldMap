import { EntityController } from '@endfieldmap/map-core/controller/entity';
import { ElectricPoleController } from '@endfieldmap/map-core/controller/electric_pole';
import { CustomPointController } from '@endfieldmap/map-core/controller/custom_point';
import mapEventEmitter from '@endfieldmap/map-core/event/emitter';
import { MAP_EVENT } from '@endfieldmap/map-core/const/event';
import { EntityInstanceKey } from '@endfieldmap/map-core/const/map';
import { boundingExtent } from 'ol/extent';
import type { ConnectionFeature, MapFeature } from '@endfieldmap/map-core/render/source/feature/feature';
import type { ElectricPoleConnectionLayer } from '@endfieldmap/map-core/render/layers/electric_pole_connection';
import {
  hitTestEntitiesAt,
  selectTopmostHitResult,
  type EntityHitTestResult,
} from '@endfieldmap/map-core/event/entity_hit_test';

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
      const electricPoleLayers = this.electricPoleController.currentMapAllEntityLayers.filter((layer) => layer.visible);
      const customPointLayers = this.customPointController.layerContainer ? [this.customPointController.layerContainer].filter((layer) => layer.visible) : [];
      const entityLayers = this.entityController.currentMapAllLayers.filter((layer) => layer.visible);

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
        const connectionLayer = this.electricPoleController.currentConnectionLayer;
        if (!connectionLayer || !connectionLayer.layer.getVisible()) return;

        const clickedFeatures = await connectionLayer.layer.getFeatures(event.pixel as [number, number]);
        if (clickedFeatures.length === 0) return;
        const feature = clickedFeatures[0];
        const instance = feature.get(EntityInstanceKey) as ConnectionFeature;
        mapEventEmitter.fire(MAP_EVENT.CONNECTION_CLICK, {
          feature: feature,
          instance,
          layer: connectionLayer as ElectricPoleConnectionLayer,
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
        const instances = features.map((r) => r.get(EntityInstanceKey) as MapFeature);
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
        const instance = feature.get(EntityInstanceKey) as MapFeature;
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
      const electricPoleLayers = this.electricPoleController.currentMapAllEntityLayers.filter((layer) => layer.visible);
      const customPointLayers = this.customPointController.layerContainer ? [this.customPointController.layerContainer].filter((layer) => layer.visible) : [];
      const entityLayers = this.entityController.currentMapAllLayers.filter((layer) => layer.visible);

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
        const connectionLayer = this.electricPoleController.currentConnectionLayer;
        if (!connectionLayer || !connectionLayer.layer.getVisible()) return;

        const clickedFeatures = await connectionLayer.layer.getFeatures(detail.pixel);
        if (clickedFeatures.length === 0) return;

        mapEventEmitter.fire(MAP_EVENT.CONNECTION_CONTEXT_MENU, {
          feature: clickedFeatures[0],
          layer: connectionLayer as ElectricPoleConnectionLayer,
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
      const instance = feature.get(EntityInstanceKey) as MapFeature;

      mapEventEmitter.fire(MAP_EVENT.ENTITY_CONTEXT_MENU, {
        instance,
        feature,
        layer: selectedLayerFeatures.layer,
        event: detail,
      });
    });
  }
}
