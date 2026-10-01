import { describe, expect, it, vi } from 'vitest';

// tools 的 dist 保留了装饰器语法，vitest 无法解析其入口，故 mock 掉本链路用到的成员。
// md5 用可读的确定性替身（其正确性由 packages/tools 的 hash.test.ts 覆盖）；
// 本测试只验证「远端 id → 本地 levelLogicId」的映射与差异计算。
const { fakeMd5 } = vi.hoisted(() => ({ fakeMd5: (input: string) => `md5:${input}` }));

vi.mock('@endfieldmap/tools', () => ({
  md5: fakeMd5,
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { SklandSyncService } from './skland_sync';

// 后端 /sync-skland-markers 的响应形状：maps[mapId] = { total, marked: string[] }
type BackendMaps = Record<string, { total: number; marked: string[] }>;

/** 本地实体：levelLogicId 为数字，md5(levelLogicId) 才是森空岛下发的 id。 */
const LOCAL: Record<string, Array<{ levelLogicId: number; marked: boolean }>> = {
  map01: [
    { levelLogicId: 26800001153, marked: false },
    { levelLogicId: 2100010185, marked: false },
    { levelLogicId: 9990000001, marked: true },
  ],
  map02: [{ levelLogicId: 3400021021, marked: false }],
};

const createHarness = (maps: BackendMaps) => {
  const markEntities = vi.fn();
  const adapter = {
    entityController: {
      getMapGroupManagerList: (mapId: string) =>
        [mapId].map(() => ({
          instances: (LOCAL[mapId] ?? []).map((data) => ({ data, marked: data.marked })),
        })),
    },
  };
  const serverService = {
    apiPost: vi.fn().mockImplementation((url: string) => {
      if (url.endsWith('/push')) {
        return Promise.resolve({ roleId: '111', serverId: '2', applied: 1, failed: 0 });
      }
      return Promise.resolve({ roleId: '111', serverId: '2', maps });
    }),
  };
  const service = new SklandSyncService({
    serverService: serverService as never,
    mapDataService: { entityDataService: { markEntities } } as never,
    adapterRegistry: { adapter } as never,
  });
  return { service, markEntities, serverService };
};

describe('SklandSyncService.preview', () => {
  it('maps remote md5 ids to local ids and splits the two directions', async () => {
    const { service } = createHarness({
      map01: {
        total: 2,
        // 远端标记了 1 个本地未标记的、以及一个本地没有对应实体的
        marked: [fakeMd5('26800001153'), 'md5:unknown-id'],
      },
    });

    const preview = await service.preview('111');

    // 26800001153 远端有、本地没有 → remoteOnly
    expect(preview.remoteOnlyByMap).toEqual({ map01: [26800001153] });
    // 9990000001 本地有、远端没有 → localOnly
    expect(preview.localOnlyByMap).toEqual({ map01: [9990000001] });
    expect(preview.unresolved).toBe(1);
    expect(preview.remoteTotal).toBe(2);
    expect(preview.hasConflict).toBe(true);
  });

  it('reports no conflict when both sides agree', async () => {
    const { service } = createHarness({
      map01: { total: 1, marked: [fakeMd5('9990000001')] },
    });

    const preview = await service.preview();

    expect(preview.hasConflict).toBe(false);
    expect(preview.remoteOnlyByMap).toEqual({});
    expect(preview.localOnlyByMap).toEqual({});
  });

  it('does not mutate local state', async () => {
    const { service, markEntities } = createHarness({
      map01: { total: 1, marked: [fakeMd5('26800001153')] },
    });

    await service.preview();

    expect(markEntities).not.toHaveBeenCalled();
  });
});

describe('SklandSyncService.applyLocal', () => {
  it('marks the given ids per map in one bulk call', async () => {
    const { service, markEntities } = createHarness({});

    const total = service.applyLocal({ map01: [1, 2], map02: [3] }, true);

    expect(total).toBe(3);
    expect(markEntities).toHaveBeenCalledWith('map01', [1, 2], true);
    expect(markEntities).toHaveBeenCalledWith('map02', [3], true);
  });

  it('skips empty maps', () => {
    const { service, markEntities } = createHarness({});

    expect(service.applyLocal({ map01: [] }, true)).toBe(0);
    expect(markEntities).not.toHaveBeenCalled();
  });
});

describe('SklandSyncService.pushRemote', () => {
  it('posts changes grouped by map and returns upstream counts', async () => {
    const { service, serverService } = createHarness({});

    const result = await service.pushRemote({ map01: [26800001153], map02: [3400021021] }, true, '111');

    expect(result.applied).toBe(1);
    expect(serverService.apiPost).toHaveBeenCalledWith('/user/game-roles/sync-skland-markers/push', {
      roleId: '111',
      changes: [
        { mapId: 'map01', levelLogicIds: [26800001153], marked: true },
        { mapId: 'map02', levelLogicIds: [3400021021], marked: true },
      ],
    });
  });

  it('does not call the backend when there is nothing to push', async () => {
    const { service, serverService } = createHarness({});

    const result = await service.pushRemote({ map01: [] }, true);

    expect(result.applied).toBe(0);
    expect(serverService.apiPost).not.toHaveBeenCalled();
  });
});
