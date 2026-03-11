import type { MapCoordinate } from '@endfieldmap/map-core';

export interface GridTierData {
  lb: MapCoordinate;
  rt: MapCoordinate;
  center: MapCoordinate;
  items: Record<string, string>;
}

export type GridTiersData = Record<string, GridTierData>;
