import type { ConnectionCapableRenderer } from '@endfieldmap/map-adapter-ol/controller/interaction/event';
import type { OLMapEventPayloads } from '@endfieldmap/map-adapter-ol/types/event';
import type { DisposeListener, EndfieldMapEmitter } from '@endfieldmap/map-core';
import { MAP_EVENT } from '@endfieldmap/map-core';
import { logger } from '@endfieldmap/tools';
import { action, observable } from 'mobx';
import type { FeatureLike } from 'ol/Feature';

export interface HoverConnectionControllerConfig {
  disableHoverConnection?: boolean;
  emitter: EndfieldMapEmitter<OLMapEventPayloads>;
}

/**
 * HoverConnectionController
 * 用于管理当前hover的connection（一次只有一个）
 *
 * 被动模式：不自行监听 MAP_HOVER 事件，由 EventController 完成命中检测后
 * 通过 CONNECTION_HOVER 事件 → map-web service → 调用 setHoverConnection() 设置hover目标。
 * 与 ActiveFeatureController / HoverFeatureController 保持同一模式。
 */
export class HoverConnectionController {
  /** 当前hover的connection feature */
  @observable accessor hoverFeature: FeatureLike | null = null;
  /** 当前hover的connection所属renderer */
  @observable accessor hoverRenderer: ConnectionCapableRenderer | null = null;
  /** 是否禁用 */
  private disabled: boolean = false;
  /** 事件监听器释放函数 */
  private disposeListeners: DisposeListener[] = [];
  /** 事件发射器 */
  private emitter: EndfieldMapEmitter<OLMapEventPayloads>;

  constructor(config: HoverConnectionControllerConfig) {
    this.disabled = config.disableHoverConnection ?? false;
    this.emitter = config.emitter;
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
        logger.debug('[HoverConnectionController] Clearing hover connection because selection started');
        this.clearHoverConnection();
      }
    });

    // 监听缩放变化事件
    const disposeZoomChange = this.emitter.on(MAP_EVENT.ZOOM_CHANGE, () => {
      if (this.hoverFeature) {
        logger.debug('[HoverConnectionController] Clearing hover connection because zoom changed');
        this.clearHoverConnection();
      }
    });

    this.disposeListeners.push(disposeSelectionStart, disposeZoomChange);
  }

  /**
   * 设置hover的connection
   * @param feature 要hover的connection feature，传入null则清除hover状态
   * @param renderer 连接所属的渲染器
   */
  @action
  public setHoverConnection(feature: FeatureLike | null, renderer: ConnectionCapableRenderer | null) {
    // 如果新旧feature相同，不做任何处理
    if (this.hoverFeature === feature) {
      return;
    }

    const oldFeature = this.hoverFeature;
    const oldRenderer = this.hoverRenderer;

    if (oldFeature) {
      logger.debug('[HoverConnectionController] Unhovered connection');
    }

    if (feature) {
      logger.debug('[HoverConnectionController] Hovered connection');
    }

    this.hoverFeature = feature;
    this.hoverRenderer = renderer;

    // 更新旧渲染器的hover状态
    if (oldRenderer && oldFeature) {
      oldRenderer.setHoveredFeature(null);
    }

    // 更新新渲染器的hover状态
    if (renderer && feature) {
      renderer.setHoveredFeature(feature);
    }

    // 发出hover connection变化事件
    this.emitter.fire(MAP_EVENT.HOVER_CONNECTION_CHANGE, {
      oldFeature,
      newFeature: feature,
      renderer,
    });
  }

  /**
   * 清除hover状态
   */
  @action
  public clearHoverConnection() {
    this.setHoverConnection(null, null);
  }

  /**
   * 销毁控制器，清理事件监听器
   */
  public dispose() {
    this.unregisterEventHandlers();
    this.clearHoverConnection();
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
      this.clearHoverConnection();
    }
  }

  /**
   * 设置防抖时间（兼容接口；实际防抖已由 EventController 统一管理）
   */
  public setDebounceTime(_time: number) {
    // 防抖逻辑已迁移至 EventController.setHoverDebounceTime()
  }
}
