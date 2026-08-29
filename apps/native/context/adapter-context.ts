import type { MapLibreAdapter } from '@endfieldmap/map-adapter-maplibre';
import { createContext, useContext } from 'react';

export const AdapterContext = createContext<MapLibreAdapter | null>(null);

export function useAdapter(): MapLibreAdapter {
  const adapter = useContext(AdapterContext);
  if (!adapter) {
    throw new Error('useAdapter must be used within AdapterProvider');
  }
  return adapter;
}
