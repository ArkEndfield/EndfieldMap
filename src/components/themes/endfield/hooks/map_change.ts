import { MapIndex } from '@endfieldmap/tools';
import { useState } from 'react';

import { useAdapter } from '@/hooks/use_adapter';

export const useMapChange = () => {
  const [showChangeAnimation, setShowChangeAnimation] = useState(false);
  const { dataService } = useAdapter();
  const mapIndex = dataService.mapStateDataService.currentMap.value;

  const changeMap = (newMapIndex: MapIndex) => {
    dataService.mapStateDataService.currentMap.value = newMapIndex;
    setShowChangeAnimation(true);

    setTimeout(() => {
      setShowChangeAnimation(false);
    }, 1500);
  };

  return {
    mapIndex,
    showChangeAnimation,
    changeMap,
  };
};
