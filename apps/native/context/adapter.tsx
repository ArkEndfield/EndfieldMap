import type { MapLibreAdapter } from '@endfieldmap/map-adapter-maplibre';
import React, { createContext, useContext } from 'react';

const AdapterContext = createContext<MapLibreAdapter | null>(null);

interface AdapterProviderProps {
  adapter: MapLibreAdapter;
  children: React.ReactNode;
}

export function AdapterProvider({ adapter, children }: AdapterProviderProps) {
  return <AdapterContext.Provider value={adapter}>{children}</AdapterContext.Provider>;
}

export function useAdapter(): MapLibreAdapter {
  const adapter = useContext(AdapterContext);
  if (!adapter) {
    throw new Error('useAdapter must be used within AdapterProvider');
  }
  return adapter;
}
