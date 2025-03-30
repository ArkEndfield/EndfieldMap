import data from '../assets/output.json';

export interface OriginPointData {
  sceneId: string;
  position: { x: number; y: number; z: number };
  entityDataIdKey: string;
  properties?: Array<{
    key: string;
    value: {
      type: number;
      valueArray: Array<{
        valueBit64?: number;
        valueString?: string;
      }>;
    };
  }>;
}

export interface PointData extends OriginPointData {
  seq: number;
}

export type PointType = {
  [key: string]: PointData[];
};

export const points: PointData[] = [];
let index = 1;

export function updatePoints(mapId: string) {
  points.length = 0; // 清空数组
  index = 1; // 重置索引

  for (const [key, value] of Object.entries(
    data as Record<string, OriginPointData[]>
  )) {
    if (!key.includes(mapId === 'map002' ? 'map02' : 'map01')) continue;
    points.push(
      ...value.filter(Boolean).map(item => ({
        ...item,
        seq: index++,
      }))
    );
  }
}

// 初始化点位
updatePoints(localStorage.getItem('map') || 'map001');
