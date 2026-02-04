import {
  type ExtractDocumentTypeFromTypedRxJsonSchema,
  type RxCollection,
  type RxJsonSchema,
  toTypedRxJsonSchema,
} from 'rxdb';

/** 统一可见性表：标点图层、电线杆类型、自定义标点类型等均存于此，通过 entityKey 前缀区分 */
const visibilityDataSchemaLiteral = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 256 },
    entityKey: { type: 'string', maxLength: 150 },
    mapId: { type: 'string', maxLength: 100 },
    visible: { type: 'boolean' },
    createdAt: { type: 'number' },
    updatedAt: { type: 'number' },
  },
  required: ['id', 'entityKey', 'mapId', 'visible', 'createdAt', 'updatedAt'],
} as const;

export const visibilityDataSchemaTyped = toTypedRxJsonSchema(visibilityDataSchemaLiteral);

export type VisibilityDataSchemaType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof visibilityDataSchemaTyped>;

export const visibilityDataSchema: RxJsonSchema<VisibilityDataSchemaType> = visibilityDataSchemaLiteral;

export type VisibilityDataCollection = RxCollection<VisibilityDataSchemaType>;
