import type { EndfieldMapAdapter } from '@endfieldmap/map-core';
import { createContext } from 'react';

import type { DataService } from '@/services/data';

export interface AdapterContextProps {
  adapter: EndfieldMapAdapter;
  dataService: DataService;
}

export const AdapterContext = createContext<AdapterContextProps | null>(null);
