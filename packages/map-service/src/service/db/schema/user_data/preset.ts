import {
  type ExtractDocumentTypeFromTypedRxJsonSchema,
  type RxCollection,
  type RxJsonSchema,
  toTypedRxJsonSchema,
} from 'rxdb';

export const presetSchemaLiteral = {
  version: 1,
  primaryKey: 'id',
  type: 'object',
  properties: {
    syncScope: { type: 'string' },
    id: { type: 'string', maxLength: 64 },
    name: { type: 'string' },
    createdAt: { type: 'number' },
    updatedAt: { type: 'number' },
  },
  required: ['id', 'name'],
} as const;

export const presetSchemaTyped = toTypedRxJsonSchema(presetSchemaLiteral);

export type PresetSchemaType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof presetSchemaTyped>;

export const presetSchema: RxJsonSchema<PresetSchemaType> = presetSchemaLiteral;

export type PresetCollection = RxCollection<PresetSchemaType>;
