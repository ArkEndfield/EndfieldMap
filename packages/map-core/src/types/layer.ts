import type { Coordinate } from 'ol/coordinate';
import type VectorLayer from 'ol/layer/Vector';

/**
 * 可 Hit Test 的图层接口
 * 统一旧架构（EntityLayer）和新架构（Renderer）的接口
 */
export interface HitTestableLayer {
  /** 图层实例 */
  layer: VectorLayer;
  /** 可见性 */
  visible: boolean;
  /** 获取最接近指定坐标的聚合中心坐标（可选，仅聚合图层需要） */
  getClosestClusterCenter?(coordinate: Coordinate): Coordinate | null;
}
