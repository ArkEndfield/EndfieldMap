import type { MapLibreAdapter } from '@endfieldmap/map-adapter-maplibre';
import React from 'react';

import { AdapterContext } from './adapter-context';

interface AdapterProviderProps {
  adapter: MapLibreAdapter;
  children: React.ReactNode;
}

export function AdapterProvider({ adapter, children }: AdapterProviderProps) {
  return <AdapterContext.Provider value={adapter}>{children}</AdapterContext.Provider>;
}
