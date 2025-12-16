import type Resources from "@eftypes/resources";

type RewardId = keyof Resources['item'];
type ItemId = keyof Resources['item'];

export interface RewardItemWithCountItem {
  id: RewardId;
  count: number;
}

export interface RewardItemWithCount {
  itemBundles: RewardItemWithCountItem[];
}

export interface RewardItemWitoutCount {
  itemIds: RewardId[];
}

export type RewardItem = RewardItemWithCount | RewardItemWitoutCount;

export interface BaseDealedRewardItem {
  type: 'withCount' | 'withoutCount';
  id: RewardId;
  name: ItemId;
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
