import { useCallback, useContext } from 'react';

import { ScrollableListContext } from '@/components/common/scrollable_list/context';

export const useScrollableListItem = (id: string) => {
  const context = useContext(ScrollableListContext);
  if (!context) {
    throw new Error('useScrollableListItem must be used within ScrollableList');
  }

  return useCallback(
    (el: HTMLElement | null) => {
      context.registerItemRef(id, el);
    },
    [context, id]
  );
};
