import type { EXPORT_TYPE_KEY } from '@endfieldmap/map-service/const/data';
import type { CustomPointNodeSchemaType } from '@endfieldmap/map-service/service/db/export';

/**
 * 自定义标点预设
 */
export interface CustomPointPreset {
  id: string;
  name: string;
  data: CustomPointNodeSchemaType[];
  createdAt: number;
  updatedAt: number;
}

/**
 * 自定义标点预设存储结构
 */
export interface CustomPointPresetStorage {
  presets: CustomPointPreset[];
}

/**
 * 自定义标点预设导出包
 */
export interface CustomPointPresetExportBundle {
  type: EXPORT_TYPE_KEY.CUSTOM_POINT_PRESET;
  version: string;
  exportedAt: number;
  presets: CustomPointPreset[];
}
