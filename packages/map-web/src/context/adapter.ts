import type { EndfieldMapAdapter } from '@endfieldmap/map-core';
import { createContext } from 'react';

import type { MapDataService } from '@/services/data/map';

export interface AdapterContextProps {
  adapter: EndfieldMapAdapter;
  mapDataService: MapDataService;
}

export const AdapterContext = createContext<AdapterContextProps | null>(null);
