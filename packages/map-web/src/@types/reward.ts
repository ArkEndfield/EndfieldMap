import type { ItemSchemaType } from "@/services/data/db/schema/game_data/item";

export interface RewardItemWithCountItem {
  id: ItemSchemaType['id'];
  count: number;
}

export interface RewardItemWithCount {
  itemBundles: RewardItemWithCountItem[];
}

export interface RewardItemWitoutCount {
  itemIds: ItemSchemaType['id'][];
}

export type RewardItem = RewardItemWithCount | RewardItemWitoutCount;

export interface BaseDealedRewardItem {
  type: 'withCount' | 'withoutCount';
  id: ItemSchemaType['id'];
  name: ItemSchemaType['name'];
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
