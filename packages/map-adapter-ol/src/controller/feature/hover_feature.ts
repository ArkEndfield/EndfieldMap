import { HoverLayer } from '@endfieldmap/map-adapter-ol/render/layers/hover';
import type { EndfieldMap } from '@endfieldmap/map-adapter-ol/render/olmap';
import type { OLMapEventPayloads } from '@endfieldmap/map-adapter-ol/types/event';
import type { DataInstance, DisposeListener, EndfieldMapEmitter } from '@endfieldmap/map-core';
import { DEFAULT_ICON_SIZE, DEFAULT_STROKE_WIDTH, MAP_EVENT } from '@endfieldmap/map-core';
import { logger } from '@endfieldmap/tools';
import { action, observable } from 'mobx';
import type { Coordinate } from 'ol/coordinate';

export interface HoverFeatureControllerConfig {
  checkIsActive?: (instance: DataInstance) => boolean;
  disableHoverFeature?: boolean;
  mapInstance: EndfieldMap;
  emitter: EndfieldMapEmitter<OLMapEventPayloads>;
}

/**
 * HoverFeatureController
 * 用于管理当前hover的feature（一次只有一个）
 *
 * 被动模式：不自行监听 MAP_HOVER 事件，由 EventController 完成命中检测后
 * 通过 ENTITY_HOVER 事件 → map-web service → 调用 setHoverFeature() 设置hover目标。
 * 与 ActiveFeatureController 保持同一模式。
 */
export class HoverFeatureController {
  /** 当前hover的feature */
  @observable accessor hoverFeature: DataInstance | null = null;
  /** 是否禁用 */
  private accessor disabled: boolean = false;
  /** 事件监听器释放函数 */
  private disposeListeners: DisposeListener[] = [];
  /** 检查 feature 是否激活的函数 */
  private checkIsActive?: (instance: DataInstance) => boolean;
  /** Hover图层 */
  public hoverLayer: HoverLayer;
  /** 地图实例 */
  private mapInstance: EndfieldMap;
  /** 事件发射器 */
  private emitter: EndfieldMapEmitter<OLMapEventPayloads>;

  constructor(config: HoverFeatureControllerConfig) {
    this.checkIsActive = config.checkIsActive;
    this.disabled = config.disableHoverFeature ?? false;
    this.mapInstance = config.mapInstance;
    this.emitter = config.emitter;

    // 创建HoverLayer实例
    this.hoverLayer = new HoverLayer();
    // 将HoverLayer添加到地图
    this.mapInstance.map.addLayer(this.hoverLayer.layer);

    if (!this.disabled) {
      this.registerEventHandlers();
    }
  }

  /**
   * 注册事件处理器（仅用于自动清除 hover 状态的场景事件）
   */
  private registerEventHandlers() {
    if (this.disabled) {
      return;
    }

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

    this.disposeListeners.push(disposeSelectionStart, disposeClusterClick, disposeZoomChange, disposeActiveFeatureChange);
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
    // 销毁hover图层
    this.hoverLayer.dispose();
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
   * 设置防抖时间（兼容接口；实际防抖已由 EventController 统一管理）
   */
  public setDebounceTime(_time: number) {
    // 防抖逻辑已迁移至 EventController.setHoverDebounceTime()
  }
}
