import type { EndfieldMapAdapter } from '@endfieldmap/map-core';
import type { ReactNode } from 'react';

import { AdapterContext } from '@/context/adapter';
import type { MapDataService } from '@/services/data/map';

export interface AdapterProviderProps {
  adapter: EndfieldMapAdapter;
  mapDataService: MapDataService;
  children: ReactNode;
}

export function AdapterProvider({ adapter, mapDataService, children }: AdapterProviderProps) {
  return <AdapterContext.Provider value={{ adapter, mapDataService }}>{children}</AdapterContext.Provider>;
}
