import type { ItemData } from "@eftypes/item";

export interface RewardItemWithCountItem {
  id: ItemData['id'];
  count: number;
}

export interface RewardItemWithCount {
  itemBundles: RewardItemWithCountItem[];
}

export interface RewardItemWitoutCount {
  itemIds: ItemData['id'][];
}

export type RewardItem = RewardItemWithCount | RewardItemWitoutCount;

export interface BaseDealedRewardItem {
  type: 'withCount' | 'withoutCount';
  id: ItemData['id'];
  name: ItemData['name'];
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
