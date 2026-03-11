import { domEventListener } from '@endfieldmap/tools';
import { type RefObject, useEffect } from 'react';

export const useClickOutside = (
  refs: RefObject<HTMLElement | null>[],
  callback: () => void,
  enabled: boolean = true
) => {
  useEffect(() => {
    if (!enabled) return;

    const clickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isOutside = refs.every((ref) => ref.current && !ref.current.contains(target));

      if (isOutside) {
        callback();
      }
    };

    return domEventListener(document, 'click', clickOutside);
  }, [refs, callback, enabled]);
};
