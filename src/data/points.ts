import { loadJSON } from '@/utils/jsonLoader';

const folders = import.meta.glob('/public/data/map*/*.json');
// 获取 map(id)_lv(id) 文件夹列表，去重
const mapFoldersSet = Object.keys(folders).reduce((acc, path) => {
  const match = path.match(/\/data\/(map\d+_lv\d+)\//);
  if (match) {
    acc.add(match[1]);
  }
  return acc;
}, new Set<string>());
const mapFolders = Array.from(mapFoldersSet);
// 由于每个文件夹下的文件名都一样，所以我们只取第一个文件夹下的所有文件名
const fileNames = Object.keys(folders).reduce((acc, path) => {
  const match = path.match(/\/data\/map\d+_lv\d+\/(.*)\.json/);
  if (match) {
    acc.push(match[1]);
  }
  return acc;
}, [] as string[]);
// 去重
const mapFileNames = Array.from(new Set(fileNames));
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
    const dataPromises: Promise<PointData[]>[] = [];
    // 遍历所有文件夹，加载每个文件夹下的所有文件
    for (const folder of mapFolders) {
      for (const fileName of mapFileNames) {
        const path = `/data/${folder}/${fileName}.json`;
        dataPromises.push(
          loadJSON<PointData[]>(path).then(data => {
            // console.log(`加载了 ${path} 数据`);
            return data.map(point => {
              // 处理点位数据
              return {
                ...point,
                sceneId: folder,
              };
            });
          })
        );
      }
    }
    // 等待所有数据加载完成
    const dataArray = await Promise.all(dataPromises);
    const data = dataArray.flat();
    // console.log(data);
    points.length = 0;

    allPoints.push(...data);

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
