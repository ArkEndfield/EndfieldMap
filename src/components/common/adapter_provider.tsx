import type { EndfieldMapAdapter, MapIndex } from '@endfieldmap/map-core';
import type { ReactNode } from 'react';
import { AdapterContext } from '@/context/adapter';

export interface AdapterProviderProps {
  adapter: EndfieldMapAdapter;
  renderMap: (mapIdx?: MapIndex | undefined) => void;
  children: ReactNode;
}

export function AdapterProvider({ adapter, renderMap, children }: AdapterProviderProps) {
  return <AdapterContext.Provider value={{ adapter, renderMap }}>{children}</AdapterContext.Provider>;
}