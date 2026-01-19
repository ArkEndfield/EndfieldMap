import { useAdapter } from '@/hooks/use_adapter';
import { MAP_EVENT } from '@endfieldmap/map-core';
import { crd2xyz, xyz2crd } from '@endfieldmap/tools';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';

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
  const { adapter, dataService } = useAdapter();
  const [tierBoundaryEnabled, setTierBoundaryEnabled] = useState(false);
  const [boundaryFeatureIds, setBoundaryFeatureIds] = useState<number[]>([]);

  const tierGridsData = dataService.gridTiersDataService.gridTiersData;

  //   const handleToggleTier = async () => {
  //     console.log('tier info:', currentRegion?.x, currentRegion?.y);
  //     if (!currentRegion || availableTiers.length === 0) return;

  //     if (!tierEnabled) {
  //       availableTiers.forEach((tier) => {
  //         adapter.tierController.addTier(
  //           adapter.currentMapIndex,
  //           tier.level,
  //           currentRegion.x,
  //           currentRegion.y,
  //           tier.imagePath
  //         );
  //       });

  //       if (availableTiers.length > 0) {
  //         await adapter.renderTier(adapter.currentMapIndex, currentRegion.x, currentRegion.y, selectedTierIndex);
  //       }
  //       setTierEnabled(true);
  //     } else {
  //       adapter.clearTier(adapter.currentMapIndex, currentRegion.x, currentRegion.y);
  //       setTierEnabled(false);
  //     }
  //   };

  //   const handleTierChange = async (index: number) => {
  //     setSelectedTierIndex(index);
  //     if (tierEnabled && currentRegion) {
  //       await adapter.renderTier(adapter.currentMapIndex, currentRegion.x, currentRegion.y, index);
  //     }
  //   };

  const handleToggleTierBoundary = () => {
    if (!tierGridsData) return;

    const devToolsController = adapter.devToolsController;
    if (!devToolsController) return;

    if (!tierBoundaryEnabled) {
      const featureIds: number[] = [];
      const currentMap = adapter.currentMapIndex;

      for (const gridData of tierGridsData) {
        if (!gridData.id.startsWith(currentMap)) continue;

        const [lbX, lbY] = gridData.lb;
        const [rtX, rtY] = gridData.rt;

        const lbCrd = xyz2crd({ x: lbX, y: 0, z: lbY }, currentMap);
        const rtCrd = xyz2crd({ x: rtX, y: 0, z: rtY }, currentMap);

        const featureId = devToolsController.drawRectangle([lbCrd[0], lbCrd[1]], [rtCrd[0], rtCrd[1]], {
          strokeColor: '#ffaa00',
          strokeWidth: 2,
          fillColor: 'rgba(255, 170, 0, 0.1)',
        });

        featureIds.push(featureId);
      }

      setBoundaryFeatureIds(featureIds);
      setTierBoundaryEnabled(true);
    } else {
      boundaryFeatureIds.forEach((id) => {
        devToolsController.removeFeature(id);
      });
      setBoundaryFeatureIds([]);
      setTierBoundaryEnabled(false);
    }
  };

  return (
    <div className="space-y-2 border-t border-white/10 pt-2">
      {/* <div className="flex items-center justify-between gap-3">
        <span>显示分层</span>
        <input
          type="checkbox"
          className="cursor-pointer"
          checked={tierEnabled}
          onChange={handleToggleTier}
          disabled={!hasAvailableTiers}
        />
      </div> */}
      <div className="flex items-center justify-between gap-3">
        <span>显示分层边界</span>
        <input
          type="checkbox"
          className="cursor-pointer"
          checked={tierBoundaryEnabled}
          onChange={handleToggleTierBoundary}
          disabled={!tierGridsData}
        />
      </div>
      <CenterPositionDisplay />
      {/* <div className="space-y-1">
        <div className="text-[10px] text-gray-500">{JSON.stringify(availableTierData)}</div>
      </div> */}
      {/* {hasAvailableTiers && tierEnabled && (
        <div className="space-y-1">
          <div className="text-[10px] text-gray-400">
            层级: {availableTiers[selectedTierIndex]?.name.slice(0, 8)}...
          </div>
          <div className="flex flex-wrap gap-1">
            {availableTiers.map((tier, index) => (
              <button
                key={tier.name}
                className={cn(
                  'flex-1 min-w-[60px] px-2 py-1 rounded text-[10px] border border-white/10 transition-colors',
                  selectedTierIndex === index ? 'bg-white/20' : 'bg-white/5 hover:bg-white/10'
                )}
                onClick={() => handleTierChange(index)}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      )} */}
    </div>
  );
});
