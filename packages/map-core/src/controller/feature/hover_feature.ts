import { DEFAULT_ICON_SIZE, DEFAULT_STROKE_WIDTH } from '@endfieldmap/map-core/const';
import { MAP_EVENT } from '@endfieldmap/map-core/const/event';
import { EntityInstanceKey } from '@endfieldmap/map-core/const/map';
import type { EndfieldMapEmitter } from '@endfieldmap/map-core/event/emitter';
import {
  type EntityHitTestResult,
  hitTestEntitiesAt,
  selectTopmostHitResult,
} from '@endfieldmap/map-core/event/entity_hit_test';
import { HoverLayer } from '@endfieldmap/map-core/render/layers/hover';
import type { EndfieldMap } from '@endfieldmap/map-core/render/olmap';
import type { HitTestableLayer } from '@endfieldmap/map-core/types';
import type { DataInstance } from '@endfieldmap/map-core/types/event';
import type { DisposeListener, MapHoverEventDetail } from '@endfieldmap/map-core/types/event';
import { debounce, logger } from '@endfieldmap/tools';
import { action, observable } from 'mobx';
import type { Coordinate } from 'ol/coordinate';

export interface HoverFeatureControllerConfig {
  getEntityLayers: () => HitTestableLayer[];
  getElectricPoleLayers: () => HitTestableLayer[];
  getCustomPointLayers: () => HitTestableLayer[];
  checkIsActive?: (instance: DataInstance) => boolean;
  disableHoverFeature?: boolean;
  mapInstance: EndfieldMap;
  emitter: EndfieldMapEmitter;
}

/**
 * HoverFeatureController
 * 用于管理当前hover的feature（一次只有一个）
 */
export class HoverFeatureController {
  /** 当前hover的feature */
  @observable accessor hoverFeature: DataInstance | null = null;
  /** 是否开启防抖 */
  @observable accessor debounceTime: number = 0;
  /** 是否禁用 */
  private accessor disabled: boolean = false;
  /** 事件监听器释放函数 */
  private disposeListeners: DisposeListener[] = [];
  /** 获取实体图层的函数 */
  private getEntityLayers: () => HitTestableLayer[];
  /** 获取电线杆图层的函数 */
  private getElectricPoleLayers: () => HitTestableLayer[];
  /** 获取自定义标点图层的函数 */
  private getCustomPointLayers: () => HitTestableLayer[];
  /** 检查 feature 是否激活的函数 */
  private checkIsActive?: (instance: DataInstance) => boolean;
  /** 防抖后的hover处理函数 */
  private debouncedHandleHover: ReturnType<typeof debounce<[MapHoverEventDetail], Promise<void>>> | null = null;
  /** Hover图层 */
  public hoverLayer: HoverLayer;
  /** 地图实例 */
  private mapInstance: EndfieldMap;
  /** 事件发射器 */
  private emitter: EndfieldMapEmitter;

  constructor(config: HoverFeatureControllerConfig) {
    this.getEntityLayers = config.getEntityLayers;
    this.getElectricPoleLayers = config.getElectricPoleLayers;
    this.getCustomPointLayers = config.getCustomPointLayers;
    this.checkIsActive = config.checkIsActive;
    this.disabled = config.disableHoverFeature ?? false;
    this.mapInstance = config.mapInstance;
    this.emitter = config.emitter;
    this.updateDebouncedHoverHandler();

    // 创建HoverLayer实例
    this.hoverLayer = new HoverLayer();
    // 将HoverLayer添加到地图
    this.mapInstance.map.addLayer(this.hoverLayer.layer);

    if (!this.disabled) {
      this.registerEventHandlers();
    }
  }

  /**
   * 更新防抖处理函数
   */
  private updateDebouncedHoverHandler() {
    if (this.debounceTime > 0) {
      this.debouncedHandleHover = debounce(this.handleHover.bind(this), this.debounceTime);
    } else {
      this.debouncedHandleHover = null;
    }
  }

  /**
   * 处理hover事件的核心逻辑
   */
  private async handleHover(detail: MapHoverEventDetail): Promise<void> {
    const { event } = detail;
    const coordinate = event.coordinate as Coordinate | undefined;
    if (!coordinate) {
      // 发出清除hover的事件
      this.emitter.fire(MAP_EVENT.ENTITY_HOVER, {
        instance: null,
        coordinate: null,
        event,
      });
      return;
    }

    const electricPoleLayers = this.getElectricPoleLayers().filter((layer) => layer.visible);
    const customPointLayers = this.getCustomPointLayers().filter((layer) => layer.visible);
    const entityLayers = this.getEntityLayers().filter((layer) => layer.visible);

    const allHoveredFeatures: EntityHitTestResult[] = await hitTestEntitiesAt(
      {
        coordinate,
        pixel: [event.pixel[0], event.pixel[1]],
        map: event.map,
      },
      [...electricPoleLayers, ...customPointLayers],
      entityLayers
    );

    // 如果没有命中任何feature，发出清除hover的事件
    if (allHoveredFeatures.length === 0) {
      this.emitter.fire(MAP_EVENT.ENTITY_HOVER, {
        instance: null,
        coordinate: null,
        event,
      });
      return;
    }

    // 选择最上层的 layer（基于 z-index 和添加顺序）
    const selectedLayerFeatures = selectTopmostHitResult(allHoveredFeatures);
    if (!selectedLayerFeatures) {
      this.emitter.fire(MAP_EVENT.ENTITY_HOVER, {
        instance: null,
        coordinate: null,
        event,
      });
      return;
    }
    const features = selectedLayerFeatures.features;

    // 取第一个feature作为hover target
    const feature = features[0];
    const dataInstance = feature.get(EntityInstanceKey) as DataInstance;

    // 确定hover坐标
    let hoverCoordinate: Coordinate;
    if (features.length > 1) {
      // 聚合情况：使用聚合中心坐标（Cluster feature 的几何中心）
      const clusterCenter = selectedLayerFeatures.layer.getClosestClusterCenter?.(coordinate);
      if (clusterCenter) {
        hoverCoordinate = clusterCenter;
      } else {
        hoverCoordinate = dataInstance.coordinates;
      }
    } else {
      // 单个feature：使用feature自己的坐标
      hoverCoordinate = dataInstance.coordinates;
    }

    // 发出ENTITY_HOVER事件，由UI层处理设置hover状态
    this.emitter.fire(MAP_EVENT.ENTITY_HOVER, {
      instance: dataInstance,
      coordinate: hoverCoordinate,
      event,
    });
  }

