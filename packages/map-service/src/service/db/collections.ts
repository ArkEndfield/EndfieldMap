import {
  chestRewardSchema,
  type ChestRewardSchemaType,
} from '@endfieldmap/map-service/service/db/schema/game_data/chest_reward';
import {
  deltaRobotParsedLevelSchema,
  type DeltaRobotParsedLevelSchemaType,
} from '@endfieldmap/map-service/service/db/schema/game_data/delta_robot';
import {
  dungeonSeriesSchema,
  type DungeonSeriesSchemaType,
} from '@endfieldmap/map-service/service/db/schema/game_data/dungeon_series';
import { itemSchema, type ItemSchemaType } from '@endfieldmap/map-service/service/db/schema/game_data/item';
import {
  type CustomPointNodeCollection,
  customPointNodeSchema,
  type CustomPointNodeSchemaType,
} from '@endfieldmap/map-service/service/db/schema/user_data/custom_point';
import {
  type ElectricPoleNodeCollection,
  electricPoleNodeSchema,
  type ElectricPoleNodeSchemaType,
} from '@endfieldmap/map-service/service/db/schema/user_data/electric_pole';
import {
  type MarkDataCollection,
  markDataSchema,
  type MarkDataSchemaType,
} from '@endfieldmap/map-service/service/db/schema/user_data/mark';
import {
  type PresetCollection,
  presetSchema,
  type PresetSchemaType,
} from '@endfieldmap/map-service/service/db/schema/user_data/preset';
import {
  type RouteCollection,
  type RouteDocType,
  routeSchema,
} from '@endfieldmap/map-service/service/db/schema/user_data/route';
import {
  type VisibilityDataCollection,
  visibilityDataSchema,
  type VisibilityDataSchemaType,
} from '@endfieldmap/map-service/service/db/schema/user_data/visibility';
import type { RxCollection, RxDatabase } from 'rxdb';

/**
 * 用户数据数据库 Collections 类型定义
 */
export type UserDataDBCollections = {
  electricPoleNode: ElectricPoleNodeCollection;
  electricPolePreset: PresetCollection;

  customPointNode: CustomPointNodeCollection;
  customPointPreset: PresetCollection;

  entityMark: MarkDataCollection;
  entityVisibility: VisibilityDataCollection;

  route: RouteCollection;
};

/**
 * 游戏静态数据数据库 Collections 类型定义
 */
export type GameDataDBCollections = {
  gameItem: RxCollection<ItemSchemaType>;
  gameChestReward: RxCollection<ChestRewardSchemaType>;
  gameDungeonSeries: RxCollection<DungeonSeriesSchemaType>;
  gameDeltaRobotParsedLevel: RxCollection<DeltaRobotParsedLevelSchemaType>;
};

/**
 * @deprecated 使用 UserDataDBCollections 和 GameDataDBCollections 代替
 */
export type DBCollections = UserDataDBCollections & GameDataDBCollections;

export const userDataCollectionsSchema = {
  electricPoleNode: {
    schema: electricPoleNodeSchema,
    migrationStrategies: { 1: (doc: ElectricPoleNodeSchemaType) => doc },
  },
  electricPolePreset: {
    schema: presetSchema,
    migrationStrategies: { 1: (doc: PresetSchemaType) => doc },
  },
  customPointNode: {
    schema: customPointNodeSchema,
    migrationStrategies: { 1: (doc: CustomPointNodeSchemaType) => doc },
  },
  customPointPreset: {
    schema: presetSchema,
    migrationStrategies: { 1: (doc: PresetSchemaType) => doc },
  },
  entityMark: {
    schema: markDataSchema,
    migrationStrategies: { 1: (doc: MarkDataSchemaType) => doc },
  },
  entityVisibility: {
    schema: visibilityDataSchema,
  },
  route: {
    schema: routeSchema,
  },
};

export const gameDataCollectionsSchema = {
  gameItem: {
    schema: itemSchema,
  },
  gameChestReward: {
    schema: chestRewardSchema,
  },
  gameDungeonSeries: {
    schema: dungeonSeriesSchema,
  },
  gameDeltaRobotParsedLevel: {
    schema: deltaRobotParsedLevelSchema,
  },
};

export class UserCollections {
  public electricPoleNode: Collection<ElectricPoleNodeSchemaType>;
  public electricPolePreset: Collection<PresetSchemaType>;

  public customPointNode: Collection<CustomPointNodeSchemaType>;
  public customPointPreset: Collection<PresetSchemaType>;

  public entityMark: Collection<MarkDataSchemaType>;
  public entityVisibility: Collection<VisibilityDataSchemaType>;

  public route: Collection<RouteDocType>;

  constructor(db: RxDatabase<UserDataDBCollections>) {
    this.electricPoleNode = new Collection(db.electricPoleNode);
    this.electricPolePreset = new Collection(db.electricPolePreset);

    this.customPointNode = new Collection(db.customPointNode);
    this.customPointPreset = new Collection(db.customPointPreset);

    this.entityMark = new Collection(db.entityMark);
    this.entityVisibility = new Collection(db.entityVisibility);

    this.route = new Collection(db.route);
  }
}

export class GameDataCollections {
  // 游戏数据不需要 TanStack DB 响应式功能，直接使用 RxCollection 以提高性能
  public gameItem: RxCollection<ItemSchemaType>;
  public gameChestReward: RxCollection<ChestRewardSchemaType>;
  public gameDungeonSeries: RxCollection<DungeonSeriesSchemaType>;
  public gameDeltaRobotParsedLevel: RxCollection<DeltaRobotParsedLevelSchemaType>;

  constructor(db: RxDatabase<GameDataDBCollections>) {
    this.gameItem = db.gameItem;
    this.gameChestReward = db.gameChestReward;
    this.gameDungeonSeries = db.gameDungeonSeries;

    this.gameDeltaRobotParsedLevel = db.gameDeltaRobotParsedLevel;
  }
}

export class Collection<T extends object> {
  public collection: RxCollection<T>;

  constructor(collection: RxCollection<T>) {
    this.collection = collection;
  }
}
