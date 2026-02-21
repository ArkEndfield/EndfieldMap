import type { MapCoordinate } from '@endfieldmap/map-core/types/coordinate';

/**
 * 抽象地图视图接口
 * 封装不同渲染引擎的视图操作
 */
export interface IMapView {
  getZoom(): number | undefined;
  getCenter(): MapCoordinate | undefined;
  animate(options: { center?: MapCoordinate; zoom?: number; duration?: number }): void;
  setAdjustView(adjust: boolean): void;
}