  /**
   * 注册事件处理器
   */
  private registerEventHandlers() {
    if (this.disabled) {
      return;
    }
    // 监听MAP_HOVER事件：使用统一的实体命中检测（与 click 共享）
    const disposeHover = this.emitter.on(MAP_EVENT.MAP_HOVER, (detail) => {
      if (this.debounceTime > 0 && this.debouncedHandleHover) {
        this.debouncedHandleHover(detail);
      } else {
        this.handleHover(detail);
      }
    });

    // 监听选择开始事件
    const disposeSelectionStart = this.emitter.on(MAP_EVENT.SELECTION_START, () => {
      if (this.hoverFeature) {
        logger.debug('[HoverFeatureController] Clearing hover feature because selection started');
        this.clearHoverFeature();
      }
    });

    // 监听聚合点击事件
    const disposeClusterClick = this.emitter.on(MAP_EVENT.CLUSTER_CLICK, () => {
      if (this.hoverFeature) {
        logger.debug('[HoverFeatureController] Clearing hover feature because cluster was clicked');
        this.clearHoverFeature();
      }
    });

    // 监听缩放变化事件：缩放会导致聚合拆分/重组，此时原有 hover 圈位置通常已不再对应实际实体
    const disposeZoomChange = this.emitter.on(MAP_EVENT.ZOOM_CHANGE, () => {
      if (this.hoverFeature) {
        logger.debug('[HoverFeatureController] Clearing hover feature because zoom changed');
        this.clearHoverFeature();
      }
    });

    // 监听激活特征变化事件：如果当前 hover 的实体被激活，则立即清除 hover 效果
    const disposeActiveFeatureChange = this.emitter.on(MAP_EVENT.ACTIVE_FEATURE_CHANGE, ({ newFeature }) => {
      if (newFeature && newFeature === this.hoverFeature) {
        logger.debug('[HoverFeatureController] Clearing hover feature because it was activated');
        this.clearHoverFeature();
      }
    });

    this.disposeListeners.push(
      disposeHover,
      disposeSelectionStart,
      disposeClusterClick,
      disposeZoomChange,
      disposeActiveFeatureChange
    );
  }

  /**
   * 设置hover的feature
   * @param feature 要hover的feature，传入null则清除hover状态
   * @param coordinate hover显示的坐标（对于聚合feature使用聚合中心坐标）
   */
  @action
  public setHoverFeature(feature: DataInstance | null, coordinate?: Coordinate | null) {
    // 如果新旧feature相同，不做任何处理
    if (this.hoverFeature === feature) {
      return;
    }

    const oldFeature = this.hoverFeature;

    if (oldFeature) {
      logger.debug('[HoverFeatureController] Unhovered feature', oldFeature.data);
    }

    if (feature) {
      // 如果 feature 已经激活，则不设置 hover
      if (this.checkIsActive?.(feature)) {
        this.clearHoverFeature();
        return;
      }
      logger.debug('[HoverFeatureController] Hovered feature', feature.data);
    }

    this.hoverFeature = feature;

    const hoverCoordinate = coordinate || (feature ? feature.coordinates : null);

    // 更新hover图层效果
    if (feature && hoverCoordinate) {
      const radius = DEFAULT_ICON_SIZE / 2 + DEFAULT_STROKE_WIDTH;
      this.hoverLayer.showHover(hoverCoordinate, radius);
    } else {
      this.hoverLayer.hideHover();
    }

    // 发出hover feature变化事件
    this.emitter.fire(MAP_EVENT.HOVER_FEATURE_CHANGE, {
      oldFeature,
      newFeature: feature,
      coordinate: hoverCoordinate,
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
  public dispose() {
    this.unregisterEventHandlers();
    this.clearHoverFeature();
    // 隐藏hover效果
    this.hoverLayer.hideHover();
    // 从地图中移除hover图层
    this.mapInstance.map.removeLayer(this.hoverLayer.layer);
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
  @action
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

  /**
   * 设置防抖时间
   */
  @action
  public setDebounceTime(time: number) {
    this.debounceTime = time;
    this.updateDebouncedHoverHandler();
  }
}
