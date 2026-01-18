export interface TierData {
  id: string;
  mapIndex: string;
  level: number;
  x: number;
  y: number;
  imageUrl: string;
  extent: [number, number, number, number];
}

export interface TierRegion {
  mapIndex: string;
  x: number;
  y: number;
  tiers: TierData[];
}
