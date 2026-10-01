import type {
  SklandRouteDetailResponse,
  SklandRouteIndexResponse,
  SklandRoutePushRequest,
  SklandRoutePushResponse,
} from '@endfieldmap/map-service/@types/route';
import type { ServerService } from '@endfieldmap/map-service/service/server';

export interface SklandRouteServiceConfig {
  serverService: ServerService;
}

/** 路线广场排序：3=最热，2=最新。 */
export type SklandRouteSort = 2 | 3;

export interface SklandRouteListParams {
  roleId?: string;
  sort?: SklandRouteSort;
  size?: number;
  pageToken?: string;
  title?: string;
  author?: string;
}

/**
 * 森空岛（终末地）地图路线代理。
 *
 * 本站不抓取、不落库森空岛的路线数据：浏览与详情都是一次性代理，调用方拿到
 * 数据后自行决定是否由用户手动缓存到浏览器本地。发布是单向的（本站 → 森空岛）。
 */
export class SklandRouteService {
  private serverService: ServerService;

  constructor(config: SklandRouteServiceConfig) {
    this.serverService = config.serverService;
  }

  /** 浏览路线广场（手动选择的前置步骤）。 */
  public fetchRouteList(params: SklandRouteListParams = {}): Promise<SklandRouteIndexResponse> {
    const query = new URLSearchParams();
    if (params.roleId) query.set('roleId', params.roleId);
    if (params.sort) query.set('sort', String(params.sort));
    if (params.size) query.set('size', String(params.size));
    if (params.pageToken) query.set('pageToken', params.pageToken);
    if (params.title) query.set('title', params.title);
    if (params.author) query.set('author', params.author);
    return this.serverService.apiGet<SklandRouteIndexResponse>('/user/game-roles/skland-routes', query);
  }

  /** 拉取单条路线详情（返回上游 data 原文聚合）。 */
  public fetchRouteDetail(
    routeId: string,
    options: { roleId?: string; editing?: boolean } = {}
  ): Promise<SklandRouteDetailResponse> {
    const query = new URLSearchParams();
    query.set('routeId', routeId);
    if (options.roleId) query.set('roleId', options.roleId);
    if (options.editing) query.set('editing', 'true');
    return this.serverService.apiGet<SklandRouteDetailResponse>('/user/game-roles/skland-routes/detail', query);
  }

  /** 单向发布/更新本地路线到森空岛。 */
  public pushRoute(payload: SklandRoutePushRequest): Promise<SklandRoutePushResponse> {
    return this.serverService.apiPost<SklandRoutePushResponse>('/user/game-roles/skland-routes/push', payload);
  }

  /** 删除自己发布到森空岛的路线。 */
  public deleteRoute(routeId: string, roleId?: string): Promise<unknown> {
    return this.serverService.apiPost('/user/game-roles/skland-routes/delete', { routeId, roleId: roleId ?? '' });
  }
}
