import { loadJSON } from '@/utils/jsonLoader';

export interface OriginPointData {
  sceneId: string;
  position: { x: number; y: number; z: number };
  entityDataIdKey: string;
  properties?: Array<
    | {
        key: string;
        value: {
          type: number;
          valueArray: Array<{
            valueBit64?: number;
            valueString?: string;
          }>;
        };
      }
    | {
        key: 'reward_id';
        value: string[];
      }
  >;
}

export interface PointData extends OriginPointData {
  seq: number;
}

export type PointType = {
  [key: string]: PointData[];
};

export const points: PointData[] = [];

// 加载点位数据
export async function loadPoints() {
  try {
    const data = await loadJSON<Record<string, OriginPointData[]>>(
      '/data/output.json'
    );
    points.length = 0; // 清空数组
    let index = 1;

    // 遍历所有场景的点位数据
    Object.values(data).forEach(scenePoints => {
      scenePoints.forEach(point => {
        if (point) {
          // 确保点位数据存在
          points.push({
            ...point,
            seq: index++,
          });
        }
      });
    });

    // 根据当前地图ID筛选点位
    const currentMapId = localStorage.getItem('map') || 'map001';
    const filteredPoints = points.filter(point => {
      const isMap2 = currentMapId === 'map002';
      return isMap2
        ? point.sceneId.includes('map02')
        : point.sceneId.includes('map01');
    });

    // 更新点位数组
    points.length = 0;
    filteredPoints.forEach((point, index) => {
      points.push({
        ...point,
        seq: index + 1,
      });
    });

    console.log(`加载了 ${points.length} 个点位数据`);
    return points;
  } catch (error) {
    console.error('加载点位数据失败:', error);
    throw error;
  }
}

// 更新点位数据
export async function updatePoints(mapId: string) {
  try {
    points.length = 0; // 清空数组
    const data = await loadPoints(); // 重新加载点位数据

    // 根据地图ID筛选点位
    const filteredPoints = data.filter(point => {
      const isMap2 = mapId === 'map002';
      return isMap2
        ? point.sceneId.includes('map02')
        : point.sceneId.includes('map01');
    });

    // 更新点位数组
    points.length = 0;
    filteredPoints.forEach((point, index) => {
      points.push({
        ...point,
        seq: index + 1,
      });
    });

    console.log(`地图 ${mapId} 加载了 ${points.length} 个点位`);
    return points;
  } catch (error) {
    console.error('更新点位数据失败:', error);
    throw error;
  }
}

// 移除直接的初始化调用，改为在App.vue中控制初始化
// updatePoints(localStorage.getItem('map') || 'map001');
