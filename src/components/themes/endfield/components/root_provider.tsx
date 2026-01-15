import { EndfieldThemeUIManagerContext } from '@themes/endfield/context/ui_manager';
import { EndfieldUIManager } from '@/components/themes/endfield/ui/ui_manager';
import type { ThemeRootContextProps } from '@themes/types/context';

const EndfieldThemeRootProvider = ({ children, dataService }: ThemeRootContextProps) => {
  const uiManager = EndfieldUIManager.getInstance(dataService);
  return (
    <EndfieldThemeUIManagerContext.Provider value={{ uiManager, dataService }}>
      {children}
    </EndfieldThemeUIManagerContext.Provider>
  );
};

export default EndfieldThemeRootProvider;
