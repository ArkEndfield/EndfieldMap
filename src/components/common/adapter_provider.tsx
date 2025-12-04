import type { EndfieldMapAdapter, MapIndex } from '@endfieldmap/map-core';
import type { ReactNode } from 'react';

import { AdapterContext } from '@/context/adapter';
import type { DataService } from '@/services/data';

export interface AdapterProviderProps {
  adapter: EndfieldMapAdapter;
  dataService: DataService;
  renderMap: (mapIdx?: MapIndex | undefined) => void;
  children: ReactNode;
}

export function AdapterProvider({ adapter, renderMap, dataService, children }: AdapterProviderProps) {
  return <AdapterContext.Provider value={{ adapter, renderMap, dataService }}>{children}</AdapterContext.Provider>;
}
