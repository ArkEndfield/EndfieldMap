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

export const allPoints: PointData[] = [];

export const points: PointData[] = [];

// 筛选并更新点位数据的通用函数
function filterAndUpdatePoints(): PointData[] {
  // 使用通用函数筛选并更新点位
  const mapId = localStorage.getItem('map') || 'map001';
  // 根据地图ID筛选点位
  const filteredPoints = allPoints.filter(point => {
    const isMap2 = mapId === 'map002';
    return isMap2
      ? point.sceneId.includes('map02')
      : point.sceneId.includes('map01');
  });

  // 更新点位数组
  points.length = 0;
  filteredPoints.forEach(point => {
    points.push(point);
  });

  console.log(`地图 ${mapId} 的点位数据已更新，当前点位数量: ${points.length}`);

  return points;
}

// 加载点位数据
export async function loadPoints() {
  try {
    const data = await loadJSON<Record<string, OriginPointData[]>>(
      '/data/output.json'
    );
    points.length = 0; // 清空数组
    let index = 1;

    // 遍历所有场景的点位数据
    // 将所有点位数据存储到 allPoints 中
    Object.values(data).forEach(scenePoints => {
      scenePoints.forEach(point => {
        if (point) {
          // 确保点位数据存在
          allPoints.push({
            ...point,
            seq: index++,
          });
        }
      });
    });

    console.log(`加载了 ${allPoints.length} 个点位数据`);

    // console.log(JSON.stringify(allPoints, null, 2));
    return points;
  } catch (error) {
    console.error('加载点位数据失败:', error);
    throw error;
  }
}

// 更新点位数据
export async function updatePoints() {
  try {
    if (allPoints.length <= 0) {
      await loadPoints();
    }
    filterAndUpdatePoints();
    return points;
  } catch (error) {
    console.error('更新点位数据失败:', error);
    throw error;
  }
}

// 移除直接的初始化调用，改为在App.vue中控制初始化
// updatePoints(localStorage.getItem('map') || 'map001');
