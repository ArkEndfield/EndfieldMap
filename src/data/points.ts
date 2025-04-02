import { loadJSON } from '@/utils/jsonLoader';
import { getItem, setItem, StorageType } from '@/utils/indexedDBStorage';

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

// IndexedDB 存储键名
const DB_ALL_POINTS_KEY = 'allPoints';
const DB_CURRENT_POINTS_KEY = 'currentPoints';

// 从 IndexedDB 获取所有点位
export async function getAllPoints(): Promise<PointData[]> {
  const points = await getItem<PointData[]>(
    DB_ALL_POINTS_KEY,
    StorageType.PERMANENT
  );
  return points || [];
}

// 从 IndexedDB 获取当前过滤后的点位
export async function getCurrentPoints(): Promise<PointData[]> {
  const points = await getItem<PointData[]>(
    DB_CURRENT_POINTS_KEY,
    StorageType.TEMPORARY
  );
  return points || [];
}

// 筛选并更新点位数据的通用函数
async function filterAndUpdatePoints(): Promise<PointData[]> {
  // 使用通用函数筛选并更新点位
  const mapId = localStorage.getItem('map') || 'map001';

  // 获取所有点位数据
  const allPoints = await getAllPoints();

  // 根据地图ID筛选点位
  const filteredPoints = allPoints.filter(point => {
    const isMap2 = mapId === 'map002';
    return isMap2
      ? point.sceneId.includes('map02')
      : point.sceneId.includes('map01');
  });

  // 更新过滤后的点位到 IndexedDB
  await setItem(DB_CURRENT_POINTS_KEY, filteredPoints, StorageType.TEMPORARY);

  console.log(
    `地图 ${mapId} 的点位数据已更新，当前点位数量: ${filteredPoints.length}`
  );

  return filteredPoints;
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

    // 将所有点位存储到 IndexedDB
    await setItem(DB_ALL_POINTS_KEY, data, StorageType.PERMANENT);

    console.log(`加载了 ${data.length} 个点位数据`);

    // console.log(JSON.stringify(allPoints, null, 2));
    return await getCurrentPoints();
  } catch (error) {
    console.error('加载点位数据失败:', error);
    throw error;
  }
}

// 更新点位数据
export async function updatePoints() {
  try {
    const allPoints = await getAllPoints();
    if (allPoints.length <= 0) {
      await loadPoints();
    }
    return await filterAndUpdatePoints();
  } catch (error) {
    console.error('更新点位数据失败:', error);
    throw error;
  }
}

// 移除直接的初始化调用，改为在App.vue中控制初始化
// updatePoints(localStorage.getItem('map') || 'map001');
