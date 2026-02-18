import {
  type ExtractDocumentTypeFromTypedRxJsonSchema,
  type RxCollection,
  type RxJsonSchema,
  toTypedRxJsonSchema,
} from 'rxdb';

const customPointNodeSchemaLiteral = {
  version: 0,
  primaryKey: 'id', // 注意：这里需要是唯一的 UUID
  type: 'object',
  properties: {
    // 物理主键: 建议格式 `${presetId}|${mapId}|${levelLogicId}` 或者是纯 UUID
    id: { type: 'string', maxLength: 128 },

    // 外键索引
    presetId: { type: 'string', maxLength: 64 },
    mapId: { type: 'string', maxLength: 64 },

    // --- 以下复用 CustomPointData 的字段结构 ---

    // 逻辑ID
    levelLogicId: { type: 'number' },

    // 注意：在自定义标点中，这个字段通常是类型 (e.g., 'custom_point_1')
    entityDataIdKey: { type: 'string' },

    templateId: { type: 'string' },
    entityType: { type: 'string' }, // 固定为 '#CustomPoint'

    position: {
      type: 'object',
      properties: {
        x: { type: 'number' },
        y: { type: 'number' },
        z: { type: 'number' },
      },
      required: ['x', 'y', 'z'],
    },

    // 属性 (包含 name 等)
    properties: {
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
      additionalProperties: true, // 允许 EnityProperties 的其他动态属性
    },

    createdAt: { type: 'number' },
    updatedAt: { type: 'number' },
  },
  required: [
    'id',
    'presetId',
    'mapId',
    'levelLogicId',
    'templateId',
    'entityType',
    'entityDataIdKey',
    'position',
    'properties',
    'createdAt',
    'updatedAt',
  ],
  indexes: [
    'presetId', // 用于加载某个预设的所有点
    ['presetId', 'mapId'], // 用于筛选特定地图的点
  ],
} as const;

export const customPointNodeSchemaTyped = toTypedRxJsonSchema(customPointNodeSchemaLiteral);

export type CustomPointNodeSchemaType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof customPointNodeSchemaTyped>;

export const customPointNodeSchema: RxJsonSchema<CustomPointNodeSchemaType> = customPointNodeSchemaLiteral;

export type CustomPointNodeCollection = RxCollection<CustomPointNodeSchemaType>;
