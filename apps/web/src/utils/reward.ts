import type { DealedRewardItem, DealedRewardItemWithCount } from '@endfieldmap/map-service';

/**
 * 处理后的奖励数据是否有数量数据
 * @param item 处理后的奖励数据
 * @returns 是否有数量数据
 */
export function isDealedRewardItemWithCount(item: DealedRewardItem): item is DealedRewardItemWithCount {
  return item.type === 'withCount';
}
