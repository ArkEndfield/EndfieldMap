import { loadJSON } from '@/utils/jsonLoader';
import { type PointData } from './points';

export interface RewardItemWithCountItem {
  id: string;
  count: number;
}

export interface RewardItemWithCount {
  itemBundles: RewardItemWithCountItem[];
}

export interface RewardItemWitoutCount {
  itemIds: string[];
}

export interface ReturnRewardItem {
  type: 'withCount' | 'withoutCount';
  id: string;
  icon: string;
  count?: number;
}

export type RewardItem = RewardItemWithCount | RewardItemWitoutCount;

export type RewardType = Record<string, RewardItem>;

export interface RewardItemData {
  id: string;
  iconId: string;
  rarity: number;
  valuableTabType: string;
  obtainWays: {
    id: string;
    iconId: string;
  }[];
}

// 奖励数据
export const rewards: RewardType = {};

export const rewardData: Record<string, RewardItemData> = {};

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
    // 清空当前数据
    Object.keys(data).forEach(key => {
      delete rewards[key];
    });
    // 清空当前图片数据
    Object.keys(rewardData).forEach(key => {
      delete rewardData[key];
    });
    // 添加新数据
    Object.entries(data).forEach(([key, value]) => {
      rewards[key] = value;
    });
    // 添加图片数据
    Object.entries(rewardsDataData).forEach(([key, value]) => {
      rewardData[key] = value;
    });

    console.log('奖励列表加载完成，总数:', Object.keys(data).length);
    console.log('奖励数据数据加载完成，总数:', Object.keys(rewardData).length);
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

export function isRewardWithCount(name?: keyof RewardType): boolean {
  if (!name) return false;
  return rewards[name] && 'itemBundles' in rewards[name];
}

export function shouldShowRewards(point: PointData | null): boolean {
  if (!point) return false;
  return !!point.reward_id;
}

export function getRewardIcon(rewardId: string): string | undefined {
  const name = rewardData[rewardId].iconId;
  if (!name) return undefined;
  return `/item/${name}.png`;
}

export function getRewards(point: PointData | null): ReturnRewardItem[] {
  if (!point) return [];
  const rewardId = point.reward_id;
  if (!rewardId) return [];
  const rwds: ReturnRewardItem[] = [];
  const rewardItem = rewards[rewardId];
  if (isRewardWithCountType(rewardItem)) {
    for (const itemBundle of rewardItem.itemBundles) {
      rwds.push({
        type: 'withCount',
        id: itemBundle.id,
        icon: getRewardIcon(itemBundle.id) || '',
        count: itemBundle.count,
      });
    }
  } else {
    rwds.push(
      ...rewardItem.itemIds.map(
        id =>
          ({
            type: 'withoutCount',
            id,
            icon: getRewardIcon(id) || '',
          } satisfies ReturnRewardItem)
      )
    );
  }
  return rwds;
}

export function isRewardItemWithCount(
  item: ReturnRewardItem
): item is ReturnRewardItem & { count: number } {
  return item.type === 'withCount' && typeof item.count === 'number';
}
