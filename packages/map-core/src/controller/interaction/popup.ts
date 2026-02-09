import { MAP_EVENT } from '@endfieldmap/map-core/const/event';
import { DEFAULT_ICON_SIZE } from '@endfieldmap/map-core/const/map';
import type { EndfieldMapEmitter } from '@endfieldmap/map-core/event/emitter';
import type { EndfieldMap } from '@endfieldmap/map-core/render/olmap';
import type { DataInstance, DisposeListener } from '@endfieldmap/map-core/types/event';
import { logger } from '@endfieldmap/tools';
import type { Coordinate } from 'ol/coordinate';
import Overlay from 'ol/Overlay';

/**
 * PopupController
 * 管理桌面端popup的Overlay定位
 * 不负责DOM创建和显示控制，只负责位置管理
 */
export class PopupController {
  /** 桌面端Overlay */
  private overlay: Overlay | null = null;
  /** 当前激活的feature */
  private currentFeature: DataInstance | null = null;
  /** 事件监听器释放函数 */
  private disposeListeners: DisposeListener[] = [];
  /** 地图实例 */
  private mapInstance: EndfieldMap;
  /** 事件发射器 */
  private emitter: EndfieldMapEmitter;

  constructor(mapInstance: EndfieldMap, emitter: EndfieldMapEmitter) {
    this.mapInstance = mapInstance;
    this.emitter = emitter;
    this.registerEventHandlers();
  }

  /**
   * 注册事件处理器
   */
  private registerEventHandlers() {
    // 监听激活feature变化事件，更新Overlay位置
    const disposeActiveFeatureChange = this.emitter.on(MAP_EVENT.ACTIVE_FEATURE_CHANGE, (event) => {
      const { newFeature, coordinate } = event;
      this.currentFeature = newFeature;

      if (newFeature && coordinate) {
        this.updateOverlayPosition(coordinate);
      } else {
        this.clearOverlayPosition();
      }
    });

    this.disposeListeners.push(disposeActiveFeatureChange);
  }

  /**
   * 更新Overlay位置
   * @param coordinate 坐标
   */
  private updateOverlayPosition(coordinate: Coordinate) {
    if (!this.overlay) return;

    this.overlay.setPosition(coordinate);
    logger.debug('[PopupController] Updated overlay position', coordinate);
  }

  /**
   * 清除Overlay位置
   */
  private clearOverlayPosition() {
    if (!this.overlay) return;
    // 不再立即清空位置，避免打断 React 的退出动画
    // 仅记录日志，真正的隐藏由 React 控制（通过 activeFeature 变化触发）
    logger.debug('[PopupController] Cleared overlay position (handled by React)');
  }

  /**
   * 设置Overlay元素（由React组件提供）
   * @param element HTML元素
   */
  public setOverlayElement(element: HTMLElement | null) {
    // 清理旧的overlay
    if (this.overlay) {
      this.mapInstance.map.removeOverlay(this.overlay);
      this.overlay = null;
    }

    if (!element) return;

    // 创建新的overlay
    this.overlay = new Overlay({
      element,
      autoPan: false,
      offset: [0, -DEFAULT_ICON_SIZE * 2],
      positioning: 'bottom-left',
      className: 'endfieldmap-popup-overlay',
    });

    this.mapInstance.map.addOverlay(this.overlay);

    // 如果有当前feature，立即更新位置
    if (this.currentFeature) {
      this.updateOverlayPosition(this.currentFeature.coordinates);
    }

    logger.debug('[PopupController] Overlay element set');
  }

  /**
   * 获取当前feature
   */
  public get feature(): DataInstance | null {
    return this.currentFeature;
  }

  /**
   * 更新popup位置（桌面端）
   * 当地图视图改变时可能需要调用
   */
  public updatePosition() {
    if (!this.currentFeature || !this.overlay) return;

    this.overlay.panIntoView({
      animation: {
        duration: 250,
      },
      margin: 60,
    });
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
      this.mapInstance.map.removeOverlay(this.overlay);
      this.overlay = null;
    }

    this.currentFeature = null;

    logger.debug('[PopupController] Disposed');
  }
}
