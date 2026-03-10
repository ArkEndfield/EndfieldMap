import { Collection } from '@endfieldmap/map-service';
import { type Collection as TSCollection, createCollection } from '@tanstack/react-db';
import { rxdbCollectionOptions } from '@tanstack/rxdb-db-collection';
import { useMemo } from 'react';
import type { RxCollection } from 'rxdb';

export const useCollection = <T extends object>(
  collection: RxCollection<T> | Collection<T>
): TSCollection<T, string> => {
  return useMemo(() => {
    const rxCollection = collection instanceof Collection ? collection.collection : collection;
    return createCollection(
      rxdbCollectionOptions({
        rxCollection: rxCollection,
        startSync: true,
      })
    ) as TSCollection<T, string>;
  }, [collection]);
};
