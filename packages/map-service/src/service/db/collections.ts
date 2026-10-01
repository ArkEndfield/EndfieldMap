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
import type { RxCollection, RxConflictHandler, RxDatabase } from 'rxdb';

/**
 * 同步集合的 updatedAt-LWW 冲突处理器。
 * RxDB 默认处理器是「主胜」（realMasterState 恒胜）：与服务端
 * assumed.UpdatedAt != current.UpdatedAt 即拒写回显的语义组合后，
 * 离线/停同步期间的本机编辑一旦撞上服务端已变更的文档会被静默整体回滚。
 * 这里按 updatedAt 新者胜，平局偏向 realMasterState（避免同时间戳在
 * 两端来回推送）。只挂到参与同步且 schema 含 updatedAt 的集合上。
 */
const makeUpdatedAtLwwConflictHandler = <T extends { updatedAt?: number }>(): RxConflictHandler<T> => ({
  isEqual(a, b) {
    return a.updatedAt === b.updatedAt && a._deleted === b._deleted;
  },
  async resolve(i) {
    const masterTs = i.realMasterState.updatedAt ?? 0;
    const forkTs = i.newDocumentState.updatedAt ?? 0;
    if (masterTs >= forkTs) {
      return i.realMasterState;
    }
    // fork 较新时保留本地内容，但把时间戳钳到 masterTs+1：服务端接受写入后
    // 会以自己的 NOW() 重盖 updated_at（必然 ≥ masterTs+1），回拉时 master
    // 不再落后于 fork，一次往返即收敛。不钳的话客户端时钟偏快（哪怕几十秒）
    // 会让 fork 永远"更新"，resolve→重推→服务端重盖→再 resolve 循环不收敛。
    return { ...i.newDocumentState, updatedAt: masterTs + 1 };
  },
});

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
    conflictHandler: makeUpdatedAtLwwConflictHandler<ElectricPoleNodeSchemaType>(),
  },
  electricPolePreset: {
    schema: presetSchema,
    migrationStrategies: { 1: (doc: PresetSchemaType) => doc },
    conflictHandler: makeUpdatedAtLwwConflictHandler<PresetSchemaType>(),
  },
  customPointNode: {
    schema: customPointNodeSchema,
    migrationStrategies: { 1: (doc: CustomPointNodeSchemaType) => doc },
    conflictHandler: makeUpdatedAtLwwConflictHandler<CustomPointNodeSchemaType>(),
  },
  customPointPreset: {
    schema: presetSchema,
    migrationStrategies: { 1: (doc: PresetSchemaType) => doc },
    conflictHandler: makeUpdatedAtLwwConflictHandler<PresetSchemaType>(),
  },
  entityMark: {
    schema: markDataSchema,
    migrationStrategies: { 1: (doc: MarkDataSchemaType) => doc },
    conflictHandler: makeUpdatedAtLwwConflictHandler<MarkDataSchemaType>(),
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
