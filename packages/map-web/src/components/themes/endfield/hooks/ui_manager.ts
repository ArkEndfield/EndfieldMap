import { EndfieldThemeUIManagerContext } from '@themes/endfield/context/ui_manager';
import { useContext } from 'react';

export const useEndfieldUIManager = () => {
  const context = useContext(EndfieldThemeUIManagerContext);
  if (!context) {
    throw new Error('useEndfieldUIManager must be used within a EndfieldThemeRootProvider');
  }
  return context.uiManager;
};
