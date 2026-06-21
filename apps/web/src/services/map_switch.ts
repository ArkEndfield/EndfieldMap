import type { MapData } from '@endfieldmap/map-core';

import { service } from '@/services';
import { mapChangeAnimationStore } from '@/services/map_change_animation_store';

/**
 * Switch the current map and play the full-screen transition animation.
 * Shared by the top-right map selector and the share-select bottom strip so
 * every user-driven switch behaves identically.
 */
export function switchMap(newMapId: MapData['id']): void {
  service.dataService.mapDataService.mapStateDataService.setCurrentMap(newMapId);
  mapChangeAnimationStore.show();
}
