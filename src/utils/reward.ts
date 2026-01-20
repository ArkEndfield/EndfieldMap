import type { DealedRewardItem, DealedRewardItemWithCount, RewardItem, RewardItemWithCount } from '@eftypes/reward';
import type { EntityData } from '@endfieldmap/map-core';

export function isRewardWithCountType(item: RewardItem): item is RewardItemWithCount {
  return (item as RewardItemWithCount)?.itemBundles !== undefined;
}

/**
 * 实体是否有奖励
 * @param entity 实体
 * @returns 是否有奖励
 */
export function hasChestReward(entity?: EntityData): boolean {
  if (!entity) return false;
  return !!entity.properties?.reward_id;
}

/**
 * 实体是否有副本奖励
 * @param entity 实体
 * @returns 是否有副本奖励
 */
export function hasDungeonReward(entity?: EntityData): boolean {
  if (!entity) return false;
  return !!entity.properties?.system_inst_key;
}

/**
 * 实体是否有DeltaRobot
 * @param entity 实体
 * @returns 是否有DeltaRobot
 */
export function hasDeltaRobot(entity?: EntityData): boolean {
  if (!entity) return false;
  // TODO: fixme
  return entity.entityDataIdKey === 'int_fixable_robot';
}

/**
 * 处理后的奖励数据是否有数量数据
 * @param item 处理后的奖励数据
 * @returns 是否有数量数据
 */
export function isDealedRewardItemWithCount(item: DealedRewardItem): item is DealedRewardItemWithCount {
  return item.type === 'withCount';
}
