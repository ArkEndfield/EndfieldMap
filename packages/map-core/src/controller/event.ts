import { EntityController } from '@endfieldmap/map-core/controller/entity';
import { ElectricPoleController } from '@endfieldmap/map-core/controller/electric_pole';
import mapEventEmitter from '@endfieldmap/map-core/event/emitter';
import { MAP_EVENT } from '@endfieldmap/map-core/const/event';
import { Feature } from 'ol';
import { Point } from 'ol/geom';
import { EntityInstanceKey, FeatureType, FeatureTypeKey } from '@endfieldmap/map-core/const/map';
import { boundingExtent } from 'ol/extent';
import type { MapFeature } from '@endfieldmap/map-core/render/source/feature/feature';
import type { CommonPointEntityLayer } from '@endfieldmap/map-core/render/layers/entity/common_point';
import type { ElectricPoleEntityLayer } from '@endfieldmap/map-core/render/layers/entity/electric_pole';
import type { ElectricPoleConnectionLayer } from '@endfieldmap/map-core/render/layers/electric_pole_connection';
import { logger } from '@endfieldmap/tools';

export interface EventControllerConfig {
  entityController: EntityController;
  electricPoleController: ElectricPoleController;
}

export class EventController {
  private entityController: EntityController;
  private electricPoleController: ElectricPoleController;

  constructor(config: EventControllerConfig) {
    this.entityController = config.entityController;
    this.electricPoleController = config.electricPoleController;
    this.registerClickEventHandlers();
    this.registerContextMenuEventHandlers();
  }

  private registerClickEventHandlers() {
    // 点击事件
    mapEventEmitter.on(MAP_EVENT.MAP_CLICK, async (event) => {
      // 收集所有可见 layers 的 features
      const allClickedFeatures: Array<{
        features: Feature<Point>[];
        layer: CommonPointEntityLayer | ElectricPoleEntityLayer;
      }> = [];

      // 处理电线杆点击（非聚合图层，直接使用命中的要素）
      for (const layer of this.electricPoleController.currentMapAllEntityLayers) {
        if (!layer.visible) continue;
        const clickedFeatures = await layer.layer.getFeatures(event.pixel);
        if (clickedFeatures.length) {
          const features = clickedFeatures.filter(
            (r) => r.get(FeatureTypeKey) === FeatureType.ENTITY
          ) as Feature<Point>[];
          if (features.length > 0) {
            allClickedFeatures.push({ features, layer });
          }
        }
      }

      for (const layer of this.entityController.currentMapAllLayers) {
        // 只处理可见的layer
        if (!layer.visible) continue;

        const clickedFeatures = await layer.layer.getFeatures(event.pixel);
        if (clickedFeatures.length) {
          const features = (clickedFeatures[0].get('features') as Feature<Point>[]).filter(
            (r) => r.get(FeatureTypeKey) === FeatureType.ENTITY
          );
          if (features.length > 0) {
            allClickedFeatures.push({ features, layer });
          }
        }
      }

      if (allClickedFeatures.length === 0) return;

      // 选择最上层的 layer（z-index 最大的，或者最后添加的）
      const selectedLayerFeatures = allClickedFeatures[allClickedFeatures.length - 1];
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
      const allClickedFeatures: Array<{
        features: Feature<Point>[];
        layer: CommonPointEntityLayer | ElectricPoleEntityLayer;
      }> = [];

      // 处理电线杆右键（非聚合图层，直接使用命中的要素）
      for (const layer of this.electricPoleController.currentMapAllEntityLayers) {
        if (!layer.visible) continue;
        const clickedFeatures = await layer.layer.getFeatures(detail.pixel);
        if (clickedFeatures.length) {
          const features = clickedFeatures.filter(
            (r) => r.get(FeatureTypeKey) === FeatureType.ENTITY
          ) as Feature<Point>[];
          if (features.length > 0) {
            allClickedFeatures.push({ features, layer });
          }
        }
      }

      // 处理普通实体右键（聚合图层）
      for (const layer of this.entityController.currentMapAllLayers) {
        if (!layer.visible) continue;

        const clickedFeatures = await layer.layer.getFeatures(detail.pixel);
        if (clickedFeatures.length) {
          const features = (clickedFeatures[0].get('features') as Feature<Point>[]).filter(
            (r) => r.get(FeatureTypeKey) === FeatureType.ENTITY
          );
          if (features.length > 0) {
            allClickedFeatures.push({ features, layer });
          }
        }
      }

      // 如果没有命中实体，尝试命中电线连接（带 hitTolerance，扩大点击范围）
      if (allClickedFeatures.length === 0) {
        const connectionLayer = this.electricPoleController.currentConnectionLayer;
        if (!connectionLayer) return;

        let connectionFeature: Feature | null = null;
        detail.map.forEachFeatureAtPixel(
          detail.pixel,
          (feature, layer) => {
            if (layer === connectionLayer.layer) {
              connectionFeature = feature as Feature;
              return feature;
            }
          },
          {
            hitTolerance: 8,
          }
        );
        if (!connectionFeature) return;
        mapEventEmitter.fire(MAP_EVENT.CONNECTION_CONTEXT_MENU, {
          feature: connectionFeature,
          layer: connectionLayer as ElectricPoleConnectionLayer,
          event: detail,
        });
        return;
      }

      // 选择最上层的 layer
      const selectedLayerFeatures = allClickedFeatures[allClickedFeatures.length - 1];
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
