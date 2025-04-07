import { getItem, setItem, StorageType } from '@/utils/indexedDBStorage';
import { loadJSON } from '@/utils/jsonLoader';

export interface GuideTextNode {
  type: 'text';
  text: string;
  color?: string;
  fontSize?: number;
  fontWeight?: number;
  fontFamily?: string;
}
export interface GuideImageNode {
  type: 'image';
  src: string;
}
export type NodeType = {
  type: 'node';
  nodes: (GuideTextNode | GuideImageNode | NodeType)[];
};

export interface GuideInfoDetail {
  nodes: NodeType[];
  video: {
    link?: string | null;
  };
}

export type GuideInfo = Record<string | number, GuideInfoDetail>;

const DBGuidesKey = 'guides';

export async function getAllGuidesData(): Promise<GuideInfo> {
  const guidesData = await getItem<GuideInfo>(
    DBGuidesKey,
    StorageType.PERMANENT
  );
  return guidesData || {};
}

export async function loadGuidesData() {
  try {
    const guidesData = await loadJSON<GuideInfo>('/data/guide.json');

    // 存储到 IndexedDB
    await setItem(DBGuidesKey, guidesData, StorageType.PERMANENT);

    console.log('攻略列表加载完成，总数:', Object.keys(DBGuidesKey).length);

    return guidesData;
  } catch (error) {
    console.error('加载攻略数据失败:', error);
    throw error;
  }
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
