import { useContext } from 'react';

import { DrawHistoryContext, type DrawHistoryContextValue } from '@/components/common/dev_tools/draws/context/draw_history';

export const useDrawHistory = (): DrawHistoryContextValue => {
  const context = useContext(DrawHistoryContext);
  if (!context) {
    throw new Error('useDrawHistory must be used within a DrawHistoryProvider');
  }
  return context;
};
