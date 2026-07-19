import { describe, expect, it, vi } from 'vitest';

// tools 的 dist 保留了装饰器语法（LocalStorageValue），vitest 无法解析其入口，mock 掉本链路用到的 logger
vi.mock('@endfieldmap/tools', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { EntityMarkService } from './entity';

const createService = (existingDocs: Array<{ id: string; createdAt: number }>) => {
  const find = vi.fn().mockReturnValue({ exec: () => Promise.resolve(existingDocs) });
  const bulkUpsert = vi.fn().mockResolvedValue({ success: [], error: [] });
  const service = new EntityMarkService({
    databaseService: {
      database: {
        entityMark: { find, bulkUpsert },
      },
    } as never,
  });
  return { service, find, bulkUpsert };
};

describe('EntityMarkService.setMarkDataBulk', () => {
  it('does nothing when ids are empty', async () => {
    const { service, find, bulkUpsert } = createService([]);

    await service.setMarkDataBulk('map1', [], true);

    expect(find).not.toHaveBeenCalled();
    expect(bulkUpsert).not.toHaveBeenCalled();
  });

  it('bulk upserts all ids in one call and preserves createdAt of existing docs', async () => {
    const { service, bulkUpsert } = createService([{ id: 'map1|1', createdAt: 111 }]);

    await service.setMarkDataBulk('map1', [1, 2], true);

    expect(bulkUpsert).toHaveBeenCalledTimes(1);
    const docs = bulkUpsert.mock.calls[0][0];
    expect(docs).toHaveLength(2);
    const existing = docs.find((doc: { id: string }) => doc.id === 'map1|1');
    const inserted = docs.find((doc: { id: string }) => doc.id === 'map1|2');
    expect(existing).toMatchObject({ mapId: 'map1', entityId: 1, marked: true, createdAt: 111 });
    expect(inserted).toMatchObject({ mapId: 'map1', entityId: 2, marked: true });
    expect(inserted.createdAt).toBeGreaterThan(0);
    expect(inserted.updatedAt).toBeGreaterThan(0);
  });
});
