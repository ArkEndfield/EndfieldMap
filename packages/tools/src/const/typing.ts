import type { MapIndex } from '@endfieldmap/tools/const/data';

export type { Coordinate } from 'ol/coordinate';

export type DataState<T> = {
  [key in MapIndex]: T;
};
