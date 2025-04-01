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

// 奖励数据
export const rewardData: RewardType = {};

export const rewardImages: Record<string, string> = {};

// 加载奖励数据
export async function loadRewardData() {
  try {
    const rewardRawData = loadJSON<RewardType>('/data/reward.json');
    const imageData = loadJSON<Record<string, string>>(
      '/data/item_icon_dict.json'
    );
    const [data, images] = await Promise.all([rewardRawData, imageData]);
    // 清空当前数据
    Object.keys(data).forEach(key => {
      delete rewardData[key];
    });
    // 清空当前图片数据
    Object.keys(rewardImages).forEach(key => {
      delete rewardImages[key];
    });
    // 添加新数据
    Object.entries(data).forEach(([key, value]) => {
      rewardData[key] = value;
    });
    // 添加图片数据
    Object.entries(images).forEach(([key, value]) => {
      rewardImages[key] = value;
    });

    console.log('奖励数据加载完成，总数:', Object.keys(data).length);
    console.log(
      '奖励图片数据加载完成，总数:',
      Object.keys(rewardImages).length
    );
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
  return rewardData[name] && 'itemBundles' in rewardData[name];
}

export function shouldShowRewards(point: PointData): boolean {
  return (
    !!point.properties &&
    point.properties.some(property => property.key === 'reward_id')
  );
}

export function getRewardIds(point: PointData): string[] | undefined {
  const rewardProperty = point.properties?.find(
    property => property.key === 'reward_id'
  );
  return rewardProperty?.value as string[] | undefined;
}

export function getRewardIcon(rewardId: string): string | undefined {
  const name = rewardImages[rewardId];
  if (!name) return undefined;
  return `/item/${name}.png`;
}

export function getRewards(point: PointData): ReturnRewardItem[] {
  const largeRewards = point.properties?.filter(
    property => property.key === 'reward_id'
  );
  const largeIds = largeRewards?.map(reward => reward.value as string[]);
  const rewardIds = largeIds?.flat();
  const rwds: ReturnRewardItem[] = [];

  for (const rewardId of rewardIds || []) {
    const rewardItem = rewardData[rewardId];
    if (!rewardItem) continue;
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
  }
  return rwds;
}

export function isRewardItemWithCount(
  item: ReturnRewardItem
): item is ReturnRewardItem & { count: number } {
  return item.type === 'withCount' && typeof item.count === 'number';
}
