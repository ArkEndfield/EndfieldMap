import { Circle as CircleStyle, Stroke, Style } from 'ol/style';

/**
 * 样式缓存清理时间
 */
export const CACHE_CLEANUP_TIMEOUT = 5 * 60 * 1000; // 5分钟

/**
 * 默认圆形标点半径
 */
export const DEFAULT_RADIUS = 15;

/**
 * 默认描边宽度
 */
export const DEFAULT_STROKE_WIDTH = 2;

/**
 * 默认背景颜色
 */
export const DEFAULT_BACKGROUND_COLOR = '#525152';

/**
 * 默认描边颜色
 */
export const DEFAULT_STROKE_COLOR = '#2E2F2E';

/**
 * 完成状态透明度
 */
export const FINISHED_OPACITY = 0.5;

/**
 * 电线杆范围半径（米）
 */
export const ELECTRIC_POLE_RANGE_RADIUS = 20;

/**
 * 电线杆范围颜色
 */
export const ELECTRIC_POLE_RANGE_COLOR = 'rgba(255, 255, 0, 0.3)';

/**
 * 选中样式，当开启批量操作时，选中标点的描边（当为聚合时，聚合标点(内全选)的描边）
 */
export const selectionStyle = new Style({
  image: new CircleStyle({
    radius: DEFAULT_RADIUS + 6,
    stroke: new Stroke({
      color: 'rgba(255, 255, 0, 0.8)',
      width: 4,
    }),
    displacement: [0, DEFAULT_RADIUS + 6],
  }),
  zIndex: 1,
});

/**
 * 部分选中样式（聚合时，聚合标点(内非全选)的描边）
 */
export const partialSelectionStyle = new Style({
  image: new CircleStyle({
    radius: DEFAULT_RADIUS + 6,
    stroke: new Stroke({
      color: 'rgba(255, 255, 0, 0.4)',
      width: 4,
    }),
    displacement: [0, DEFAULT_RADIUS + 6],
  }),
  zIndex: 1,
});
