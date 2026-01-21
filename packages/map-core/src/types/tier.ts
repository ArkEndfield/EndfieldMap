import { type TierDataInstance } from '@endfieldmap/map-core/data/tier';
import { type Coordinate } from 'ol/coordinate';

export interface TierData {
  id: string;
  mapIndex: string;
  level: number;
  x: number;
  y: number;
  imageUrl: string;
  extent: [number, number, number, number];
}

export interface GridTierItem {
  id: string;
  name: string;
  level: number;
  lb: Coordinate;
  rt: Coordinate;
  center: Coordinate;
  items: {
    id: string;
    name: string;
    imagePath: string;
    level: number;
    index: number;
  }[];
}

export interface TierRegion {
  mapIndex: string;
  // x: number;
  // y: number;
  tiers: TierDataInstance[];
}
