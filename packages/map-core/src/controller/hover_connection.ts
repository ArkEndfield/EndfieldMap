import { MAP_EVENT } from '@endfieldmap/map-core/const/event';
import mapEventEmitter from '@endfieldmap/map-core/event/emitter';
import type { ElectricPoleConnectionLayer } from '@endfieldmap/map-core/render/layers/electric_pole_connection';
import type { DisposeListener, MapHoverEventDetail } from '@endfieldmap/map-core/types/event';
import { debounce, logger } from '@endfieldmap/tools';
import { action, observable } from 'mobx';
import type { FeatureLike } from 'ol/Feature';

export interface HoverConnectionControllerConfig {
  getConnectionLayer: () => ElectricPoleConnectionLayer | null;
  disableHoverConnection?: boolean;
}

/**
 * HoverConnectionController
 * 用于管理当前hover的connection（一次只有一个）
 */
export class HoverConnectionController {
  /** 当前hover的connection feature */
  @observable accessor hoverFeature: FeatureLike | null = null;
  /** 当前hover的connection所属layer */
  @observable accessor hoverLayer: ElectricPoleConnectionLayer | null = null;
  /** 是否开启防抖 */
  @observable accessor debounceTime: number = 0;
  /** 是否禁用 */
  private disabled: boolean = false;
  /** 事件监听器释放函数 */
  private disposeListeners: DisposeListener[] = [];
  /** 获取连接图层的函数 */
  private getConnectionLayer: () => ElectricPoleConnectionLayer | null;
  /** 防抖后的hover处理函数 */
  private debouncedHandleHover: ReturnType<typeof debounce<[MapHoverEventDetail], Promise<void>>> | null = null;

  constructor(config: HoverConnectionControllerConfig) {
    this.getConnectionLayer = config.getConnectionLayer;
    this.disabled = config.disableHoverConnection ?? false;
    this.updateDebouncedHoverHandler();
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
    const coordinate = event.coordinate;
    if (!coordinate) {
      // 发出清除hover的事件
      mapEventEmitter.fire(MAP_EVENT.CONNECTION_HOVER, {
        feature: null,
        layer: null,
        event,
      });
      return;
    }

    const connectionLayer = this.getConnectionLayer();
    if (!connectionLayer || !connectionLayer.layer.getVisible()) {
      // 发出清除hover的事件
      mapEventEmitter.fire(MAP_EVENT.CONNECTION_HOVER, {
        feature: null,
        layer: null,
        event,
      });
      return;
    }

    const clickedFeatures = await connectionLayer.layer.getFeatures(event.pixel as [number, number]);
    if (clickedFeatures.length === 0) {
      // 发出清除hover的事件
      mapEventEmitter.fire(MAP_EVENT.CONNECTION_HOVER, {
        feature: null,
        layer: null,
        event,
      });
      return;
    }

    // 取第一个feature作为hover target
    const feature = clickedFeatures[0];

    // 发出CONNECTION_HOVER事件，由UI层处理设置hover状态
    mapEventEmitter.fire(MAP_EVENT.CONNECTION_HOVER, {
      feature,
      layer: connectionLayer,
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

    // 监听MAP_HOVER事件：检测连接线的hover
    const disposeHover = mapEventEmitter.on(MAP_EVENT.MAP_HOVER, (detail) => {
      if (this.debounceTime > 0 && this.debouncedHandleHover) {
        this.debouncedHandleHover(detail);
      } else {
        this.handleHover(detail);
      }
    });

    // 监听选择开始事件
    const disposeSelectionStart = mapEventEmitter.on(MAP_EVENT.SELECTION_START, () => {
      if (this.hoverFeature) {
        logger.debug('[HoverConnectionController] Clearing hover connection because selection started');
        this.clearHoverConnection();
      }
    });

    // 监听缩放变化事件
    const disposeZoomChange = mapEventEmitter.on(MAP_EVENT.ZOOM_CHANGE, () => {
      if (this.hoverFeature) {
        logger.debug('[HoverConnectionController] Clearing hover connection because zoom changed');
        this.clearHoverConnection();
      }
    });

    // 监听电线杆变化事件
    const disposeElectricPoleChanged = mapEventEmitter.on(MAP_EVENT.ELECTRIC_POLE_CHANGED, () => {
      if (this.hoverFeature) {
        logger.debug('[HoverConnectionController] Clearing hover connection because electric pole changed');
        this.clearHoverConnection();
      }
    });

    this.disposeListeners.push(disposeHover, disposeSelectionStart, disposeZoomChange, disposeElectricPoleChanged);
  }

  /**
   * 设置hover的connection
   * @param feature 要hover的connection feature，传入null则清除hover状态
   * @param layer 连接所属的图层
   */
  @action
  public setHoverConnection(feature: FeatureLike | null, layer: ElectricPoleConnectionLayer | null) {
    // 如果新旧feature相同，不做任何处理
    if (this.hoverFeature === feature) {
      return;
    }

    const oldFeature = this.hoverFeature;
    const oldLayer = this.hoverLayer;

    if (oldFeature) {
      logger.debug('[HoverConnectionController] Unhovered connection');
    }

    if (feature) {
      logger.debug('[HoverConnectionController] Hovered connection');
    }

    this.hoverFeature = feature;
    this.hoverLayer = layer;

    // 更新旧图层的hover状态
    if (oldLayer && oldFeature) {
      oldLayer.setHoveredFeature(null);
    }

    // 更新新图层的hover状态
    if (layer && feature) {
      layer.setHoveredFeature(feature);
    }

    // 发出hover connection变化事件
    mapEventEmitter.fire(MAP_EVENT.HOVER_CONNECTION_CHANGE, {
      oldFeature,
      newFeature: feature,
      layer,
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
   * 设置防抖时间
   */
  @action
  public setDebounceTime(time: number) {
    this.debounceTime = time;
    this.updateDebouncedHoverHandler();
  }
}
