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

export type RewardItem = RewardItemWithCount | RewardItemWitoutCount;

export interface BaseDealedRewardItem {
  type: 'withCount' | 'withoutCount';
  id: string;
  icon: string;
}

export interface DealedRewardItemWithCount extends BaseDealedRewardItem {
  type: 'withCount';
  count: number;
}

export interface DealedRewardItemWithoutCount extends BaseDealedRewardItem {
  type: 'withoutCount';
}

export type DealedRewardItem = DealedRewardItemWithCount | DealedRewardItemWithoutCount;
