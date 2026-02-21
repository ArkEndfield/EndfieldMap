import type { MapCoordinate } from '@endfieldmap/map-core/types/coordinate';

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
    level: number;
    index: number;
  }[];
}
