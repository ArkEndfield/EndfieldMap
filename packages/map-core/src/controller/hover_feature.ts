import { MAP_EVENT } from '@endfieldmap/map-core/const/event';
import { EntityInstanceKey } from '@endfieldmap/map-core/const/map';
import mapEventEmitter from '@endfieldmap/map-core/event/emitter';
import {
  hitTestEntitiesAt,
  selectTopmostHitResult,
  type EntityHitTestResult,
} from '@endfieldmap/map-core/event/entity_hit_test';
import type { MapFeature } from '@endfieldmap/map-core/render/source/feature/feature';
import type { CommonPointEntityLayer } from '@endfieldmap/map-core/render/layers/entity/common_point';
import type { ElectricPoleEntityLayer } from '@endfieldmap/map-core/render/layers/entity/electric_pole';
import type { DisposeListener } from '@endfieldmap/map-core/types/event';
import { logger } from '@endfieldmap/tools';
import { action, observable } from 'mobx';
import type { Coordinate } from 'ol/coordinate';
import type { Point } from 'ol/geom';

export interface HoverFeatureControllerConfig {
  getEntityLayers: () => CommonPointEntityLayer[];
  getElectricPoleLayers: () => ElectricPoleEntityLayer[];
  disableHoverFeature?: boolean;
}

/**
 * HoverFeatureController
 * 用于管理当前hover的feature（一次只有一个）
 */
export class HoverFeatureController {
  /** 当前hover的feature */
  @observable accessor hoverFeature: MapFeature | null = null;
  /** 事件监听器释放函数 */
  private disposeListeners: DisposeListener[] = [];
  /** 获取实体图层的函数 */
  private getEntityLayers: () => CommonPointEntityLayer[];
  /** 获取电线杆图层的函数 */
  private getElectricPoleLayers: () => ElectricPoleEntityLayer[];
  /** 是否禁用 */
  private disabled: boolean = false;

  constructor(config: HoverFeatureControllerConfig) {
    this.getEntityLayers = config.getEntityLayers;
    this.getElectricPoleLayers = config.getElectricPoleLayers;
    this.disabled = config.disableHoverFeature ?? false;
    this.registerEventHandlers();
  }

  /**
   * 注册事件处理器
   */
  private registerEventHandlers() {
    if (this.disabled) {
      return;
    }
    // 监听MAP_HOVER事件：使用统一的实体命中检测（与 click 共享）
    const disposeHover = mapEventEmitter.on(MAP_EVENT.MAP_HOVER, async (detail) => {
      const { event } = detail;
      const coordinate = event.coordinate as Coordinate | undefined;
      if (!coordinate) {
        if (this.hoverFeature !== null) {
          this.setHoverFeature(null, null);
        }
        return;
      }

      const electricPoleLayers = this.getElectricPoleLayers().filter((layer) => layer.visible);
      const entityLayers = this.getEntityLayers().filter((layer) => layer.visible);

      const allHoveredFeatures: EntityHitTestResult[] = await hitTestEntitiesAt(
        {
          coordinate,
          pixel: event.pixel as [number, number],
          map: event.map,
        },
        electricPoleLayers,
        entityLayers
      );

      // 如果没有命中任何feature，清除hover状态
      if (allHoveredFeatures.length === 0) {
        if (this.hoverFeature !== null) {
          this.setHoverFeature(null, null);
        }
        return;
      }

      // 选择最上层的 layer（基于 z-index 和添加顺序）
      const selectedLayerFeatures = selectTopmostHitResult(allHoveredFeatures);
      if (!selectedLayerFeatures) {
        if (this.hoverFeature !== null) {
          this.setHoverFeature(null, null);
        }
        return;
      }
      const features = selectedLayerFeatures.features;

      // 取第一个feature作为hover target
      const feature = features[0];
      const mapFeature = feature.get(EntityInstanceKey) as MapFeature;

      // 确定hover坐标
      let hoverCoordinate: Coordinate;
      if (features.length > 1) {
        // 聚合情况：使用聚合中心坐标（Cluster feature 的几何中心）
        const source = selectedLayerFeatures.layer.layer.getSource();
        const clusterFeature = source?.getClosestFeatureToCoordinate(coordinate);
        const geometry = clusterFeature?.getGeometry();
        if (geometry && geometry.getType() === 'Point') {
          hoverCoordinate = (geometry as Point).getCoordinates();
        } else {
          hoverCoordinate = mapFeature.coordinates;
        }
      } else {
        // 单个feature：使用feature自己的坐标
        hoverCoordinate = mapFeature.coordinates;
      }

      // 更新hover状态
      if (mapFeature !== this.hoverFeature) {
        this.setHoverFeature(mapFeature, hoverCoordinate);
      }
    });

    // 监听实体可见性变化事件
    const disposeVisibilityChange = mapEventEmitter.on(MAP_EVENT.ENTITY_VISIBILITY_CHANGE, (event) => {
      if (!this.hoverFeature) return;

      // 检查是否有layer被隐藏
      let hiddenLayers: CommonPointEntityLayer[] = [];

      if (event.batch) {
        // 批量操作
        if ('layers' in event && event.layers) {
          // 直接隐藏layers的情况
          if (!event.visible) {
            hiddenLayers = event.layers;
          }
        } else if ('changes' in event && event.changes) {
          // toggle操作，从changes中找出被隐藏的layers
          hiddenLayers = event.changes
            .filter((c: { layer: CommonPointEntityLayer; visible: boolean }) => !c.visible)
            .map((c: { layer: CommonPointEntityLayer; visible: boolean }) => c.layer);
        }
      } else {
        // 非批量操作，从layers数组中找出被隐藏的layer
        if (!event.visible && event.layers && event.layers.length > 0) {
          hiddenLayers = event.layers;
        }
      }

      // 检查hover feature是否属于被隐藏的layer
      if (hiddenLayers.some((layer) => this.isFeatureInLayer(this.hoverFeature!, layer))) {
        logger.debug('[HoverFeatureController] Clearing hover feature because layer was hidden');
        this.clearHoverFeature();
      }
    });

    // 监听选择开始事件
    const disposeSelectionStart = mapEventEmitter.on(MAP_EVENT.SELECTION_START, () => {
      if (this.hoverFeature) {
        logger.debug('[HoverFeatureController] Clearing hover feature because selection started');
        this.clearHoverFeature();
      }
    });

    // 监听聚合点击事件
    const disposeClusterClick = mapEventEmitter.on(MAP_EVENT.CLUSTER_CLICK, () => {
      if (this.hoverFeature) {
        logger.debug('[HoverFeatureController] Clearing hover feature because cluster was clicked');
        this.clearHoverFeature();
      }
    });

    // 监听缩放变化事件：缩放会导致聚合拆分/重组，此时原有 hover 圈位置通常已不再对应实际实体
    const disposeZoomChange = mapEventEmitter.on(MAP_EVENT.ZOOM_CHANGE, () => {
      if (this.hoverFeature) {
        logger.debug('[HoverFeatureController] Clearing hover feature because zoom changed');
        this.clearHoverFeature();
      }
    });

    this.disposeListeners.push(
      disposeHover,
      disposeVisibilityChange,
      disposeSelectionStart,
      disposeClusterClick,
      disposeZoomChange
    );
  }

