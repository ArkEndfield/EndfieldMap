import { MAP_EVENT } from '@endfieldmap/map-core/const/event';
import mapEventEmitter from '@endfieldmap/map-core/event/emitter';
import type { MapFeature } from '@endfieldmap/map-core/render/source/feature/feature';
import type { CommonPointEntityLayer } from '@endfieldmap/map-core/render/layers/entity/common_point';
import type { DisposeListener } from '@endfieldmap/map-core/types/event';
import { logger } from '@endfieldmap/tools';
import { action, observable } from 'mobx';

/**
 * ActiveFeatureController
 * 用于管理当前激活的feature（一次只有一个）
 */
export class ActiveFeatureController {
  /** 当前激活的feature */
  @observable accessor activeFeature: MapFeature | null = null;
  /** 事件监听器释放函数 */
  private disposeListeners: DisposeListener[] = [];

  /** 是否禁用 */
  private disabled: boolean = false;

  constructor(config?: { disableActiveFeature?: boolean }) {
    this.disabled = config?.disableActiveFeature ?? false;
    if (!this.disabled) {
      this.registerEventHandlers();
    }
  }

  /**
   * 注册事件处理器
   */
  private registerEventHandlers() {
    // 监听实体可见性变化事件
    const disposeVisibilityChange = mapEventEmitter.on(MAP_EVENT.ENTITY_VISIBILITY_CHANGE, (event) => {
      if (!this.activeFeature) return;

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

      // 检查active feature是否属于被隐藏的layer
      if (hiddenLayers.some((layer) => this.isFeatureInLayer(this.activeFeature!, layer))) {
        logger.debug('[ActiveFeatureController] Clearing active feature because layer was hidden');
        this.clearActiveFeature();
      }
    });

    // 监听选择开始事件
    const disposeSelectionStart = mapEventEmitter.on(MAP_EVENT.SELECTION_START, () => {
      if (this.activeFeature) {
        logger.debug('[ActiveFeatureController] Clearing active feature because selection started');
        this.clearActiveFeature();
      }
    });

    this.disposeListeners.push(disposeVisibilityChange, disposeSelectionStart);
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
   * 设置激活的feature
   * @param feature 要激活的feature，传入null则清除激活状态
   */
  @action
  public setActiveFeature(feature: MapFeature | null) {
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

    // 发出激活feature变化事件
    mapEventEmitter.fire(MAP_EVENT.ACTIVE_FEATURE_CHANGE, {
      oldFeature,
      newFeature: feature,
      coordinate: feature ? feature.coordinates : null,
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
  /**
   * 销毁控制器，清理事件监听器
   */
  public dispose() {
    this.unregisterEventHandlers();
    this.clearActiveFeature();
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
