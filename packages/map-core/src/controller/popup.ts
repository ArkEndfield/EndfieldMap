import { MAP_EVENT } from '@endfieldmap/map-core/const/event';
import mapEventEmitter from '@endfieldmap/map-core/event/emitter';
import type { MapFeature } from '@endfieldmap/map-core/render/source/feature/feature';
import type { DisposeListener } from '@endfieldmap/map-core/types/event';
import { logger } from '@endfieldmap/tools';
import type { Map as OlMap } from 'ol';
import type { Point } from 'ol/geom';
import Overlay from 'ol/Overlay';
import { DEFAULT_ICON_SIZE } from '@endfieldmap/map-core/const/map';

export interface PopupControllerConfig {
  /** OpenLayers地图实例 */
  map: OlMap;
}

/**
 * PopupController
 * 管理桌面端popup的Overlay定位
 * 不负责DOM创建和显示控制，只负责位置管理
 */
export class PopupController {
  /** OpenLayers地图实例 */
  private map: OlMap;
  /** 桌面端Overlay */
  private overlay: Overlay | null = null;
  /** 当前激活的feature */
  private currentFeature: MapFeature | null = null;
  /** 事件监听器释放函数 */
  private disposeListeners: DisposeListener[] = [];

  constructor(config: PopupControllerConfig) {
    this.map = config.map;
    this.registerEventHandlers();
  }

  /**
   * 注册事件处理器
   */
  private registerEventHandlers() {
    // 监听激活feature变化事件，更新Overlay位置
    const disposeActiveFeatureChange = mapEventEmitter.on(MAP_EVENT.ACTIVE_FEATURE_CHANGE, (event) => {
      const { newFeature } = event;
      this.currentFeature = newFeature;

      if (newFeature) {
        this.updateOverlayPosition(newFeature);
      } else {
        this.clearOverlayPosition();
      }
    });

    this.disposeListeners.push(disposeActiveFeatureChange);
  }

  /**
   * 更新Overlay位置
   * @param feature feature实例
   */
  private updateOverlayPosition(feature: MapFeature) {
    if (!this.overlay) return;

    const geometry = feature.feature.getGeometry() as Point;
    const coordinate = geometry?.getCoordinates();
    if (!coordinate) return;

    this.overlay.setPosition(coordinate);
    // 确保overlay元素可见
    const element = this.overlay.getElement();
    if (element) {
      element.style.display = '';
    }
    logger.debug('[PopupController] Updated overlay position', coordinate);
  }

  /**
   * 清除Overlay位置
   */
  private clearOverlayPosition() {
    if (!this.overlay) return;
    this.overlay.setPosition(undefined);
    // 确保overlay元素完全隐藏
    const element = this.overlay.getElement();
    if (element) {
      element.style.display = 'none';
    }
    logger.debug('[PopupController] Cleared overlay position');
  }

  /**
   * 设置Overlay元素（由React组件提供）
   * @param element HTML元素
   */
  public setOverlayElement(element: HTMLElement | null) {
    // 清理旧的overlay
    if (this.overlay) {
      this.map.removeOverlay(this.overlay);
      this.overlay = null;
    }

    if (!element) return;

    // 创建新的overlay
    this.overlay = new Overlay({
      element,
      autoPan: {
        animation: {
          duration: 250,
        },
        margin: 250,
      },
      offset: [0, -DEFAULT_ICON_SIZE * 2],
      positioning: 'bottom-center',
    });

    this.map.addOverlay(this.overlay);

    // 如果有当前feature，立即更新位置
    if (this.currentFeature) {
      this.updateOverlayPosition(this.currentFeature);
    }

    logger.debug('[PopupController] Overlay element set');
  }

  /**
   * 获取当前feature
   */
  public get feature(): MapFeature | null {
    return this.currentFeature;
  }

  /**
   * 更新popup位置（桌面端）
   * 当地图视图改变时可能需要调用
   */
  public updatePosition() {
    if (!this.currentFeature || !this.overlay) return;

    const geometry = this.currentFeature.feature.getGeometry() as Point;
    const coordinate = geometry?.getCoordinates();
    if (coordinate) {
      this.overlay.setPosition(coordinate);
    }
  }

  /**
   * 销毁控制器，清理资源
   */
  public dispose() {
    // 清理事件监听器
    this.disposeListeners.forEach((dispose) => dispose());
    this.disposeListeners = [];

    // 清理overlay
    if (this.overlay) {
      this.map.removeOverlay(this.overlay);
      this.overlay = null;
    }

    this.currentFeature = null;

    logger.debug('[PopupController] Disposed');
  }
}
