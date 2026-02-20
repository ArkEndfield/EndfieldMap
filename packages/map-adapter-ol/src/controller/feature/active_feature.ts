import { ActiveLayer } from '@endfieldmap/map-adapter-ol/render/layers/active';
import type { EndfieldMap } from '@endfieldmap/map-adapter-ol/render/olmap';
import type { OLMapEventPayloads } from '@endfieldmap/map-adapter-ol/types/event';
import type { DataInstance, DisposeListener,EndfieldMapEmitter } from '@endfieldmap/map-core';
import { DEFAULT_ICON_SIZE, DEFAULT_STROKE_WIDTH, MAP_EVENT } from '@endfieldmap/map-core';
import { logger } from '@endfieldmap/tools';
import { action, observable } from 'mobx';

export interface ActiveFeatureControllerConfig {
  disableActiveFeature?: boolean;
  mapInstance: EndfieldMap;
  emitter: EndfieldMapEmitter<OLMapEventPayloads>;
}

/**
 * ActiveFeatureController
 * 用于管理当前激活的feature（一次只有一个）
 */
export class ActiveFeatureController {
  /** 当前激活的feature */
  @observable accessor activeFeature: DataInstance | null = null;
  /** 事件监听器释放函数 */
  private disposeListeners: DisposeListener[] = [];
  /** 是否禁用 */
  private disabled: boolean = false;
  /** Active图层 */
  public activeLayer: ActiveLayer;
  /** 地图实例 */
  private mapInstance: EndfieldMap;
  /** 事件发射器 */
  private emitter: EndfieldMapEmitter<OLMapEventPayloads>;

  constructor(config: ActiveFeatureControllerConfig) {
    this.disabled = config.disableActiveFeature ?? false;
    this.mapInstance = config.mapInstance;
    this.emitter = config.emitter;

    // 创建ActiveLayer实例
    this.activeLayer = new ActiveLayer();
    // 将ActiveLayer添加到地图
    this.mapInstance.map.addLayer(this.activeLayer.layer);

    if (!this.disabled) {
      this.registerEventHandlers();
    }
  }

  /**
   * 注册事件处理器
   */
  private registerEventHandlers() {
    // 监听选择开始事件
    const disposeSelectionStart = this.emitter.on(MAP_EVENT.SELECTION_START, () => {
      if (this.activeFeature) {
        logger.debug('[ActiveFeatureController] Clearing active feature because selection started');
        this.clearActiveFeature();
      }
    });

    this.disposeListeners.push(disposeSelectionStart);
  }

  /**
   * 设置激活的feature
   * @param feature 要激活的feature，传入null则清除激活状态
   */
  @action
  public setActiveFeature(feature: DataInstance | null) {
    // 如果被禁用或新旧feature相同，不做任何处理
    if (this.disabled || this.activeFeature === feature) {
      return;
    }

    const oldFeature = this.activeFeature;

    // 取消之前激活的feature
    if (oldFeature) {
      oldFeature.setActive(false);
      logger.debug('[ActiveFeatureController] Deactivated feature', oldFeature.data);
    }

    // 激活新的feature
    if (feature && feature.activable) {
      feature.setActive(true);
      logger.debug('[ActiveFeatureController] Activated feature', feature.data);
    } else {
      feature = null;
    }

    this.activeFeature = feature;

    const coordinate = feature ? feature.coordinates : null;

    // 更新active图层效果
    if (feature && coordinate) {
      const radius = DEFAULT_ICON_SIZE / 2 + DEFAULT_STROKE_WIDTH;
      this.activeLayer.showActive(coordinate, radius);
    } else {
      this.activeLayer.hideActive();
    }

    // 发出激活feature变化事件
    this.emitter.fire(MAP_EVENT.ACTIVE_FEATURE_CHANGE, {
      oldFeature,
      newFeature: feature,
      coordinate,
    });
  }

  /**
   * 清除激活状态
   */
  @action
  public clearActiveFeature() {
    this.setActiveFeature(null);
  }

  /**
   * 销毁控制器，清理事件监听器
   */
  public dispose() {
    this.unregisterEventHandlers();
    this.clearActiveFeature();
    // 隐藏active效果
    this.activeLayer.hideActive();
    // 从地图中移除active图层
    this.mapInstance.map.removeLayer(this.activeLayer.layer);
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
      this.clearActiveFeature();
    }
  }
}
