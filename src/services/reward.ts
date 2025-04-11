import { loadJSON } from '@/utils/jsonLoader';
import { type PointData } from '@/types/points';
import { getItem, setItem, StorageType } from '@/utils/indexedDBStorage';
import { CACHE_DB_KEY } from '@/constants/db_key';
import {
  ReturnRewardItem,
  RewardItem,
  RewardItemData,
  RewardItemWithCount,
  RewardType,
} from '@/types/reward';

// IndexedDB 存储键名
const DB_ALL_REWARDS_KEY = CACHE_DB_KEY.REWARDS;
const DB_ALL_REWARD_DATA_KEY = CACHE_DB_KEY.REWARDS_DATA;

// 从 IndexedDB 获取所有奖励数据
export async function getAllRewards(): Promise<RewardType> {
  const rewards = await getItem<RewardType>(
    DB_ALL_REWARDS_KEY,
    StorageType.PERMANENT
  );
  return rewards || {};
}

// 从 IndexedDB 获取所有奖励物品数据
export async function getAllRewardData(): Promise<
  Record<string, RewardItemData>
> {
  const rewardData = await getItem<Record<string, RewardItemData>>(
    DB_ALL_REWARD_DATA_KEY,
    StorageType.PERMANENT
  );
  return rewardData || {};
}

// 加载奖励数据
export async function loadRewardData() {
  try {
    const rewardRawData = loadJSON<RewardType>('/data/reward.json');
    const rewardDataRaw = loadJSON<Record<string, RewardItemData>>(
      '/data/item_data.json'
    );
    const [data, rewardsDataData] = await Promise.all([
      rewardRawData,
      rewardDataRaw,
    ]);

    // 存储到 IndexedDB
    await setItem(DB_ALL_REWARDS_KEY, data, StorageType.PERMANENT);
    await setItem(
      DB_ALL_REWARD_DATA_KEY,
      rewardsDataData,
      StorageType.PERMANENT
    );

    console.log('奖励列表加载完成，总数:', Object.keys(data).length);
    console.log(
      '奖励数据数据加载完成，总数:',
      Object.keys(rewardsDataData).length
    );

    return { rewards: data, rewardData: rewardsDataData };
  } catch (error) {
    console.error('加载奖励数据失败:', error);
    throw error;
  }
}

export function isRewardWithCountType(
  item: RewardItem
): item is RewardItemWithCount {
  return (item as RewardItemWithCount)?.itemBundles !== undefined;
}

export async function isRewardWithCount(
  name?: keyof RewardType
): Promise<boolean> {
  if (!name) return false;
  const rewards = await getAllRewards();
  return rewards[name] && 'itemBundles' in rewards[name];
}

export function shouldShowRewards(point: PointData | null): boolean {
  if (!point) return false;
  return !!point.reward_id;
}

export async function getRewardIcon(
  rewardId: string
): Promise<string | undefined> {
  const allRewardData = await getAllRewardData();
  if (allRewardData[rewardId]?.iconId) {
    const name = allRewardData[rewardId].iconId;
    if (name) return `/item/${name}.png`;
  }
  return undefined;
}

export async function getRewards(
  point: PointData | null
): Promise<ReturnRewardItem[]> {
  if (!point) return [];
  const rewardId = point.reward_id;
  if (!rewardId) return [];

  const allRewards = await getAllRewards();
  const rewardItem = allRewards[rewardId];

  if (!rewardItem) return [];

  const rwds: ReturnRewardItem[] = [];

  if (isRewardWithCountType(rewardItem)) {
    for (const itemBundle of rewardItem.itemBundles) {
      const icon = await getRewardIcon(itemBundle.id);
      rwds.push({
        type: 'withCount',
        id: itemBundle.id,
        icon: icon || '',
        count: itemBundle.count,
      });
    }
  } else {
    for (const id of rewardItem.itemIds) {
      const icon = await getRewardIcon(id);
      rwds.push({
        type: 'withoutCount',
        id,
        icon: icon || '',
      });
    }
  }

  return rwds;
}
