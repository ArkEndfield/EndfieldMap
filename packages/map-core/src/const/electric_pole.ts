import type { MapData } from '@endfieldmap/map-core/types';

/**
 * 电线杆 / 中继器 / 滑索 配置
 *
 * 注意：地图内距离计算使用的是地图坐标单位；当前通过「80m -> ELECTRIC_ZONE_RADIUS」进行线性换算。
 * 如果后续某个地图比例并非线性，可通过 rangeRadiusByMapId 覆盖。
 */

/** 用于换算的基准米数（当前 ELECTRIC_ZONE_RADIUS 表示 80m） */
export const ELECTRIC_RANGE_BASE_METERS = 80;

export type ElectricPoleDeviceKey = 'pole' | 'repeater' | 'zipline_80' | 'zipline_110';

export type ElectricPoleConnectionType = 'electric' | 'zipline';

export interface ElectricPoleDeviceConfig {
  /** 类型 key（用于存储/逻辑判断） */
  key: ElectricPoleDeviceKey;
  /** 显示名称（UI 可用） */
  name: string;
  /** 图标 pic（拼接 imagePath 后使用） */
  iconPic: string;
  /** 覆盖范围（米） */
  rangeMeters: number;
  /**
   * 创建数量限制
   * - false：无限制
   * - number：最大可创建数量（按地图维度统计）
   */
  createLimit: false | number;
  /**
   * 连接数量限制
   * - false：无限制
   * - number：最大可连接数量（包含入/出连接）
   */
  maxConnections: false | number;
  /** 连接类型：同类型之间可互连（例如 pole 与 repeater 属于 electric） */
  connectionType: ElectricPoleConnectionType;
  /** 填充色 (RGBA) */
  fillColor?: string;
  /** 描边色 (Hex/RGBA) */
  strokeColor?: string;
}

export const ELECTRIC_POLE_DEVICE_CONFIGS: Record<ElectricPoleDeviceKey, ElectricPoleDeviceConfig> = {
  pole: {
    key: 'pole',
    name: '电线杆',
    iconPic: 'electric_pole',
    rangeMeters: 30,
    createLimit: false,
    maxConnections: 10,
    connectionType: 'electric',
    fillColor: 'rgba(228, 169, 21, 0.15)',
    strokeColor: '#E4A915',
  },
  repeater: {
    key: 'repeater',
    name: '中继器',
    iconPic: 'electric_repeater',
    rangeMeters: 80,
    createLimit: false,
    maxConnections: 100,
    connectionType: 'electric',
    fillColor: 'rgba(36, 136, 255, 0.15)',
    strokeColor: '#2488FF',
  },
  zipline_80: {
    key: 'zipline_80',
    name: '滑索(80m)',
    iconPic: 'electric_slider_80',
    rangeMeters: 80,
    createLimit: false,
    maxConnections: false,
    connectionType: 'zipline',
    fillColor: 'rgba(129, 211, 0, 0.15)',
    strokeColor: '#81D300',
  },
  zipline_110: {
    key: 'zipline_110',
    name: '滑索(110m)',
    iconPic: 'electric_slider_110',
    rangeMeters: 110,
    createLimit: false,
    maxConnections: false,
    connectionType: 'zipline',
    fillColor: 'rgba(0, 194, 120, 0.15)',
    strokeColor: '#00C278',
  },
};

export const DEFAULT_ELECTRIC_POLE_DEVICE_KEY: ElectricPoleDeviceKey = 'pole';
export const LEGACY_ELECTRIC_POLE_DEVICE_KEY: ElectricPoleDeviceKey = 'repeater';

export function getElectricPoleDeviceConfig(key: ElectricPoleDeviceKey): ElectricPoleDeviceConfig {
  return ELECTRIC_POLE_DEVICE_CONFIGS[key];
}

export function isSameElectricPoleConnectionType(a: ElectricPoleDeviceKey, b: ElectricPoleDeviceKey): boolean {
  return getElectricPoleDeviceConfig(a).connectionType === getElectricPoleDeviceConfig(b).connectionType;
}
