import type { MapData } from '@endfieldmap/map-core';

import { useAdapter } from '@/hooks/use_adapter';
import { switchMap } from '@/services/map_switch';

export const useMapChange = () => {
  const { adapter } = useAdapter();
  const mapId = adapter.mapController.dataManager.currentMapId;
  const mapName = adapter.mapController.dataManager.currentMap?.name || 'Unknown';

  const changeMap = (newMapId: MapData['id']) => {
    switchMap(newMapId);
  };

  return {
    mapId,
    mapName,
    changeMap,
  };
};
