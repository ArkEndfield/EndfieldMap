import Control from 'ol/control/Control';
import type Map from 'ol/Map';
import type View from 'ol/View';
import mapEventEmitter from '../event/emitter';
import { MAP_EVENT } from '../const';

type ZoomChangeCallback = (zoom: number, minZoom: number, maxZoom: number) => void;

/**
 * 缩放控制器
 * 继承自 OpenLayers Control，管理地图缩放
 */
export class ZoomController extends Control {
  private view: View | null = null;
  private zoomChangeCallbacks: Set<ZoomChangeCallback> = new Set();
  private resolutionListener: (() => void) | null = null;

  constructor() {
    // 创建一个空的 div 作为容器
    const element = document.createElement('div');

    super({
      element: element,
    });
  }

  /**
   * 当控件被添加到地图时调用
   */
  public setMap(map: Map | null): void {
    // 清理旧的监听器
    if (this.resolutionListener) {
      mapEventEmitter.off(MAP_EVENT.ZOOM_CHANGE, this.resolutionListener);
      this.resolutionListener = null;
    }

    super.setMap(map);

    if (map) {
      this.view = map.getView();
      // 监听缩放变化
      this.resolutionListener = () => {
        this.notifyZoomChange();
      };

      mapEventEmitter.on(MAP_EVENT.ZOOM_CHANGE, this.resolutionListener);

      // 初始化时通知一次
      this.notifyZoomChange();
    }
  }

  /**
   * 设置控件的 DOM 元素
   * @param element DOM 元素
   */
  public setElement(element: HTMLElement): void {
    this.element = element;
  }

  /**
   * 通知所有监听器缩放变化
   */
  private notifyZoomChange(): void {
    if (!this.view) return;

    const zoom = this.view.getZoom() ?? 0;
    const minZoom = this.view.getMinZoom() ?? 0;
    const maxZoom = this.view.getMaxZoom() ?? 10;

    this.zoomChangeCallbacks.forEach((callback) => {
      callback(zoom, minZoom, maxZoom);
    });
  }

  /**
   * 添加缩放变化监听器
   * @param callback 回调函数
   * @returns 取消监听的函数
   */
  public onZoomChange(callback: ZoomChangeCallback): () => void {
    this.zoomChangeCallbacks.add(callback);

    // 立即触发一次
    if (this.view) {
      const zoom = this.view.getZoom() ?? 0;
      const minZoom = this.view.getMinZoom() ?? 0;
      const maxZoom = this.view.getMaxZoom() ?? 10;
      callback(zoom, minZoom, maxZoom);
    }

    // 返回取消监听的函数
    return () => {
      this.zoomChangeCallbacks.delete(callback);
    };
  }

  /**
   * 设置缩放级别
   * @param zoom 缩放级别
   * @param animate 是否使用动画
   */
  public setZoom(zoom: number, animate = true): void {
    if (!this.view) return;

    if (animate) {
      this.view.animate({
        zoom: zoom,
      });
    } else {
      this.view.setZoom(zoom);
    }
  }

  /**
   * 获取当前缩放级别
   */
  public getZoom(): number | undefined {
    return this.view?.getZoom();
  }

  /**
   * 获取最小缩放级别
   */
  public getMinZoom(): number | undefined {
    return this.view?.getMinZoom();
  }

  /**
   * 获取最大缩放级别
   */
  public getMaxZoom(): number | undefined {
    return this.view?.getMaxZoom();
  }

  /**
   * 获取 View 实例
   */
  public getView(): View | null {
    return this.view;
  }

  /**
   * 销毁控制器，清理资源
   */
  public dispose(): void {
    if (this.resolutionListener && this.view) {
      this.view.un('change:resolution', this.resolutionListener);
      this.resolutionListener = null;
    }
    this.zoomChangeCallbacks.clear();
    this.view = null;
  }
}
