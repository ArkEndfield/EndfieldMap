import { type Coordinate } from 'ol/coordinate';

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
