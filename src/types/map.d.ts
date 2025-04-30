import type { Coordinate } from 'ol/coordinate';

/**
 * 地图视图状态接口
 */
export interface MapViewState {
  center: Coordinate;
  zoom: number;
  timestamp: number;
}
