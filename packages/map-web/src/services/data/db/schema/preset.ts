import {
  toTypedRxJsonSchema,
  type ExtractDocumentTypeFromTypedRxJsonSchema,
  type RxJsonSchema,
  type RxCollection,
} from 'rxdb';

export const presetSchemaLiteral = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 64 },
    name: { type: 'string' },
    createdAt: { type: 'number' },
    updatedAt: { type: 'number' },
  },
  required: ['id', 'name'],
} as const;

const presetSchemaTyped = toTypedRxJsonSchema(presetSchemaLiteral);

export type PresetSchemaType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof presetSchemaTyped>;

export const presetSchema: RxJsonSchema<PresetSchemaType> = presetSchemaLiteral;

export type PresetCollection = RxCollection<PresetSchemaType>;
