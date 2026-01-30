export const DEBOUNCE_INTERVAL = 1000;

export type VersionType = `${number}.${number}.${number}`;

export enum EXPORT_TYPE_KEY {
  ELECTRIC_POLE_PRESET = 'electric_pole_preset_bundle',
  CUSTOM_POINT_PRESET = 'custom_point_preset_bundle',
}

export enum DATA_STORAGE_KEY {
  CURRENT_ELECTRIC_POLE_PRESET_ID = 'currentElectricPolePresetId',
  CURRENT_CUSTOM_POINT_PRESET_ID = 'currentCustomPointPresetId',
}
