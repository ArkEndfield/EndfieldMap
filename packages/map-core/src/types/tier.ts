import type { MapCoordinate } from '@endfieldmap/map-core/types/coordinate';
import type { MapData } from '@endfieldmap/map-core/types/map';

export interface GridTierItem {
  id: string;
  name: string;
  level: number;
  lb: MapCoordinate;
  rt: MapCoordinate;
  center: MapCoordinate;
  items: {
    id: string;
    name: string;
    imagePath: string;
    /** 对应的游戏内 Tier 体积 mapRegionId（即标点数据里的 mapRegionId） */
    regionId: number;
    level: number;
    index: number;
    /** 分层图精确覆盖的游戏坐标范围（来自 tier_volumes.json）；缺省时按分组 lb 锚定、按图片尺寸推算 */
    bounds?: TierImageBounds;
  }[];
}

/** 游戏坐标（x, z）下的矩形范围 */
export interface TierImageBounds {
  lb: MapCoordinate;
  rt: MapCoordinate;
}

interface TierVolumeShapeBase {
  /** 枢轴的游戏 x 坐标 */
  x: number;
  /** 枢轴的游戏 z 坐标 */
  z: number;
  /** 绕竖直轴的偏航角（度） */
  yaw: number;
  /** 高度范围（游戏 y，闭区间） */
  yMin: number;
  yMax: number;
}

/** 盒体：局部坐标系下 |x| ≤ halfX 且 |z| ≤ halfZ */
export interface TierVolumeBox extends TierVolumeShapeBase {
  type: 'box';
  halfX: number;
  halfZ: number;
}

/** 多边形柱体：points 是局部坐标系下的顶点 [x, z]，按奇偶规则判定 */
export interface TierVolumePolygon extends TierVolumeShapeBase {
  type: 'polygon';
  points: MapCoordinate[];
}

export type TierVolumeShape = TierVolumeBox | TierVolumePolygon;

/**
 * 关卡里的一个 Tier 体积（tier_volumes.json，endfield-workflow maps 域产出）。
 * 某点属于哪个分层的规则与数据管线给标点分配 mapRegionId 的一致：
 * 只看所在关卡的体积，priority 最高者胜，同级取列表靠前者。
 */
export interface TierVolume {
  /** mapRegionId：与标点的 mapRegionId、分层图文件名的 `_tier_{id}` 后缀一致 */
  regionId: number;
  priority: number;
  shapes: TierVolumeShape[];
  /** 该分层的叠加图；游戏里没有叠加图的分层缺省 */
  image?: TierImageBounds & {
    /** 图片文件名（不含扩展名），即 grid_tiers.json items 的值 */
    stem: string;
    /** 名称的 lang hash，即 grid_tiers.json items 的键 */
    name: string;
  };
}

/** 由 mapRegionId 反查分层图层所需的定位信息 */
export interface TierRegionRef {
  mapId: MapData['id'];
  /** grid tier id（GridTierItem.id） */
  tierId: string;
  /** 子层 id（GridTierItem.items[].id） */
  subTierId: string;
}
