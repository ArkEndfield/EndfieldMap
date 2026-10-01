import {
  type ExtractDocumentTypeFromTypedRxJsonSchema,
  type RxCollection,
  type RxJsonSchema,
  toTypedRxJsonSchema,
} from 'rxdb';

/**
 * 地图路线集合：一条路线一个文档，内嵌多段点位。
 *
 * 单文档结构（不拆 preset + node）是因为路线总是整体读写（导入/发布/展示），
 * 拆表只会增加事务面。点位坐标存世界坐标，与标点同系。
 *
 * 注意：本集合只存在于浏览器本地（Dexie），不参与云端同步——森空岛导入的
 * 路线按需求只做本地暂存，避免把上游数据落到本站服务端。
 */
const routeSchemaLiteral = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 128 },
    name: { type: 'string' },
    description: { type: 'string' },
    source: { type: 'string', maxLength: 16 }, // 'local' | 'skland'
    sourceRouteId: { type: 'string', maxLength: 64 },
    sklandRouteId: { type: 'string', maxLength: 64 },
    author: { type: 'string' },
    segments: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          mapId: { type: 'string', maxLength: 100 },
          color: { type: 'string', maxLength: 32 },
          points: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                x: { type: 'number' },
                y: { type: 'number' },
                z: { type: 'number' },
                levelLogicId: { type: 'number' },
              },
              required: ['x', 'y', 'z'],
            },
          },
        },
        required: ['mapId', 'points'],
      },
    },
    createdAt: { type: 'number' },
    updatedAt: { type: 'number' },
  },
  required: ['id', 'name', 'source', 'segments', 'createdAt', 'updatedAt'],
  indexes: ['source'],
} as const;

export const routeSchemaTyped = toTypedRxJsonSchema(routeSchemaLiteral);

export type RouteDocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof routeSchemaTyped>;

export const routeSchema: RxJsonSchema<RouteDocType> = routeSchemaLiteral;

export type RouteCollection = RxCollection<RouteDocType>;
