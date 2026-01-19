import type { Coordinate } from '@endfieldmap/tools';

export interface GridTierData {
  lb: Coordinate;
  rt: Coordinate;
  center: Coordinate;
  items: Record<string, string>;
}

export type GridTiersData = Record<string, GridTierData>;
