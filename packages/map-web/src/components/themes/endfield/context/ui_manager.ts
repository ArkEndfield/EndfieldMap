import { createContext } from 'react';

import type { EndfieldUIManager } from '@/components/themes/endfield/ui/ui_manager';

export interface EndfieldThemeUIManagerContextProps {
  uiManager: EndfieldUIManager;
}

export const EndfieldThemeUIManagerContext = createContext<EndfieldThemeUIManagerContextProps | null>(null);
