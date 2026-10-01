export type BindType = 'scan' | 'token';

/** 单张地图的森空岛标点同步结果：总数 + 已标记标点 id（md5(markInstId)）。 */
export interface SklandMapMarks {
  total: number;
  marked: string[];
}

/** POST /user/game-roles/sync-skland-markers 响应。 */
export interface SklandSyncResponse {
  roleId: string;
  serverId: string;
  maps: Record<string, SklandMapMarks>;
}

/** POST /user/game-roles/sync-skland-markers/push 响应。 */
export interface SklandPushResponse {
  roleId: string;
  serverId: string;
  applied: number;
  failed: number;
}

/** GET /user/game-roles/position 响应：角色实时位置。 */
export interface SklandPositionResponse {
  roleId: string;
  serverId: string;
  /** 玩家是否在线（离线时坐标为零值，前端应隐藏标记） */
  online: boolean;
  /** 所在地图 id（如 map01），离线时缺省 */
  mapId?: string;
  /** 所在关卡 id（如 map01_lv002），离线时缺省 */
  levelId?: string;
  /** 游戏世界坐标（与标点同系） */
  x: number;
  y: number;
  z: number;
}

/**
 * 两边标记态差异快照（只读，不含副作用）。
 *
 * 所有 id 都是本站 levelLogicId；远端标点已用 md5 反查映射回本地，
 * 映射不到的计入 unresolved（本站没有对应实体，无法呈现）。
 */
export interface SklandSyncPreview {
  roleId: string;
  serverId: string;
  /** 森空岛已标记但本地未标记（按地图分组） */
  remoteOnlyByMap: Record<string, number[]>;
  /** 本地已标记但森空岛未标记（按地图分组） */
  localOnlyByMap: Record<string, number[]>;
  /** 森空岛已标记但本站没有对应实体的数量 */
  unresolved: number;
  /** 森空岛下发的已标记标点总数 */
  remoteTotal: number;
  /** 两边是否存在差异 */
  hasConflict: boolean;
}
