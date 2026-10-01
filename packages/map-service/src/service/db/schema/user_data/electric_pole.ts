import {
  type ExtractDocumentTypeFromTypedRxJsonSchema,
  type RxCollection,
  type RxJsonSchema,
  toTypedRxJsonSchema,
} from 'rxdb';

const electricPoleNodeSchemaLiteral = {
  version: 1,
  primaryKey: 'id', // 每一个点都是独立的文档
  type: 'object',
  properties: {
    syncScope: { type: 'string' },
    id: { type: 'string', maxLength: 128 },
    presetId: { type: 'string', maxLength: 64 },
    mapId: { type: 'string', maxLength: 64 },

    // 下面直接复用 ElectricPoleData 的字段结构
    levelLogicId: { type: 'number' },
    entityDataIdKey: { type: 'string' },
    templateId: { type: 'string' },
    entityType: { type: 'string' },
    position: {
      type: 'object',
      properties: { x: { type: 'number' }, y: { type: 'number' }, z: { type: 'number' } },
      required: ['x', 'y', 'z'],
    },
    properties: {
      type: 'object',
      additionalProperties: true,
    },

    createdAt: { type: 'number' },
    updatedAt: { type: 'number' },
  },
  required: [
    'id',
    'presetId',
    'mapId',
    'levelLogicId',
    'entityDataIdKey',
    'position',
    'templateId',
    'entityType',
    'properties',
    'createdAt',
    'updatedAt',
  ],
  indexes: [
    'presetId', // 允许快速查找某个预设下的所有点
    ['presetId', 'mapId'], // 允许快速查找某个预设在特定地图下的所有点
  ],
} as const;

export const electricPoleNodeSchemaTyped = toTypedRxJsonSchema(electricPoleNodeSchemaLiteral);

export type ElectricPoleNodeSchemaType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof electricPoleNodeSchemaTyped>;

export const electricPoleNodeSchema: RxJsonSchema<ElectricPoleNodeSchemaType> = electricPoleNodeSchemaLiteral;

export type ElectricPoleNodeCollection = RxCollection<ElectricPoleNodeSchemaType>;
