import type { ReactNode } from 'react';

import { AdapterContext, type AdapterContextProps } from '@/context/adapter';

export interface AdapterProviderProps extends AdapterContextProps {
  children: ReactNode;
}

export function AdapterProvider({ adapter, children }: AdapterProviderProps) {
  return <AdapterContext.Provider value={{ adapter }}>{children}</AdapterContext.Provider>;
}
