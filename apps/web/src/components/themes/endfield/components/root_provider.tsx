import type { ThemeRootContextProps } from '@endfieldmap/map-web-theme-types/context';
import { EndfieldThemeUIManagerContext } from '@themes/endfield/context/ui_manager';

import { EndfieldUIManager } from '@/components/themes/endfield/ui/ui_manager';

const EndfieldThemeRootProvider = ({ children }: ThemeRootContextProps) => {
  const uiManager = EndfieldUIManager.getInstance();
  return (
    <EndfieldThemeUIManagerContext.Provider value={{ uiManager }}>
      {children}
    </EndfieldThemeUIManagerContext.Provider>
  );
};

export default EndfieldThemeRootProvider;
