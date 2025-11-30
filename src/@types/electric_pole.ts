import type { ElectricPoleMapData } from '@endfieldmap/map-core';

import type { VersionType } from '@/const/data';

/**
 * 电线杆预设类型
 */
export interface ElectricPolePreset {
  id: string;
  name: string;
  data: ElectricPoleMapData;
  createdAt: number;
  updatedAt: number;
}

/**
 * 电线杆预设存储类型
 */
export interface ElectricPolePresetStorage {
  presets: ElectricPolePreset[];
  currentPresetId: string | null;
}

/**
 * 导入 / 导出电线杆预设时使用的文件结构
 * - 允许同时包含多个预设
 */
export interface ElectricPolePresetExportBundle {
  type: 'electric_pole_preset_bundle';
  version: VersionType;
  exportedAt: number;
  presets: Array<Pick<ElectricPolePreset, 'id' | 'name' | 'data' | 'createdAt' | 'updatedAt'>>;
}
