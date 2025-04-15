import { loadJSON } from '@/utils/jsonLoader';
import { getItem, setItem, StorageType } from '@/utils/indexedDBStorage';
import { CACHE_DB_KEY, DATA_DB_KEY } from '@/constants/db_key';
import { PointData } from '@/types/points';
import { mapFileNames, mapFolders } from '@/data/points';

// IndexedDB 存储键名
const DB_ALL_POINTS_KEY = CACHE_DB_KEY.POINTS;
const DB_CURRENT_POINTS_KEY = CACHE_DB_KEY.CURRENT_POINTS;
const DB_CUSTOM_POINTS_KEY = DATA_DB_KEY.CUSTOM_POINTS;

// 从 IndexedDB 获取所有点位
export async function getAllPoints(): Promise<PointData[]> {
  const points = await getItem<PointData[]>(
    DB_ALL_POINTS_KEY,
    StorageType.PERMANENT
  );
  return points || [];
}

export async function getCustomPoints(): Promise<PointData[]> {
  const points = await getItem<PointData[]>(
    DB_CUSTOM_POINTS_KEY,
    StorageType.PERMANENT
  );
  return points || [];
}

// 从 IndexedDB 获取当前过滤后的点位
export async function getCurrentPoints(): Promise<PointData[]> {
  const points = await getItem<PointData[]>(
    DB_CURRENT_POINTS_KEY,
    StorageType.PERMANENT
  );
  return points || [];
}

// 筛选并更新点位数据的通用函数
export async function filterAndUpdatePoints(
  mapId: string
): Promise<PointData[]> {
  // 获取所有点位数据
  const allPoints = (await getAllPoints()) || [];
  const customPoints = (await getCustomPoints()) || [];
  const mergedPoints = [...allPoints, ...customPoints];
  // 根据地图ID筛选点位
  const filteredPoints = mergedPoints.filter(point => {
    const isMap2 = mapId === 'map002';
    return isMap2
      ? point.sceneId.includes('map02')
      : point.sceneId.includes('map01');
  });

  // 更新过滤后的点位到 IndexedDB
  await setItem(DB_CURRENT_POINTS_KEY, filteredPoints, StorageType.PERMANENT);

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
export async function updatePoints(mapId: string) {
  try {
    const allPoints = await getAllPoints();
    if (allPoints.length <= 0) {
      await loadPoints();
    }
    return await filterAndUpdatePoints(mapId);
  } catch (error) {
    console.error('更新点位数据失败:', error);
    throw error;
  }
}
