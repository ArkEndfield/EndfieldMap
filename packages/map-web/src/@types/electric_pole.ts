import type { EXPORT_TYPE_KEY, VersionType } from '@/const/data';
import type { modes } from '@/const/electric_pole';
import type { ElectricPoleNodeSchemaType } from '@endfieldmap/map-service';

/**
 * 电线杆预设类型
 */
export interface ElectricPolePreset {
  id: string;
  name: string;
  data: ElectricPoleNodeSchemaType[];
  createdAt: number;
  updatedAt: number;
}

/**
 * 电线杆预设存储类型
 */
export interface ElectricPolePresetStorage {
  presets: ElectricPolePreset[];
}

/**
 * 导入 / 导出电线杆预设时使用的文件结构
 * - 允许同时包含多个预设
 */
export interface ElectricPolePresetExportBundle {
  type: EXPORT_TYPE_KEY.ELECTRIC_POLE_PRESET;
  version: VersionType;
  exportedAt: number;
  presets: Array<Pick<ElectricPolePreset, 'id' | 'name' | 'data' | 'createdAt' | 'updatedAt'>>;
}

export type ElectricMode = (typeof modes)[number];
