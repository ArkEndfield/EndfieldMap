import { createContext, useContext } from 'react';

export const PortalContext = createContext<HTMLElement | null>(null);

export const usePortalContainer = () => useContext(PortalContext);
