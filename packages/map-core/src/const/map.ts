/** 默认缩放 */
export const DEFAULT_ZOOM = 3;

/** 默认中心 */
export const DEFAULT_CENTER = [0, 0];

/** 默认最大缩放 */
export const DEFAULT_MAX_ZOOM = 8;

/** 默认最小缩放 */
export const DEFAULT_MIN_ZOOM = 1;

/** 默认像素比 */
export const DEFAULT_PIXEL_RATIO = 2;

/** 默认旋转 */
export const DEFAULT_ROTATION = 0;

/** 默认非活动透明度 */
export const DEFAULT_NON_ACTIVE_OPACITY = 0.3;

/** 默认透明度 */
export const DEFAULT_OPACITY = 1;

/** 默认图标大小 */
export const DEFAULT_ICON_SIZE = 24;

/** 默认聚合距离 */
export const DEFAULT_CLUSTER_DISTANCE = 30;

/** 默认填充颜色 */
export const DEFAULT_FILL_COLOR = '#525152';

/** 默认填充颜色-透明50% */
export const DEFAULT_FILL_COLOR_TRANSPARENT_50 = 'rgba(82, 81, 82, 0.5)';

/** 默认填充颜色-透明75% */
export const DEFAULT_FILL_COLOR_TRANSPARENT_75 = 'rgba(82, 81, 82, 0.75)';

/** 默认描边颜色 */
export const DEFAULT_STROKE_COLOR = '#2E2F2E';

/** 默认描边颜色-透明50% */
export const DEFAULT_STROKE_COLOR_TRANSPARENT_50 = 'rgba(46, 47, 46, 0.5)';

/** 默认描边颜色-透明75% */
export const DEFAULT_STROKE_COLOR_TRANSPARENT_75 = 'rgba(46, 47, 46, 0.75)';

/** 默认选中颜色 */
export const DEFAULT_SELECTED_COLOR = 'rgba(255, 215, 0, 1)';

/** 默认选中颜色-透明50% */
export const DEFAULT_SELECTED_COLOR_TRANSPARENT_50 = 'rgba(255, 215, 0, 0.5)';

/** 默认选中颜色-透明75% */
export const DEFAULT_SELECTED_COLOR_TRANSPARENT_75 = 'rgba(255, 215, 0, 0.75)';

/** 默认描边宽度 */
export const DEFAULT_STROKE_WIDTH = 3;

/** 特征类型键 */
export const FeatureTypeKey = 'featureType';

/** 实体实例键 */
export const EntityInstanceKey = 'entityInstance';

/** 连线目标 ID 键（用于区分同一实体的多条连线） */
export const ConnectionTargetIdKey = 'connectionTargetId';

/** 图层类型键 */
export const LayerTypeKey = 'layerType';

/** 地图类型键 */
export const MapTypeKey = 'mapType';

/** 电线杆 ID 键 和 分类键 */
export const ElectricPoleIdKey = '#electric_pole';
export const ElectricPoleKey = ElectricPoleIdKey;

/** 自定义标点 ID 键 */
export const CustomPointKey = '#custom_point';

/** 纸条搜索键 */
export const NoteKey = '#note';

/** 地图类型 */
export const enum MapType {
  MAP = 'map',
  MAP_UNDER_LEVEL_1 = 'mapUnderLevel1',
}

/** 图层类型 */
export const enum LayerType {
  MAP = 'map',
  TIER = 'tier',
  TIER_OVERLAY_MASK = 'tierOverlayMask',
  AREA_NAME = 'areaName',
  ENTITY = 'entity',
  ELECTRIC_POLE = 'electricPole',
  CUSTOM_POINT = 'customPoint',
  ACTIVE_FEATURE = 'activeFeature',
  HOVER_FEATURE = 'hoverFeature',
}

/** 特征类型 */
export const enum FeatureType {
  AREA_NAME,
  ENTITY,
  CONNECTION,
}

/**
 * marked feature 筛选模式
 * - 'all'：显示全部
 * - 'marked-only'：仅显示已标记的 feature
 * - 'unmarked-only'：仅显示未标记的 feature
 */
export enum MarkedFeatureFilterMode {
  All,
  Marked,
  Unmarked,
}
