import type { MapData } from '@endfieldmap/map-core/types/map';
import type {
  SklandPushResponse,
  SklandSyncPreview,
  SklandSyncResponse,
} from '@endfieldmap/map-service/@types/game_role';
import type { AdapterRegistry } from '@endfieldmap/map-service/service/adapter_registry';
import type { MapDataService } from '@endfieldmap/map-service/service/data/map';
import type { ServerService } from '@endfieldmap/map-service/service/server';
import { logger, md5 } from '@endfieldmap/tools';

export interface SklandSyncServiceConfig<T, R> {
  serverService: ServerService;
  mapDataService: MapDataService<T, R>;
  adapterRegistry: AdapterRegistry;
}

/** 按地图分组的本地 id 集合。 */
export type MarksByMap = Record<string, number[]>;

/**
 * 森空岛（终末地）地图标点双向同步。
 *
 * 森空岛地图接口以 md5(游戏 markInstId) 作为标点 id 下发，而本站实体数据的
 * levelLogicId 就是 markInstId，因此每次同步时对本地实体 id 复算 md5 建索引，
 * 就能在两边之间互转，无需随数据版本维护额外映射表。
 *
 * 三个动作：
 * - `preview()` 只读取两边差异，不改任何状态（供冲突弹窗展示）；
 * - `applyLocal(byMap, marked)` 改本地标记态；
 * - `pushRemote(byMap, marked)` 把标记态写回森空岛。
 */
export class SklandSyncService<T, R> {
  private serverService: ServerService;
  private mapDataService: MapDataService<T, R>;
  private adapterRegistry: AdapterRegistry;

  constructor(config: SklandSyncServiceConfig<T, R>) {
    this.serverService = config.serverService;
    this.mapDataService = config.mapDataService;
    this.adapterRegistry = config.adapterRegistry;
  }

  /** 读取两边差异，不写任何状态。 */
  public async preview(roleId?: string): Promise<SklandSyncPreview> {
    const response = await this.serverService.apiPost<SklandSyncResponse>('/user/game-roles/sync-skland-markers', {
      roleId: roleId ?? '',
    });
    const adapter = this.adapterRegistry.adapter;
    if (!adapter) {
      throw new Error('map adapter is not registered');
    }

    const remoteOnlyByMap: MarksByMap = {};
    const localOnlyByMap: MarksByMap = {};
    let unresolved = 0;
    let remoteTotal = 0;

    for (const [mapId, marks] of Object.entries(response.maps ?? {})) {
      const markedIds = marks?.marked ?? [];
      remoteTotal += markedIds.length;

      const typedMapId = mapId as MapData['id'];
      const groups = adapter.entityController.getMapGroupManagerList(typedMapId);

      // md5(levelLogicId) -> 本地实体 id
      const index = new Map<string, number>();
      for (const group of groups) {
        for (const instance of group.instances) {
          index.set(md5(String(instance.data.levelLogicId)), instance.data.levelLogicId);
        }
      }

      const remoteLocalIds = new Set<number>();
      for (const remoteId of markedIds) {
        const localId = index.get(remoteId);
        if (localId === undefined) {
          unresolved++;
          continue;
        }
        remoteLocalIds.add(localId);
      }

      const remoteOnly: number[] = [];
      const localOnly: number[] = [];
      for (const group of groups) {
        for (const instance of group.instances) {
          const id = instance.data.levelLogicId;
          if (remoteLocalIds.has(id)) {
            if (!instance.marked) remoteOnly.push(id);
          } else if (instance.marked) {
            localOnly.push(id);
          }
        }
      }
      if (remoteOnly.length) remoteOnlyByMap[mapId] = remoteOnly;
      if (localOnly.length) localOnlyByMap[mapId] = localOnly;
    }

    return {
      roleId: response.roleId,
      serverId: response.serverId,
      remoteOnlyByMap,
      localOnlyByMap,
      unresolved,
      remoteTotal,
      hasConflict: Object.keys(remoteOnlyByMap).length > 0 || Object.keys(localOnlyByMap).length > 0,
    };
  }

  /** 批量改本地标记态。 */
  public applyLocal(byMap: MarksByMap, marked: boolean): number {
    let total = 0;
    for (const [mapId, ids] of Object.entries(byMap)) {
      if (!ids.length) continue;
      this.mapDataService.entityDataService.markEntities(mapId as MapData['id'], ids, marked);
      total += ids.length;
    }
    return total;
  }

  /** 把标记态写回森空岛；返回上游成功/失败条数。 */
  public async pushRemote(byMap: MarksByMap, marked: boolean, roleId?: string): Promise<SklandPushResponse> {
    const result: SklandPushResponse = { roleId: roleId ?? '', serverId: '', applied: 0, failed: 0 };
    let changes: Array<{ mapId: string; levelLogicIds: number[]; marked: boolean }> = [];
    let size = 0;
    const flush = async () => {
      if (size === 0) return;
      const response = await this.serverService.apiPost<SklandPushResponse>(
        '/user/game-roles/sync-skland-markers/push',
        {
          roleId: roleId ?? '',
          changes,
        }
      );
      result.roleId = response.roleId;
      result.serverId = response.serverId;
      result.applied += response.applied;
      result.failed += response.failed;
      changes = [];
      size = 0;
    };
    for (const [mapId, ids] of Object.entries(byMap)) {
      let offset = 0;
      while (offset < ids.length) {
        const chunk = ids.slice(offset, offset + 2000 - size);
        changes.push({ mapId, levelLogicIds: chunk, marked });
        size += chunk.length;
        offset += chunk.length;
        if (size === 2000) await flush();
      }
    }
    await flush();
    logger.info(`[SklandSyncService] push marked=${marked}: applied ${result.applied}, failed ${result.failed}`);
    return result;
  }
}
