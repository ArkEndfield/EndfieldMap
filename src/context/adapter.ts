import type { EndfieldMapAdapter, MapIndex } from '@endfieldmap/map-core';
import { createContext } from 'react';

export interface AdapterContextProps {
  adapter: EndfieldMapAdapter;
  renderMap: (mapIdx?: MapIndex | undefined) => void;
}

export const AdapterContext = createContext<AdapterContextProps | null>(null);

