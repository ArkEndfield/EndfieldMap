import type { EndfieldUIManager } from '@/components/themes/endfield/ui/ui_manager';
import { createContext } from 'react';

import type { DataService } from '@/services/data';

export interface EndfieldThemeUIManagerContextProps {
  uiManager: EndfieldUIManager;
  dataService: DataService;
}

export const EndfieldThemeUIManagerContext = createContext<EndfieldThemeUIManagerContextProps | null>(null);
