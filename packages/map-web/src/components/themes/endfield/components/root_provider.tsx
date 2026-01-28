import { EndfieldThemeUIManagerContext } from '@themes/endfield/context/ui_manager';
import type { ThemeRootContextProps } from '@themes/types/context';

import { EndfieldUIManager } from '@/components/themes/endfield/ui/ui_manager';

const EndfieldThemeRootProvider = ({ children, mapDataService }: ThemeRootContextProps) => {
  const uiManager = EndfieldUIManager.getInstance(mapDataService);
  return (
    <EndfieldThemeUIManagerContext.Provider value={{ uiManager, mapDataService }}>
      {children}
    </EndfieldThemeUIManagerContext.Provider>
  );
};

export default EndfieldThemeRootProvider;
