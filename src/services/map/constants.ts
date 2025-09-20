import { LOCAL_STORAGE_KEY } from '@/constants/db_key';

/**
 * 地图视图状态存储键前缀
 */
export const MAP_VIEW_STATE_KEY_PREFIX = 'mapViewState_';

/**
 * 默认地图中心点
 */
export const DEFAULT_MAP_CENTERS: { [key: string]: [number, number] } = {
  map001: [100, 152],
  map002: [50, 188],
};

/**
 * 默认缩放级别
 */
export const DEFAULT_ZOOM = 3;

/**
 * 地图ID本地存储键
 */
export const MAP_ID_KEY = LOCAL_STORAGE_KEY.MAP;

/**
 * 缩放级别本地存储键
 */
export const ZOOM_KEY = LOCAL_STORAGE_KEY.ZOOM;

/**
 * 图像池最大数量
 */
export const MAX_POOLED_IMAGES = 100;

/**
 * 实体图层加载最大重试次数
 */
export const MAX_RETRIES = 5;
