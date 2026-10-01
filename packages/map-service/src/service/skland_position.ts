import type { SklandPositionResponse } from '@endfieldmap/map-service/@types/game_role';
import type { ServerService } from '@endfieldmap/map-service/service/server';

export interface SklandPositionServiceConfig {
  serverService: ServerService;
}

/**
 * 森空岛（终末地）玩家实时位置查询。
 *
 * 后端 `/user/game-roles/position` 会向森空岛拉取角色当前所在的地图与坐标，
 * 玩家不在线时归一为 `online: false` 而非报错，因此前端可以安全地按固定
 * 间隔轮询；具体轮询节奏与渲染由调用方（web 端 hook）负责。
 */
export class SklandPositionService {
  private serverService: ServerService;

  constructor(config: SklandPositionServiceConfig) {
    this.serverService = config.serverService;
  }

  /**
   * 拉取角色实时位置。
   *
   * @param roleId 可选，指定已绑定角色；省略则由后端取默认角色
   */
  public fetchPosition(roleId?: string): Promise<SklandPositionResponse> {
    return this.serverService.apiGet<SklandPositionResponse>('/user/game-roles/position', {
      roleId: roleId ?? '',
    });
  }
}
