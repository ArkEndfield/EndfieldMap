import { reaction } from 'mobx';
import { useRef, useSyncExternalStore } from 'react';

/**
 * 浅比较两个值是否相等
 * 对于原始类型使用 Object.is，对于数组和普通对象逐字段比较
 */
function shallowEqual<T>(a: T, b: T): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!Object.is(a[i], b[i])) return false;
    }
    return true;
  }

  if (Array.isArray(a) || Array.isArray(b)) return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (
      !Object.prototype.hasOwnProperty.call(b, key) ||
      !Object.is((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
    ) {
      return false;
    }
  }
  return true;
}

/**
 * React hook that subscribes to a MobX observable and returns its value.
 * Uses useSyncExternalStore for concurrent mode compatibility.
 * Includes shallow comparison cache to prevent unnecessary re-renders
 * when the selector returns structurally equal but referentially different values.
 *
 * @param expression A function that returns the observable value to track
 * @returns The current value of the observable
 */
export function useMobxSource<T>(expression: () => T): T {
  const cachedRef = useRef<{ value: T } | null>(null);

  const getSnapshot = () => {
    const next = expression();
    if (cachedRef.current !== null && shallowEqual(cachedRef.current.value, next)) {
      return cachedRef.current.value;
    }
    cachedRef.current = { value: next };
    return next;
  };

  return useSyncExternalStore(
    (callback) => {
      const disposer = reaction(expression, callback, { fireImmediately: false });
      return disposer;
    },
    getSnapshot,
    getSnapshot
  );
}
