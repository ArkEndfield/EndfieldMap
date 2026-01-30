import {
  type ExtractDocumentTypeFromTypedRxJsonSchema,
  type RxCollection,
  type RxJsonSchema,
  toTypedRxJsonSchema,
} from 'rxdb';

const markDataSchemaLiteral = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 128 },
    entityId: { type: 'number' },
    mapId: { type: 'string', maxLength: 100 },
    marked: { type: 'boolean' },
  },
  required: ['id', 'entityId', 'mapId', 'marked'],
} as const;

export const markDataSchemaTyped = toTypedRxJsonSchema(markDataSchemaLiteral);

export type MarkDataSchemaType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof markDataSchemaTyped>;

export const markDataSchema: RxJsonSchema<MarkDataSchemaType> = markDataSchemaLiteral;

export type MarkDataCollection = RxCollection<MarkDataSchemaType>;
