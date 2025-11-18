/**
 * 地图渲染性能配置
 * 
 * 当显示大量实体时，可以通过调整这些配置来优化性能
 */
export interface MapPerformanceConfig {
  /**
   * 是否启用实体阴影效果
   * 禁用可显著提升 GPU 渲染性能（推荐在实体数量 > 500 时禁用）
   * @default false
   */
  enableEntityShadow: boolean;

  /**
   * 图层渲染缓冲区大小（像素）
   * 较小的值可减少渲染的 feature 数量，但可能在快速移动时出现空白
   * @default 100
   */
  renderBuffer: number;

  /**
   * 聚合距离（像素）
   * 较大的值会减少渲染的 feature 数量，提升性能
   * @default 40
   */
  clusterDistance: number;

  /**
   * 是否在动画时更新图层
   * 禁用可提升缩放/平移动画的流畅度
   * @default false
   */
  updateWhileAnimating: boolean;

  /**
   * 是否在交互时更新图层
   * 禁用可提升拖拽等交互的流畅度
   * @default false
   */
  updateWhileInteracting: boolean;

  /**
   * 样式缓存最大数量
   * 较大的值可减少样式重建，但会占用更多内存
   * @default 1000
   */
  maxStyleCacheSize: number;
}

/**
 * 默认性能配置（平衡模式）
 */
export const DEFAULT_PERFORMANCE_CONFIG: MapPerformanceConfig = {
  enableEntityShadow: false,
  renderBuffer: 100,
  clusterDistance: 40,
  updateWhileAnimating: false,
  updateWhileInteracting: false,
  maxStyleCacheSize: 1000,
};

/**
 * 高性能配置（适用于大量实体场景）
 */
export const HIGH_PERFORMANCE_CONFIG: MapPerformanceConfig = {
  enableEntityShadow: false,
  renderBuffer: 50,
  clusterDistance: 60,
  updateWhileAnimating: false,
  updateWhileInteracting: false,
  maxStyleCacheSize: 500,
};

/**
 * 高质量配置（适用于少量实体场景）
 */
export const HIGH_QUALITY_CONFIG: MapPerformanceConfig = {
  enableEntityShadow: true,
  renderBuffer: 250,
  clusterDistance: 40,
  updateWhileAnimating: true,
  updateWhileInteracting: true,
  maxStyleCacheSize: 2000,
};
