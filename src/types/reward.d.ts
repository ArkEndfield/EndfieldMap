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
