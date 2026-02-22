import { reaction } from 'mobx';
import { useRef, useSyncExternalStore } from 'react';

/**
 * React hook that subscribes to a MobX observable and returns its value.
 * Uses useSyncExternalStore for concurrent mode compatibility.
 *
 * The snapshot is cached in a ref and only updated when the MobX reaction fires,
 * avoiding the infinite loop that occurs when getSnapshot returns a new reference
 * on every call.
 */
export function useMobxSource<T>(expression: () => T): T {
  // Keep expression ref up-to-date so the reaction always reads the latest closure
  const expressionRef = useRef(expression);
  expressionRef.current = expression;

  // Cache the snapshot value — only updated when the reaction fires
  const valueRef = useRef<{ current: T } | null>(null);
  if (valueRef.current === null) {
    valueRef.current = { current: expression() };
  }

  // Stable getSnapshot — always returns the cached value
  const getSnapshot = useRef(() => valueRef.current!.current).current;

  // Stable subscribe — sets up a MobX reaction that updates the cache
  const subscribe = useRef((callback: () => void) => {
    const disposer = reaction(
      () => expressionRef.current(),
      (newValue) => {
        valueRef.current = { current: newValue };
        callback();
      },
      { fireImmediately: false },
    );
    return disposer;
  }).current;

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
