import type { PendingViewAnimation } from '@endfieldmap/map-adapter-maplibre/types';
import { lngLatToPixel, pixelToLngLat } from '@endfieldmap/map-adapter-maplibre/utils/coordinate';
import type { IMapView, MapCoordinate } from '@endfieldmap/map-core';
import { action, observable } from 'mobx';

/**
 * MapLibre 地图视图状态
 *
 * 因 MapLibre RN 使用声明式 React 组件控制相机，
 * 此类通过 MobX 可观察状态作为桥梁：
 *  - 适配器调用 animate() 等方法设置状态
 *  - React 组件观察状态并驱动 MapLibre Camera
 *  - 地图交互后通过 syncFromMap() 回写当前状态
 */
export class MapLibreMapView implements IMapView {
  /** 当前缩放级别（像素空间，与 MapLibre zoom 1:1） */
  @observable accessor currentZoom: number | undefined;

  /**
   * 当前中心点（OL 像素坐标空间）
   * 用于 getCenter() 返回值，与 map-core 的坐标系一致
   */
  @observable accessor currentCenter: MapCoordinate | undefined;

  /**
   * 当前中心点（MapLibre 经纬度坐标）
   * 供 React 组件直接传给 MapLibre Camera
   */
  @observable accessor currentCenterLngLat: [number, number] | undefined;

  /** 待执行的动画，React 组件消费后清空 */
  @observable accessor pendingAnimation: PendingViewAnimation | null = null;

  /** 是否启用视图边界约束 */
  @observable accessor adjustViewEnabled = false;

  getZoom(): number | undefined {
    return this.currentZoom;
  }

  getCenter(): MapCoordinate | undefined {
    return this.currentCenter;
  }

  /**
   * 触发视图动画
   * 将像素坐标转换为经纬度后存入 pendingAnimation，
   * React 组件消费此状态驱动 MapLibre Camera
   */
  @action
  animate(options: { center?: MapCoordinate; zoom?: number; duration?: number }): void {
    const lngLat = options.center ? pixelToLngLat(options.center) : undefined;
    this.pendingAnimation = {
      center: lngLat,
      zoom: options.zoom,
      duration: options.duration,
      timestamp: Date.now(),
    };

    if (options.center) {
      this.currentCenter = options.center;
      this.currentCenterLngLat = lngLat;
    }
    if (options.zoom !== undefined) {
      this.currentZoom = options.zoom;
    }
  }

  @action
  setAdjustView(adjust: boolean): void {
    this.adjustViewEnabled = adjust;
  }

  /**
   * 从 MapLibre 地图状态同步（React 组件交互后调用）
   */
  @action
  syncFromMap(lngLat: [number, number], zoom: number): void {
    this.currentCenterLngLat = lngLat;
    this.currentCenter = lngLatToPixel(lngLat[0], lngLat[1]);
    this.currentZoom = zoom;
  }

  /**
   * 消费待执行动画（React 组件调用，标记已应用）
   */
  @action
  consumeAnimation(): PendingViewAnimation | null {
    const animation = this.pendingAnimation;
    this.pendingAnimation = null;
    return animation;
  }
}
