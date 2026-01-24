import type { MapData } from '@endfieldmap/map-core';
import { useState } from 'react';

import { useAdapter } from '@/hooks/use_adapter';

export const useMapChange = () => {
  const [showChangeAnimation, setShowChangeAnimation] = useState(false);
  const { dataService } = useAdapter();
  const mapId = dataService.mapStateDataService.currentMap.value;

  const changeMap = (newMapId: MapData['id']) => {
    dataService.mapStateDataService.currentMap.value = newMapId;
    setShowChangeAnimation(true);

    setTimeout(() => {
      setShowChangeAnimation(false);
    }, 1500);
  };

  return {
    mapId,
    showChangeAnimation,
    changeMap,
  };
};
