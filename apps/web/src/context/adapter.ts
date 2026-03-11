import type { EndfieldMapAdapter } from '@endfieldmap/map-adapter-ol';
import { createContext } from 'react';

export interface AdapterContextProps {
  adapter: EndfieldMapAdapter;
}

export const AdapterContext = createContext<AdapterContextProps | null>(null);
