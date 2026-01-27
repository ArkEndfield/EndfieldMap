export interface ItemData {
  id: string;
  iconId: string;
  decoDesc: string;
  desc: string;
  name: string;
  rarity: number;
  valuableTabType: string;
  obtainWays: {
    id: string;
    iconId: string;
  }[];
}
