import { createContext } from 'react';

import type { EndfieldUIManager } from '@/components/themes/endfield/ui/ui_manager';
import type { MapDataService } from '@/services/data/map';

export interface EndfieldThemeUIManagerContextProps {
  uiManager: EndfieldUIManager;
  mapDataService: MapDataService;
}

export const EndfieldThemeUIManagerContext = createContext<EndfieldThemeUIManagerContextProps | null>(null);
