import {
  type ExtractDocumentTypeFromTypedRxJsonSchema,
  type RxCollection,
  type RxJsonSchema,
  toTypedRxJsonSchema,
} from 'rxdb';

const itemSchemaLiteral = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 128 },
    iconId: { type: 'string' },
    decoDesc: { type: 'string' },
    desc: { type: 'string' },
    name: { type: 'string' },
    rarity: { type: 'number' },
  },
  required: ['id', 'iconId', 'decoDesc', 'desc', 'name', 'rarity'],
} as const;

export const itemSchemaTyped = toTypedRxJsonSchema(itemSchemaLiteral);

export type ItemSchemaType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof itemSchemaTyped>;

export const itemSchema: RxJsonSchema<ItemSchemaType> = itemSchemaLiteral;

export type ItemCollection = RxCollection<ItemSchemaType>;
