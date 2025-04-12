import { CACHE_DB_KEY } from '@/constants/db_key';
import type { GuideInfo } from '@/types/guides';
import { getItem, StorageType, setItem } from '@/utils/indexedDBStorage';
import { loadJSON } from '@/utils/jsonLoader';

const DBGuidesKey = CACHE_DB_KEY.GUIDES;

export async function getAllGuidesData(): Promise<GuideInfo> {
  const guidesData = await getItem<GuideInfo>(
    DBGuidesKey,
    StorageType.PERMANENT
  );
  return guidesData || {};
}

export const getGuide = async (id: string | number) => {
  const guides = await getAllGuidesData();
  if (guides[id]) {
    return guides[id];
  } else {
    console.warn(`没有找到ID为 ${id} 的攻略`);
    return null;
  }
};

export async function loadGuidesData() {
  try {
    const guidesData = await loadJSON<GuideInfo>('/data/guide.json');

    // 存储到 IndexedDB
    await setItem(DBGuidesKey, guidesData, StorageType.PERMANENT);

    console.log('攻略列表加载完成，总数:', Object.keys(guidesData).length);

    return guidesData;
  } catch (error) {
    console.error('加载攻略数据失败:', error);
    throw error;
  }
}
