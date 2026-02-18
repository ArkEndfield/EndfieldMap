import type { CustomPointNodeSchemaType, ElectricPoleNodeSchemaType } from '@endfieldmap/map-service';

export type PresetStoreTab = 'custom_point' | 'electric_pole' | 'mine';

export type ElectricPoleType = 'pole' | 'zipline';

/** 预设类型：电线杆或自定义标点 */
export type PresetType = 'electric_pole' | 'custom_point';

export type MineTab = 'uploads' | 'favorites';

export interface PresetStoreSearchOptions {
  keyword?: string;
  sortBy?: 'like_count' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}

export interface PresetStoreResponseItem {
  id: number;
  share_code: string;
  preset_type: PresetType;
  sub_type: ElectricPoleType;
  name: string;
  description: string;
  is_public: boolean;
  import_count: number;
  like_count: number;
  view_count: number;
  user_id: number;
  user_nickname: string;
  created_at: number;
  updated_at: number;
  is_liked: boolean;
}

export interface PresetStoreDetailResponseItem extends PresetStoreResponseItem {
  snapshot: string;
  source_preset_id: number;
}

export interface PresetStoreDetailData<T extends PresetType = 'electric_pole'> extends PresetStoreResponseItem {
  preset_type: T;
  snapshot: T extends 'electric_pole' ? ElectricPoleNodeSchemaType[] : CustomPointNodeSchemaType[];
  source_preset_id: number;
}
