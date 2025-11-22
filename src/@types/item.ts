export interface ItemData {
  id: string;
  iconId: string;
  rarity: number;
  valuableTabType: string;
  obtainWays: {
    id: string;
    iconId: string;
  }[];
}
