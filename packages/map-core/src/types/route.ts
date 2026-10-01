/** 路线来源：本站在地图上自建，或从森空岛路线广场手动导入。 */
export type RouteSource = 'local' | 'skland';

/**
 * 路线上的一个点。
 *
 * 世界坐标（与标点同系）用于渲染与森空岛导入；`levelLogicId` 仅在能对应到
 * 本地实体时存在，发布到森空岛时以它为准（服务端现算 md5）。
 */
export interface RoutePointData {
  x: number;
  y: number;
  z: number;
  levelLogicId?: number;
}

/** 路线的一段：单张地图 + 一种颜色的有序点位（森空岛路线即多段结构）。 */
export interface RouteSegmentData {
  mapId: string;
  /** 折线颜色，如 #00FF99；缺省用默认色。 */
  color?: string;
  points: RoutePointData[];
}

/**
 * 路由渲染输入：适配器只依赖这个最小结构，不依赖 map-service 的持久化类型。
 */
export interface RouteRenderItem {
  id: string;
  segments: RouteSegmentData[];
  /** 是否为草稿（未保存），用虚线样式区分。 */
  draft?: boolean;
}
