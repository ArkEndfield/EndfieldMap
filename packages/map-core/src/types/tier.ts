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
  }[];
}

/** 由 mapRegionId 反查分层图层所需的定位信息 */
export interface TierRegionRef {
  mapId: MapData['id'];
  /** grid tier id（GridTierItem.id） */
  tierId: string;
  /** 子层 id（GridTierItem.items[].id） */
  subTierId: string;
}
