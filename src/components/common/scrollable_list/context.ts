import { createContext } from 'react';

export interface ScrollableListContextType {
  registerItemRef: (id: string, el: HTMLElement | null) => void;
}

export const ScrollableListContext = createContext<ScrollableListContextType | null>(null);
