import type { RouteSource } from '@endfieldmap/map-core';

/**
 * 森空岛地图路线的原始聚合形状（GET /user/game-roles/skland-routes 透传上游）。
 *
 * `route` 是路线元信息，`poster` 是作者；点位坐标保留上游世界坐标 `pos`。
 */
export interface SklandRouteAgg {
  route: {
    routeId: string;
    userId?: string;
    title: string;
    description?: string;
    iconId?: string;
    publishAtTs?: string;
    latestEditAtTs?: string;
    version?: number;
    status?: number;
    auditStatus?: number;
    routeSegments?: SklandRouteSegment[];
  };
  poster?: {
    uid?: string;
    nickname?: string;
    avatar?: string;
  };
  routeRel?: { liked?: boolean };
  routeRts?: { liked?: string };
  translationInfo?: unknown;
}

/** 森空岛路线的一段：单张地图 + 颜色 + 有序点位。 */
export interface SklandRouteSegment {
  mapId: string;
  color?: string;
  markIds?: string[];
  marks?: SklandRouteMark[];
  saveMarks?: SklandRouteMark[];
}

/** 森空岛路线上的点位（id = md5(游戏 markInstId)）。 */
export interface SklandRouteMark {
  id: string;
  templateId?: string;
  mapId?: string;
  levelId?: string;
  pos?: { x: number; y: number; z: number };
  isUserMarked?: boolean;
}

/** GET /user/game-roles/skland-routes 的响应（上游 data 原文）。 */
export interface SklandRouteIndexResponse {
  routeAggs?: SklandRouteAgg[];
  pageToken?: string;
  pageSize?: number;
  hasMore?: boolean;
}

/** GET /user/game-roles/skland-routes/detail 的响应（上游 data 原文）。 */
export interface SklandRouteDetailResponse {
  routeAgg?: SklandRouteAgg;
}

/** 本站路线发布到森空岛的一段：有序 levelLogicId。 */
export interface SklandRoutePushSegment {
  mapId: string;
  color?: string;
  levelLogicIds: number[];
}

/** POST /user/game-roles/skland-routes/push 的请求体。 */
export interface SklandRoutePushRequest {
  roleId?: string;
  /** 有值则更新已有路线，无则新建。 */
  routeId?: string;
  title: string;
  description?: string;
  iconId?: string;
  segments: SklandRoutePushSegment[];
}

/** POST /user/game-roles/skland-routes/push 的响应。 */
export interface SklandRoutePushResponse {
  routeId: string;
}

/**
 * 一条「本地路线」的持久化形状（存于浏览器 RxDB `route` collection）。
 *
 * 与森空岛解耦：points 直接存世界坐标，仅在发布时把有 levelLogicId 的点换算
 * 成上游 id。source 标记数据来路，便于面板区分自建与导入。
 */
export interface StoredRoutePoint {
  x: number;
  y: number;
  z: number;
  levelLogicId?: number;
}

export interface StoredRouteSegment {
  mapId: string;
  color?: string;
  points: StoredRoutePoint[];
}

export interface StoredRoute {
  id: string;
  name: string;
  description?: string;
  source: RouteSource;
  /** 导入来源：森空岛路线 id（source=skland 时存在）。 */
  sourceRouteId?: string;
  /** 发布到森空岛后回写的路线 id。 */
  sklandRouteId?: string;
  /** 导入时的原作者昵称，仅展示用。 */
  author?: string;
  segments: StoredRouteSegment[];
  createdAt: number;
  updatedAt: number;
}
