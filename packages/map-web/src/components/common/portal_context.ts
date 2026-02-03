import { createContext, useContext } from 'react';

/**
 * Context to provide a container for portals.
 * Useful when a component needs to render a portal into a specific container
 * (e.g. inside a dialog to avoid z-index issues) rather than document.body.
 */
export const PortalContext = createContext<HTMLElement | null>(null);

export const usePortalContainer = () => useContext(PortalContext);
