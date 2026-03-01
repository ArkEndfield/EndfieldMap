/**
 * 图层 z-index 常量
 * 从下到上依次排列，数值越大越靠上
 */
export const Z_INDEX = {
  /** 底图瓦片 */
  MAP: -2,
  /** 区域名称 */
  AREA_NAME: 0,
  /** 遮罩背景（tier 使用） */
  BACKDROP: 1,
  /** 层级图片 */
  TIER: 2,
  /** 电线杆覆盖区域 */
  ZONE: 3,
  /** 电线杆连线 */
  CONNECTION: 4,
  /** 通用标点 */
  ENTITY: 5,
  /** 创建点（电线杆、自定义标点） */
  CREATE_POINT: 7,
  /** 悬浮动画 */
  HOVER: 8,
  /** 激活指示器 */
  ACTIVE: 9,
  /** 开发者工具 */
  DEV_TOOLS: 9999,
} as const;
