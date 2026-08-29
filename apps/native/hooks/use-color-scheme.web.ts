import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

const subscribeNoop = () => () => {};

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web.
 * The hydration gate uses useSyncExternalStore's server/client snapshots instead of an
 * effect-set flag, so no state is set during the effect phase.
 */
export function useColorScheme() {
  const colorScheme = useRNColorScheme();
  const hasHydrated = useSyncExternalStore(subscribeNoop, () => true, () => false);
  return hasHydrated ? colorScheme : 'light';
}
