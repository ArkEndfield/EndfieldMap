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

// 让出主线程的辅助函数
const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));

// 分批处理数组的辅助函数
async function processBatch<T, U>(
  items: T[],
  batchSize: number,
  processFn: (item: T) => U,
  progressCallback?: (processedCount: number, total: number) => void
): Promise<U[]> {
  const results: U[] = [];
  const total = items.length;

  for (let i = 0; i < total; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = batch.map(processFn);
    results.push(...batchResults);

    if (progressCallback) {
      progressCallback(Math.min(i + batchSize, total), total);
    }

    // 每处理完一批数据，让出主线程
    if (i + batchSize < total) {
      await yieldToMain();
    }
  }

  return results;
}

// 筛选并更新点位数据的通用函数
export async function filterAndUpdatePoints(
  mapId: string
): Promise<PointData[]> {
  console.log('开始筛选和更新点位数据...');

  // 获取所有点位数据
  const allPoints = (await getAllPoints()) || [];
  const customPoints = (await getCustomPoints()) || [];
  console.log('原始点位数量:', allPoints.length);
  console.log('自定义点位数量:', customPoints.length);

  const mergedPoints = [...allPoints, ...customPoints];
  console.log('合并后的点位数量:', mergedPoints.length);

  // 让出主线程
  await yieldToMain();

  // 根据地图ID创建筛选函数
  const filterFn = (point: PointData) => {
    const isMap2 = mapId === 'map002';
    return isMap2
      ? point.sceneId.includes('map02')
      : point.sceneId.includes('map01');
  };

  // 分批处理筛选，每次处理5000个点位
  const batchSize = 5000;
  const filteredPoints = await processBatch(
    mergedPoints,
    batchSize,
    point => (filterFn(point) ? point : null),
    (processed, total) => {
      console.log(`筛选进度: ${processed}/${total}`);
    }
  ).then(results => results.filter(Boolean) as PointData[]);

  console.log('筛选后的点位数量:', filteredPoints.length);

  // 让出主线程
  await yieldToMain();

  // 更新过滤后的点位到 IndexedDB
  await setItem(DB_CURRENT_POINTS_KEY, filteredPoints, StorageType.PERMANENT);
  console.log('点位数据已更新到 IndexedDB');

  // 验证数据是否存储成功
  const storedPoints = await getCurrentPoints();
  console.log('从 IndexedDB 读取的点位数量:', storedPoints.length);

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