  /**
   * 检查feature是否属于指定的layer
   * @param feature 要检查的feature
   * @param layer 图层
   * @returns 是否属于该layer
   */
  private isFeatureInLayer(feature: MapFeature, layer: CommonPointEntityLayer): boolean {
    // 通过检查layer的entity feature列表来判断
    return layer.entity.features.getArray().some((f) => f === feature);
  }

  /**
   * 设置hover的feature
   * @param feature 要hover的feature，传入null则清除hover状态
   * @param coordinate hover显示的坐标（对于聚合feature使用聚合中心坐标）
   */
  @action
  public setHoverFeature(feature: MapFeature | null, coordinate: Coordinate | null = null) {
    // 如果新旧feature相同，不做任何处理
    if (this.hoverFeature === feature) {
      return;
    }

    const oldFeature = this.hoverFeature;

    if (oldFeature) {
      logger.debug('[HoverFeatureController] Unhovered feature', oldFeature.data);
    }

    if (feature) {
      logger.debug('[HoverFeatureController] Hovered feature', feature.data);
    }

    this.hoverFeature = feature;

    // 发出hover feature变化事件
    mapEventEmitter.fire(MAP_EVENT.HOVER_FEATURE_CHANGE, {
      oldFeature,
      newFeature: feature,
      coordinate: coordinate || (feature ? feature.coordinates : null),
    });
  }

  /**
   * 清除hover状态
   */
  @action
  public clearHoverFeature() {
    this.setHoverFeature(null);
  }

  /**
   * 销毁控制器，清理事件监听器
   */
  /**
   * 销毁控制器，清理事件监听器
   */
  public dispose() {
    this.unregisterEventHandlers();
    this.clearHoverFeature();
  }

  /**
   * 注销事件处理器
   */
  private unregisterEventHandlers() {
    this.disposeListeners.forEach((dispose) => dispose());
    this.disposeListeners = [];
  }

  /**
   * 设置是否启用
   * @param enable 是否启用
   */
  public setEnable(enable: boolean) {
    if (enable === !this.disabled) {
      return;
    }

    this.disabled = !enable;

    if (enable) {
      this.registerEventHandlers();
    } else {
      this.unregisterEventHandlers();
      this.clearHoverFeature();
    }
  }
}
