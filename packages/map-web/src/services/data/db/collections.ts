import type { Collection as TSCollection } from '@tanstack/react-db';
import { createCollection } from '@tanstack/react-db';
import type { RxDBCollectionConfig } from '@tanstack/rxdb-db-collection';
import { rxdbCollectionOptions } from '@tanstack/rxdb-db-collection';
import type { RxCollection, RxDatabase } from 'rxdb';

import { chestRewardSchema, type ChestRewardSchemaType } from '@/services/data/db/schema/game_data/chest_reward';
import {
  deltaRobotLevelListSchema,
  type DeltaRobotLevelListSchemaType,
  deltaRobotParsedLevelSchema,
  type DeltaRobotParsedLevelSchemaType,
} from '@/services/data/db/schema/game_data/delta_robot';
import { dungeonSeriesSchema, type DungeonSeriesSchemaType } from '@/services/data/db/schema/game_data/dungeon_series';
import { guideSchema, type GuideSchemaType } from '@/services/data/db/schema/game_data/guide';
import { itemSchema, type ItemSchemaType } from '@/services/data/db/schema/game_data/item';
import {
  type CustomPointNodeCollection,
  customPointNodeSchema,
  type CustomPointNodeSchemaType,
} from '@/services/data/db/schema/user_data/custom_point';
import {
  type ElectricPoleNodeCollection,
  electricPoleNodeSchema,
  type ElectricPoleNodeSchemaType,
} from '@/services/data/db/schema/user_data/electric_pole';
import { type MarkDataCollection, markDataSchema, type MarkDataSchemaType } from '@/services/data/db/schema/user_data/mark';
import { type PresetCollection, presetSchema, type PresetSchemaType } from '@/services/data/db/schema/user_data/preset';
import {
  type VisibilityDataCollection,
  visibilityDataSchema,
  type VisibilityDataSchemaType,
} from '@/services/data/db/schema/user_data/visibility';

export type DBCollections = {
  electricPoleNode: ElectricPoleNodeCollection;
  electricPolePreset: PresetCollection;
  electricPoleVisibility: VisibilityDataCollection;

  customPointNode: CustomPointNodeCollection;
  customPointPreset: PresetCollection;
  customPointVisibility: VisibilityDataCollection;

  entityMark: MarkDataCollection;
  entityVisibility: VisibilityDataCollection;

  gameItem: RxCollection<ItemSchemaType>;
  gameChestReward: RxCollection<ChestRewardSchemaType>;
  gameDungeonSeries: RxCollection<DungeonSeriesSchemaType>;
  gameGuide: RxCollection<GuideSchemaType>;
  gameDeltaRobotLevelList: RxCollection<DeltaRobotLevelListSchemaType>;
  gameDeltaRobotParsedLevel: RxCollection<DeltaRobotParsedLevelSchemaType>;
};

export const userDataCollectionsSchema = {
  // 用户数据
  electricPoleNode: {
    schema: electricPoleNodeSchema,
  },
  electricPolePreset: {
    schema: presetSchema,
  },
  electricPoleVisibility: {
    schema: visibilityDataSchema,
  },
  customPointNode: {
    schema: customPointNodeSchema,
  },
  customPointPreset: {
    schema: presetSchema,
  },
  customPointVisibility: {
    schema: visibilityDataSchema,
  },
  entityMark: {
    schema: markDataSchema,
  },
  entityVisibility: {
    schema: visibilityDataSchema,
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
  gameGuide: {
    schema: guideSchema,
  },
  gameDeltaRobotLevelList: {
    schema: deltaRobotLevelListSchema,
  },
  gameDeltaRobotParsedLevel: {
    schema: deltaRobotParsedLevelSchema,
  },
};

export class UserCollections {
  public electricPoleNode: Collection<ElectricPoleNodeSchemaType>;
  public electricPolePreset: Collection<PresetSchemaType>;
  public electricPoleVisibility: Collection<VisibilityDataSchemaType>;

  public customPointNode: Collection<CustomPointNodeSchemaType>;
  public customPointPreset: Collection<PresetSchemaType>;
  public customPointVisibility: Collection<VisibilityDataSchemaType>;

  public entityMark: Collection<MarkDataSchemaType>;
  public entityVisibility: Collection<VisibilityDataSchemaType>;

  constructor(db: RxDatabase<DBCollections>) {
    this.electricPoleNode = new Collection(db.electricPoleNode);
    this.electricPolePreset = new Collection(db.electricPolePreset);
    this.electricPoleVisibility = new Collection(db.electricPoleVisibility);

    this.customPointNode = new Collection(db.customPointNode);
    this.customPointPreset = new Collection(db.customPointPreset);
    this.customPointVisibility = new Collection(db.customPointVisibility);

    this.entityMark = new Collection(db.entityMark);
    this.entityVisibility = new Collection(db.entityVisibility);
  }
}

export class GameDataCollections {
  public gameItem: Collection<ItemSchemaType>;
  public gameChestReward: Collection<ChestRewardSchemaType>;
  public gameDungeonSeries: Collection<DungeonSeriesSchemaType>;
  public gameGuide: Collection<GuideSchemaType>;
  public gameDeltaRobotLevelList: Collection<DeltaRobotLevelListSchemaType>;
  public gameDeltaRobotParsedLevel: Collection<DeltaRobotParsedLevelSchemaType>;

  constructor(db: RxDatabase<DBCollections>) {
    this.gameItem = new Collection(db.gameItem);
    this.gameChestReward = new Collection(db.gameChestReward);
    this.gameDungeonSeries = new Collection(db.gameDungeonSeries);
    this.gameGuide = new Collection(db.gameGuide);
    this.gameDeltaRobotLevelList = new Collection(db.gameDeltaRobotLevelList);
    this.gameDeltaRobotParsedLevel = new Collection(db.gameDeltaRobotParsedLevel);
  }
}

export class Collection<T extends object> {
  public collection: RxCollection<T>;
  public tanStackDbCollection: TSCollection<T, string>;

  constructor(collection: RxCollection<T>, options?: Omit<RxDBCollectionConfig<T>, 'rxCollection'>) {
    this.collection = collection;
    this.tanStackDbCollection = createCollection(
      rxdbCollectionOptions({
        rxCollection: collection,
        startSync: true,
        ...options,
      })
    );
  }
}
