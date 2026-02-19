import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import { ColorPicker } from '@/components/features/dev_tools/draws/components/color_picker';
import { DevToolsCoordType, useCoordType } from '@/components/features/dev_tools/draws/hooks/use_coord_type';
import { useAdapter } from '@/hooks/use_adapter';
import { service } from '@/services';

export const PointDraw = observer(() => {
  const { adapter } = useAdapter();
  const devToolsController = adapter.devToolsController;
  const currentMap = service.dataService.mapDataService.mapStateDataService.currentMap.value;

  const { coordType, CoordTypeSelector } = useCoordType();
  const [coords, setCoords] = useState({ x: 0, y: 0, z: 0 });
  const [config, setConfig] = useState({ size: 5, color: '#ff0000' });

  const handleDraw = () => {
    if (!devToolsController) return;

    let finalCoords: [number, number];
    if (coordType === DevToolsCoordType.Game) {
      const res = adapter.mapController.dataManager.xyz2crd(coords, currentMap);
      finalCoords = [res[0], res[1]];
    } else {
      finalCoords = [coords.x, coords.y];
    }

    devToolsController.drawPoint(finalCoords, {
      radius: config.size,
      fillColor: config.color,
    });

    setCoords({ x: 0, y: 0, z: 0 });
  };

  if (!devToolsController) {
    return null;
  }

  return (
    <div className="text-xs text-white space-y-3 w-64">
      <CoordTypeSelector />

      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-gray-400 mb-1">X</label>
            <input
              type="number"
              className="w-full bg-black/40 border border-white/20 rounded px-2 py-1 outline-none"
              value={coords.x}
              onChange={(e) => setCoords({ ...coords, x: Number(e.target.value) })}
            />
          </div>
          <div className="flex-1">
            <label className="block text-gray-400 mb-1">Y</label>
            <input
              type="number"
              className="w-full bg-black/40 border border-white/20 rounded px-2 py-1 outline-none"
              value={coords.y}
              onChange={(e) => setCoords({ ...coords, y: Number(e.target.value) })}
            />
          </div>
          {coordType === DevToolsCoordType.Game && (
            <div className="flex-1">
              <label className="block text-gray-400 mb-1">Z</label>
              <input
                type="number"
                className="w-full bg-black/40 border border-white/20 rounded px-2 py-1 outline-none"
                value={coords.z}
                onChange={(e) => setCoords({ ...coords, z: Number(e.target.value) })}
              />
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div>
          <label className="block text-gray-400 mb-1">尺寸</label>
          <input
            type="number"
            className="w-full bg-black/40 border border-white/20 rounded px-2 py-1 outline-none"
            value={config.size}
            onChange={(e) => setConfig({ ...config, size: Number(e.target.value) })}
          />
        </div>
        <ColorPicker label="颜色" value={config.color} onChange={(color) => setConfig({ ...config, color })} />
      </div>

      <button
        className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded py-1.5 transition-colors font-medium"
        onClick={handleDraw}
      >
        绘制点
      </button>
    </div>
  );
});
