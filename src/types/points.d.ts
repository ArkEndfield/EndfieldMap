import { NodeType } from './guides';

export interface PointData {
  levelLogicId: number | string;
  sceneId: string;
  position: { x: number; y: number; z: number };
  entityDataIdKey: string;
  reward_id?: string;
  dungeion_series_id?: string;
}

export interface CustomPointData {
  nodes: NodeType[];
}

export type PointType = {
  [key: string]: PointData[];
};

export type CustomPointDataType = {
  [key: string]: CustomPointData;
};
