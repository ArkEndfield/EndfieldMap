import type { CustomPointMapData } from '@endfieldmap/map-core';

/**
 * 自定义标点预设
 */
export interface CustomPointPreset {
  id: string;
  name: string;
  data: CustomPointMapData;
  createdAt: number;
  updatedAt: number;
}

/**
 * 自定义标点预设存储结构
 */
export interface CustomPointPresetStorage {
  presets: CustomPointPreset[];
  currentPresetId: string | null;
}

/**
 * 自定义标点预设导出包
 */
export interface CustomPointPresetExportBundle {
  type: 'custom_point_preset_bundle';
  version: string;
  exportedAt: number;
  presets: CustomPointPreset[];
}
