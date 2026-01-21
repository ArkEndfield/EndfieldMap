import { MAP_EVENT } from '@endfieldmap/map-core';
import { crd2xyz } from '@endfieldmap/tools';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';

import { useAdapter } from '@/hooks/use_adapter';

const CenterPositionDisplay = observer(() => {
  const { adapter } = useAdapter();
  const [coords, setCoords] = useState<string>('');

  useEffect(() => {
    const updateCenter = (center: [number, number] | undefined) => {
      if (!center) return;
      const [x, y] = center;
      setCoords(`${x.toFixed(2)}, ${y.toFixed(2)}`);
    };

    const initialCenter = adapter.mapController.mapRenderer.map.getView().getCenter();
    updateCenter(initialCenter as [number, number] | undefined);

    const dispose = adapter.event.on(MAP_EVENT.MAP_CENTER_CHANGE, (center) => {
      updateCenter(center as [number, number] | undefined);
    });

    return () => {
      dispose();
    };
  }, [adapter]);

  if (!coords) return null;

  const xyzPosition = crd2xyz([Number(coords.split(',')[0]), Number(coords.split(',')[1])], adapter.currentMapIndex);

  return (
    <div className="font-mono text-[10px] text-blue-400 select-all">
      <div>中心: [{coords}]</div>
      <div>
        {'{'}x: {xyzPosition.x.toFixed(2)}, y: {xyzPosition.y.toFixed(2)}, z: {xyzPosition.z.toFixed(2)}
        {'}'}
      </div>
    </div>
  );
});

export const TierControls = observer(() => {
  return (
    <div className="space-y-2 border-t border-white/10 pt-2">
      <CenterPositionDisplay />
    </div>
  );
});
