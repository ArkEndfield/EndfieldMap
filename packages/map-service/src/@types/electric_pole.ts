import type { EXPORT_TYPE_KEY, VersionType } from '@endfieldmap/map-service/const/data';
import type { modes } from '@endfieldmap/map-service/const/electric_pole';
import type { ElectricPoleNodeSchemaType } from '@endfieldmap/map-service/service/db/export';

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
 */
export interface ElectricPolePresetExportBundle {
  type: EXPORT_TYPE_KEY.ELECTRIC_POLE_PRESET;
  version: VersionType;
  exportedAt: number;
  presets: Array<Pick<ElectricPolePreset, 'id' | 'name' | 'data' | 'createdAt' | 'updatedAt'>>;
}

export type ElectricMode = (typeof modes)[number];
