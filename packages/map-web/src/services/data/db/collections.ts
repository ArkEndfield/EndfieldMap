import type { Collection as TSCollection } from '@tanstack/react-db';
import { createCollection } from '@tanstack/react-db';
import type { RxDBCollectionConfig } from '@tanstack/rxdb-db-collection';
import { rxdbCollectionOptions } from '@tanstack/rxdb-db-collection';
import type { RxCollection, RxDatabase } from 'rxdb';

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
  }
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

  constructor(db: RxDatabase<DBCollections>) {
    this.gameItem = new Collection(db.gameItem);
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
