import { describe, expect, it } from 'vitest';

import { routeSchema, type RouteDocType } from '@endfieldmap/map-service/service/db/schema/user_data/route';
import { addRxPlugin, createRxDatabase, type RxCollection } from 'rxdb/plugins/core';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';

/**
 * 用内存存储 + dev 模式（含 checkSchema + AJV 校验）真实创建 route collection，
 * 锁定两件事：
 * 1. schema 能通过 RxDB 的结构校验（索引 maxLength、嵌套数组 items 等）；
 * 2. 带可选字段缺省 / 显式 undefined 的文档能合法写入并被读回。
 *
 * 存储包一层 AJV 校验器，与 apps/web dev 模式的 wrappedValidateAjvStorage 一致。
 */
describe('route rxdb schema', () => {
  const createDb = async () => {
    addRxPlugin(RxDBDevModePlugin);
    return createRxDatabase<{ route: RxCollection<RouteDocType> }>({
      name: 'route_schema_test',
      storage: wrappedValidateAjvStorage({ storage: getRxStorageMemory() }),
      ignoreDuplicate: true,
    });
  };

  it('passes dev-mode schema checks and accepts a full document', async () => {
    const db = await createDb();
    await db.addCollections({ route: { schema: routeSchema } });

    await db.route.insert({
      id: 'route_1',
      name: '我的路线',
      description: '备注',
      source: 'local',
      sourceRouteId: 'skland-1',
      sklandRouteId: 'skland-1',
      author: '作者',
      segments: [
        {
          mapId: 'map01',
          color: '#01ffa2',
          points: [
            { x: 1, y: 2, z: 3, levelLogicId: 111 },
            { x: 4, y: 5, z: 6 },
          ],
        },
      ],
      createdAt: 1,
      updatedAt: 1,
    } as RouteDocType);

    const doc = await db.route.findOne().exec();
    expect(doc?.get('name')).toBe('我的路线');
    expect((doc?.get('segments') as RouteDocType['segments'])[0].points).toHaveLength(2);

    await db.close();
  });

  it('accepts a document whose optional fields are absent', async () => {
    const db = await createDb();
    await db.addCollections({ route: { schema: routeSchema } });

    await db.route.upsert({
      id: 'route_skland_1',
      name: '导入的路线',
      source: 'skland',
      segments: [{ mapId: 'map02', points: [{ x: -1384.75, y: 320, z: -292.96 }] }],
      createdAt: 1,
      updatedAt: 1,
    } as unknown as RouteDocType);

    const doc = await db.route.findOne('route_skland_1').exec();
    expect(doc).not.toBeNull();
    expect(doc?.get('author')).toBeUndefined();

    await db.close();
  });
});