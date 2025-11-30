import { useContext } from 'react';

import { AdapterContext } from '@/context/adapter';

export function useAdapter() {
  const context = useContext(AdapterContext);
  if (!context) {
    throw new Error('useAdapter must be used within AdapterProvider');
  }
  return context;
}
