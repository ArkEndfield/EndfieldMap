import { loadJSON } from '@/utils/jsonLoader';
import { type PointData } from './points';

export interface RewardItemWithCountItem {
  id: string;
  count: number;
}

export interface ItemBundle {
  id: string;
  count: number;
}

export interface RewardData {
  [key: string]: {
    itemBundles: ItemBundle[];
    name?: string;
    rarity?: number;
    type?: string;
    icon?: string;
  };
}

// 奖励数据
export const rewardData: RewardData = {};

// 加载奖励数据
export async function loadRewardData() {
  try {
    const data = await loadJSON<RewardData>('/data/reward.json');
    // 清空当前数据
    Object.keys(rewardData).forEach(key => {
      delete rewardData[key];
    });
    // 添加新数据
    Object.entries(data).forEach(([key, value]) => {
      rewardData[key] = value;
    });

    console.log('奖励数据加载完成，总数:', Object.keys(rewardData).length);
    console.log('示例奖励数据:', Object.entries(rewardData).slice(0, 2));
    return rewardData;
  } catch (error) {
    console.error('加载奖励数据失败:', error);
    throw error;
  }
}

// 获取奖励信息
export function getRewardInfo(rewardId: string) {
  return rewardData[rewardId];
}

// 获取点位的奖励信息
export function getPointRewards(point: PointData): RewardItemWithCountItem[] {
  const rewards: RewardItemWithCountItem[] = [];
  point.properties?.forEach(property => {
    if (property.key === 'reward_id' && Array.isArray(property.value)) {
      property.value.forEach(id => {
        const rewardInfo = getRewardInfo(id);
        if (rewardInfo) {
          // 添加所有物品包中的物品
          rewardInfo.itemBundles.forEach(bundle => {
            rewards.push({
              id: bundle.id,
              count: bundle.count,
            });
          });
        }
      });
    }
  });
  return rewards;
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

export function getRewards(point: PointData): RewardItemWithCountItem[] {
  const rwds: RewardItemWithCountItem[] = [];

  // 检查point是否有效
  if (!point || !point.properties) {
    console.warn('无效的点位数据:', point);
    return rwds;
  }

  // 获取所有reward_id属性
  const rewardProperties = point.properties.filter(
    property => property.key === 'reward_id'
  );

  if (rewardProperties.length === 0) {
    console.warn('点位没有奖励属性:', point);
    return rwds;
  }

  // 收集所有奖励ID
  const rewardIds = rewardProperties
    .map(property => property.value)
    .flat()
    .filter((id): id is string => typeof id === 'string');

  if (rewardIds.length === 0) {
    console.warn('点位没有有效的奖励ID:', point);
    return rwds;
  }

  console.log('处理点位的奖励ID:', rewardIds);

  for (const rewardId of rewardIds) {
    // 获取奖励信息
    const rewardInfo = rewardData[rewardId];
    if (!rewardInfo) {
      console.warn(
        '找不到奖励信息:',
        rewardId,
        '可用的奖励:',
        Object.keys(rewardData).slice(0, 5)
      );
      continue;
    }

    // 添加所有物品包中的物品
    rewardInfo.itemBundles.forEach(bundle => {
      rwds.push({
        id: bundle.id,
        count: bundle.count,
      });
    });
  }

  console.log('最终获取到的奖励:', rwds);
  return rwds;
}

export function isRewardItemWithCount(item: RewardItemWithCountItem): boolean {
  return typeof item.count === 'number';
}
