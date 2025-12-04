import type { EndfieldMapAdapter, MapIndex } from '@endfieldmap/map-core';
import { createContext } from 'react';

import type { DataService } from '@/services/data';

export interface AdapterContextProps {
  adapter: EndfieldMapAdapter;
  dataService: DataService;
  renderMap: (mapIdx?: MapIndex | undefined) => void;
}

export const AdapterContext = createContext<AdapterContextProps | null>(null);
