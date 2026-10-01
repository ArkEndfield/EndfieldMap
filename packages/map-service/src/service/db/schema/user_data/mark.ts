import {
  type ExtractDocumentTypeFromTypedRxJsonSchema,
  type RxCollection,
  type RxJsonSchema,
  toTypedRxJsonSchema,
} from 'rxdb';

const markDataSchemaLiteral = {
  version: 1,
  primaryKey: 'id',
  type: 'object',
  properties: {
    syncScope: { type: 'string' },
    id: { type: 'string', maxLength: 128 },
    entityId: { type: 'number' },
    mapId: { type: 'string', maxLength: 100 },
    marked: { type: 'boolean' },
    createdAt: { type: 'number' },
    updatedAt: { type: 'number' },
  },
  required: ['id', 'entityId', 'mapId', 'marked', 'createdAt', 'updatedAt'],
} as const;

export const markDataSchemaTyped = toTypedRxJsonSchema(markDataSchemaLiteral);

export type MarkDataSchemaType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof markDataSchemaTyped>;

export const markDataSchema: RxJsonSchema<MarkDataSchemaType> = markDataSchemaLiteral;

export type MarkDataCollection = RxCollection<MarkDataSchemaType>;
