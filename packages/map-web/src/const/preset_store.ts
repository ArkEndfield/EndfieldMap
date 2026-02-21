import type { MineTab, PresetType } from '@endfieldmap/map-service';

export const TAB_OPTIONS: { key: MineTab; labelKey: string }[] = [
  { key: 'uploads', labelKey: 'sidebar:preset_store.mine_uploads' },
  { key: 'favorites', labelKey: 'sidebar:preset_store.mine_favorites' },
];

export const PRESET_TYPE_OPTIONS: { key: PresetType; labelKey: string }[] = [
  { key: 'electric_pole', labelKey: 'sidebar:preset_store.preset_type.electric_pole' },
  { key: 'custom_point', labelKey: 'sidebar:preset_store.preset_type.custom_point' },
];
