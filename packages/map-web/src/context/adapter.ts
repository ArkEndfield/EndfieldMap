import type { EndfieldMapAdapter } from '@endfieldmap/map-core';
import { createContext } from 'react';

import type { MapDataService } from '@/services/data/map';
import type { MapService } from '@/services/map';

export interface AdapterContextProps {
  adapter: EndfieldMapAdapter;
  mapDataService: MapDataService;
  mapService: MapService;
}

export const AdapterContext = createContext<AdapterContextProps | null>(null);
