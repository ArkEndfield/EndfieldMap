export interface EntityInfo {
  point: string;
  pic: string;
  count: number;
  scale?: number;
}

export type EntityCategory =
  | 'ether'
  | 'chest'
  | 'special'
  | 'dungeon'
  | 'mineral'
  | 'plant'
  | 'spcstone'
  | 'narrative'
  | 'dnarrative'
  | 'settlement'
  | 'enemy'
  | 'custom';

export type EntityCategories = Record<
  string,
  {
    category: EntityCategory;
    entityInfo: EntityInfo;
  }
>;

// 实体显示状态
export type EntityShowStates = Record<string, boolean>;
