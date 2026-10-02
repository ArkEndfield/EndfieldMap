import type { RxConflictHandler, WithDeleted } from 'rxdb';
import { describe, expect, it } from 'vitest';

import { userDataCollectionsSchema } from './collections';
import type { MarkDataSchemaType } from './schema/user_data/mark';

// 同步集合挂的 updatedAt-LWW 冲突处理器：钉住方向语义与时间戳钳制
const handler = userDataCollectionsSchema.entityMark.conflictHandler as RxConflictHandler<MarkDataSchemaType>;

type TestDoc = WithDeleted<MarkDataSchemaType>;

const doc = (over: { updatedAt?: number; marked?: boolean }): TestDoc =>
  ({
    id: 'm|1',
    mapId: 'm',
    entityId: 1,
    marked: over.marked ?? true,
    createdAt: 1,
    updatedAt: over.updatedAt ?? 0,
    _deleted: false,
  }) as TestDoc;

describe('updatedAt-LWW conflictHandler', () => {
  it('fork 较新时保留本地内容，但时间戳钳到 masterTs+1（服务端重盖后一次往返收敛）', async () => {
    const master = doc({ updatedAt: 100, marked: false });
    const fork = doc({ updatedAt: 200, marked: true });
    const resolved = await handler.resolve({ realMasterState: master, newDocumentState: fork }, 'test');
    expect(resolved.marked).toBe(true);
    expect(resolved.updatedAt).toBe(101);
  });

  it('平局与 fork 较旧时偏向 realMasterState（避免同时间戳来回推送）', async () => {
    const master = doc({ updatedAt: 100, marked: false });
    const tie = doc({ updatedAt: 100, marked: true });
    const older = doc({ updatedAt: 50, marked: true });
    expect(await handler.resolve({ realMasterState: master, newDocumentState: tie }, 'test')).toBe(master);
    expect(await handler.resolve({ realMasterState: master, newDocumentState: older }, 'test')).toBe(master);
  });

  it('updatedAt 缺失按 0 回落（legacy 文档），双方都缺时 master 胜', async () => {
    const master = doc({ updatedAt: 0, marked: false });
    const legacyFork = { ...doc({ marked: true }) } as Partial<TestDoc>;
    delete (legacyFork as { updatedAt?: number }).updatedAt;
    const resolved = await handler.resolve(
      {
        realMasterState: master,
        newDocumentState: legacyFork as TestDoc,
      },
      'test'
    );
    expect(resolved).toBe(master);
  });

  it('isEqual 只看 updatedAt 与 _deleted（复制层的变更检测口径）', () => {
    const a = doc({ updatedAt: 100 });
    const sameTs = doc({ updatedAt: 100, marked: false });
    expect(handler.isEqual(a, sameTs, 'test')).toBe(true);
    expect(handler.isEqual(a, doc({ updatedAt: 101 }), 'test')).toBe(false);
    expect(handler.isEqual(a, { ...doc({ updatedAt: 100 }), _deleted: true }, 'test')).toBe(false);
  });
});
