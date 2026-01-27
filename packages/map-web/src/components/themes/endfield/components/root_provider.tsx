import { EndfieldThemeUIManagerContext } from '@themes/endfield/context/ui_manager';
import type { ThemeRootContextProps } from '@themes/types/context';

import { EndfieldUIManager } from '@/components/themes/endfield/ui/ui_manager';

const EndfieldThemeRootProvider = ({ children, dataService }: ThemeRootContextProps) => {
  const uiManager = EndfieldUIManager.getInstance(dataService);
  return (
    <EndfieldThemeUIManagerContext.Provider value={{ uiManager, dataService }}>
      {children}
    </EndfieldThemeUIManagerContext.Provider>
  );
};

export default EndfieldThemeRootProvider;
