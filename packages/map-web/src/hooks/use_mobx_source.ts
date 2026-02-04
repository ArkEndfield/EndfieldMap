import { reaction } from 'mobx';
import { useSyncExternalStore } from 'react';

/**
 * React hook that subscribes to a MobX observable and returns its value.
 * Uses useSyncExternalStore for concurrent mode compatibility.
 *
 * @param expression A function that returns the observable value to track
 * @returns The current value of the observable
 */
export function useMobxSource<T>(expression: () => T): T {
  return useSyncExternalStore(
    (callback) => {
      const disposer = reaction(expression, callback, { fireImmediately: false });
      return disposer;
    },
    expression,
    expression // Server snapshot (optional, reusing expression for simplicity if safe)
  );
}
