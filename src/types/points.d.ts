export interface PointData {
  levelLogicId: number;
  sceneId: string;
  position: { x: number; y: number; z: number };
  entityDataIdKey: string;
  reward_id?: string;
}

export type PointType = {
  [key: string]: PointData[];
};
