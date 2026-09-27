import type { MapCoordinate } from '@endfieldmap/map-core/types/coordinate';
import type { Position } from '@endfieldmap/map-core/types/position';
import type { TierVolume, TierVolumeShape } from '@endfieldmap/map-core/types/tier';

/** 奇偶规则判定点是否在多边形内 */
function isInPolygon(points: readonly MapCoordinate[], x: number, z: number): boolean {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, zi] = points[i];
    const [xj, zj] = points[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * 游戏坐标点是否在形状内（边界算在内）。
 * 先平移到枢轴，再撤销偏航（即 Unity 在 x/z 平面上的 R(-yaw)），然后在局部坐标系里判定。
 */
export function isInTierShape(shape: TierVolumeShape, { x, y, z }: Position): boolean {
  if (y < shape.yMin || y > shape.yMax) {
    return false;
  }
  let dx = x - shape.x;
  let dz = z - shape.z;
  if (shape.yaw !== 0) {
    const theta = (shape.yaw * Math.PI) / 180;
    const sin = Math.sin(theta);
    const cos = Math.cos(theta);
    [dx, dz] = [dx * cos - dz * sin, dx * sin + dz * cos];
  }
  if (shape.type === 'box') {
    return Math.abs(dx) <= shape.halfX && Math.abs(dz) <= shape.halfZ;
  }
  return isInPolygon(shape.points, dx, dz);
}

/**
 * 游戏坐标点所在的 Tier 体积：priority 最高者胜，同级取列表靠前者，与数据管线给标点分配 mapRegionId 的规则一致。
 * @param volumes 点所在关卡的全部体积（体积只对本关卡生效）
 * @returns 不在任何体积内（地表）时返回 null
 */
export function locateTierVolume(volumes: readonly TierVolume[], position: Position): TierVolume | null {
  let best: TierVolume | null = null;
  for (const volume of volumes) {
    if (
      (best === null || volume.priority > best.priority) &&
      volume.shapes.some((shape) => isInTierShape(shape, position))
    ) {
      best = volume;
    }
  }
  return best;
}
