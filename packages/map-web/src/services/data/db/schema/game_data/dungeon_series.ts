import {
  type ExtractDocumentTypeFromTypedRxJsonSchema,
  type RxCollection,
  type RxJsonSchema,
  toTypedRxJsonSchema,
} from 'rxdb';

const dungeonSeriesSchemaLiteral = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 128 },
    name: { type: 'string' },
    desc: { type: 'string' },
    dungeonCategory: { type: 'string' },
    dungeonCategory2nd: { type: 'string' },
    dungeonImg: { type: 'string' },
    dungeonPicPath: { type: 'string' },
    gameCategory: { type: 'string' },
    staminaText: { type: 'string' },
    includeDungeon: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          dungeonId: { type: 'string' },
          levelId: { type: 'string' },
          enemyIds: {
            type: 'array',
            items: { type: 'string' },
          },
          enemyLevels: {
            type: 'array',
            items: { type: 'number' },
          },
          recommendLv: { type: 'number' },
          costStamina: { type: 'number' },
          difficulty: { type: 'number' },
          extraRewardId: { type: 'string' },
          firstPassRewardId: { type: 'string' },
          gameCoolDown: { type: 'number' },
          rewardId: { type: 'string' },
        },
        required: [
          'dungeonId',
          'levelId',
          'enemyIds',
          'enemyLevels',
          'recommendLv',
          'costStamina',
          'difficulty',
          'extraRewardId',
          'firstPassRewardId',
          'gameCoolDown',
          'rewardId',
        ],
      },
    },
  },
  required: ['id', 'includeDungeon'],
} as const;

export const dungeonSeriesSchemaTyped = toTypedRxJsonSchema(dungeonSeriesSchemaLiteral);

export type DungeonSeriesSchemaType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof dungeonSeriesSchemaTyped>;

export const dungeonSeriesSchema: RxJsonSchema<DungeonSeriesSchemaType> = dungeonSeriesSchemaLiteral;

export type DungeonSeriesCollection = RxCollection<DungeonSeriesSchemaType>;
