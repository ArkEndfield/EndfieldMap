import type { MapCoordinate, TierVolume } from '@endfieldmap/map-core';

export interface GridTierData {
  lb: MapCoordinate;
  rt: MapCoordinate;
  center: MapCoordinate;
  items: Record<string, string>;
}

export type GridTiersData = Record<string, GridTierData>;

/** tier_volumes.json：各关卡的 Tier 体积，用于按三维坐标判定所在分层 */
export interface TierVolumesData {
  version: number;
  /** 关卡 ID -> 该关卡的 Tier 体积 */
  levels: Record<string, TierVolume[]>;
}
