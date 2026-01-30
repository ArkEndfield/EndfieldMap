import {
  type ExtractDocumentTypeFromTypedRxJsonSchema,
  type RxCollection,
  type RxJsonSchema,
  toTypedRxJsonSchema,
} from 'rxdb';

const visibilityDataSchemaLiteral = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 64 },
    entityKey: { type: 'string', maxLength: 100 },
    mapId: { type: 'string', maxLength: 100 },
    visible: { type: 'boolean' },
  },
  required: ['id', 'entityKey', 'mapId', 'visible'],
} as const;

export const visibilityDataSchemaTyped = toTypedRxJsonSchema(visibilityDataSchemaLiteral);

export type VisibilityDataSchemaType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof visibilityDataSchemaTyped>;

export const visibilityDataSchema: RxJsonSchema<VisibilityDataSchemaType> = visibilityDataSchemaLiteral;

export type VisibilityDataCollection = RxCollection<VisibilityDataSchemaType>;
