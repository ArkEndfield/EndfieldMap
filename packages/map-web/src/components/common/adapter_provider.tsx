import type { EndfieldMapAdapter } from '@endfieldmap/map-core';
import type { ReactNode } from 'react';

import { AdapterContext } from '@/context/adapter';
import type { DataService } from '@/services/data';

export interface AdapterProviderProps {
  adapter: EndfieldMapAdapter;
  dataService: DataService;
  children: ReactNode;
}

export function AdapterProvider({ adapter, dataService, children }: AdapterProviderProps) {
  return <AdapterContext.Provider value={{ adapter, dataService }}>{children}</AdapterContext.Provider>;
}
