import {
  type ExtractDocumentTypeFromTypedRxJsonSchema,
  type RxCollection,
  type RxJsonSchema,
  toTypedRxJsonSchema,
} from 'rxdb';

// Delta Robot Parsed Level schema (存储解析后的关卡数据)
const deltaRobotParsedLevelSchemaLiteral = {
  version: 0,
  primaryKey: 'levelId',
  type: 'object',
  properties: {
    levelId: { type: 'string', maxLength: 128 },
    sizeX: { type: 'number' },
    sizeY: { type: 'number' },
    groups: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          name: { type: 'string' },
          color: { type: 'string' },
        },
        required: ['id', 'name', 'color'],
      },
    },
    rowConstraints: {
      type: 'array',
      items: {
        type: 'array',
        items: { type: 'number' },
      },
    },
    colConstraints: {
      type: 'array',
      items: {
        type: 'array',
        items: { type: 'number' },
      },
    },
    obstaclesFlat: {
      type: 'array',
      items: {
        type: ['object', 'null'],
        properties: {
          type: { type: 'string' },
          groupId: { type: 'number' },
        },
      },
    },
    pieces: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          shape: {
            type: 'array',
            items: {
              type: 'array',
              items: { type: 'number' },
            },
          },
          groupId: { type: 'number' },
        },
        required: ['id', 'shape', 'groupId'],
      },
    },
  },
  required: ['levelId', 'sizeX', 'sizeY', 'groups', 'rowConstraints', 'colConstraints', 'obstaclesFlat', 'pieces'],
} as const;

export const deltaRobotParsedLevelSchemaTyped = toTypedRxJsonSchema(deltaRobotParsedLevelSchemaLiteral);

export type DeltaRobotParsedLevelSchemaType = ExtractDocumentTypeFromTypedRxJsonSchema<
  typeof deltaRobotParsedLevelSchemaTyped
>;

export const deltaRobotParsedLevelSchema: RxJsonSchema<DeltaRobotParsedLevelSchemaType> =
  deltaRobotParsedLevelSchemaLiteral;

export type DeltaRobotParsedLevelCollection = RxCollection<DeltaRobotParsedLevelSchemaType>;
