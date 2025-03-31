import data from '../assets/reward.json';
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
  count?: number;
}

export type RewardItem = RewardItemWithCount | RewardItemWitoutCount;

export type RewardType = Record<string, RewardItem>;

export const rewards: RewardType = data as unknown as RewardType;

export function isRewardWithCountType(
  item: RewardItem
): item is RewardItemWithCount {
  return (item as RewardItemWithCount)?.itemBundles !== undefined;
}

export function isRewardWithCount(name?: keyof RewardType): boolean {
  if (!name) return false;
  return rewards[name] && 'itemBundles' in rewards[name];
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

export function getRewards(point: PointData): ReturnRewardItem[] {
  const largeRewards = point.properties?.filter(
    property => property.key === 'reward_id'
  );
  const largeIds = largeRewards?.map(reward => reward.value as string[]);
  const rewardIds = largeIds?.flat();
  const rwds: ReturnRewardItem[] = [];

  for (const rewardId of rewardIds || []) {
    const rewardItem = rewards[rewardId];
    if (!rewardItem) continue;
    if (isRewardWithCountType(rewardItem)) {
      for (const itemBundle of rewardItem.itemBundles) {
        rwds.push({
          type: 'withCount',
          id: itemBundle.id,
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
