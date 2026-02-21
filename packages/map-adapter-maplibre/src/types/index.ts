import type { EndfieldMapAssetConfig, MapDataJson } from '@endfieldmap/map-core';
import type { LoggerReporter } from '@endfieldmap/tools';

/**
 * MapLibre 适配器配置
 */
export interface MapLibreAdapterConfig {
  /** 地图数据 */
  data: MapDataJson;
  /** 静态资源配置 */
  asset: EndfieldMapAssetConfig;
  /** 日志 reporter */
  consolaReporter?: LoggerReporter;
}

/**
 * 待执行的视图动画
 * React 组件通过观察此状态来应用相机动画
 */
export interface PendingViewAnimation {
  center?: [number, number];
  zoom?: number;
  duration?: number;
  timestamp: number;
}
