import {
  type ExtractDocumentTypeFromTypedRxJsonSchema,
  type RxCollection,
  type RxJsonSchema,
  toTypedRxJsonSchema,
} from 'rxdb';

const guideSchemaLiteral = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 128 },
    nodes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          text: { type: 'string' },
          color: { type: 'string' },
          fontSize: { type: 'number' },
          fontWeight: { type: 'number' },
          fontFamily: { type: 'string' },
          src: { type: 'string' },
          nodes: { type: 'array' },
        },
        required: ['type'],
      },
    },
    video: {
      type: 'object',
      properties: {
        link: { type: ['string', 'null'] },
      },
    },
  },
  required: ['id', 'nodes', 'video'],
} as const;

export const guideSchemaTyped = toTypedRxJsonSchema(guideSchemaLiteral);

export type GuideSchemaType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof guideSchemaTyped>;

export const guideSchema: RxJsonSchema<GuideSchemaType> = guideSchemaLiteral;

export type GuideCollection = RxCollection<GuideSchemaType>;
