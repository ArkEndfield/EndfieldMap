import { MapOL } from '@endfieldmap/map-core';
import { createContext } from 'react';

export interface DrawHistoryContextValue {
  canUndo: boolean;
  canRedo: boolean;
  featureCount: number;
  addFeature: (feature: InstanceType<typeof MapOL.Feature>) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
}

export const DrawHistoryContext = createContext<DrawHistoryContextValue | null>(null);
