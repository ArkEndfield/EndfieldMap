import type { MapData } from '@endfieldmap/map-core';
import { useState } from 'react';

import { useAdapter } from '@/hooks/use_adapter';

export const useMapChange = () => {
  const [showChangeAnimation, setShowChangeAnimation] = useState(false);
  const { adapter, mapDataService } = useAdapter();
  const mapId = adapter.mapController.dataManager.currentMapId;
  const mapName = adapter.mapController.dataManager.currentMap?.name || 'Unknown';

  const changeMap = (newMapId: MapData['id']) => {
    mapDataService.mapStateDataService.setCurrentMap(newMapId);
    setShowChangeAnimation(true);

    setTimeout(() => {
      setShowChangeAnimation(false);
    }, 1500);
  };

  return {
    mapId,
    mapName,
    showChangeAnimation,
    changeMap,
  };
};
