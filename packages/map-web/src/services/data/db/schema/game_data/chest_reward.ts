import {
  type ExtractDocumentTypeFromTypedRxJsonSchema,
  type RxCollection,
  type RxJsonSchema,
  toTypedRxJsonSchema,
} from 'rxdb';

const chestRewardSchemaLiteral = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 128 },
    // 带数量类型的奖励 (itemBundles)
    itemBundles: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          count: { type: 'number' },
        },
        required: ['id', 'count'],
      },
    },
    // 不带数量类型的奖励 (itemIds)
    itemIds: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: ['id'],
} as const;

export const chestRewardSchemaTyped = toTypedRxJsonSchema(chestRewardSchemaLiteral);

export type ChestRewardSchemaType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof chestRewardSchemaTyped>;

export const chestRewardSchema: RxJsonSchema<ChestRewardSchemaType> = chestRewardSchemaLiteral;

export type ChestRewardCollection = RxCollection<ChestRewardSchemaType>;
