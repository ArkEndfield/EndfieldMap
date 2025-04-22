export interface EntityInfo {
  name: string;
  point: string;
  pic: string;
  count: number;
  scale?: number;
}

// 副本点位
export type EntityCategory =
  | 'ether'
  | 'chest'
  | 'special'
  | 'dungeon'
  | 'mineral'
  | 'plant'
  | 'spcstone'
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
