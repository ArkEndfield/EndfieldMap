import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import { ColorPicker } from '@/components/features/dev_tools/draws/components/color_picker';
import { DevToolsCoordType, useCoordType } from '@/components/features/dev_tools/draws/hooks/use_coord_type';
import { useAdapter } from '@/hooks/use_adapter';

export const ShapeDraw = observer(() => {
  const { adapter, mapDataService } = useAdapter();
  const devToolsController = adapter.devToolsController;
  const currentMap = mapDataService.mapStateDataService.currentMap.value;

  const { coordType, CoordTypeSelector } = useCoordType();
  const [coordInput, setCoordInput] = useState('');
  const [params, setParams] = useState({
    strokeColor: '#3388ff',
    strokeWidth: 2,
  });

  const handleDraw = () => {
    if (!devToolsController || !coordInput.trim()) return;

    const lines = coordInput.trim().split('\n');
    const coords: [number, number][] = [];

    lines.forEach((line) => {
      const parts = line
        .replace(/[()]/g, '')
        .split(/[,\s]+/)
        .filter((s) => s.trim() !== '')
        .map(Number);

      if (parts.length >= 2) {
        if (coordType === DevToolsCoordType.Game) {
          const x = parts[0];
          const y = parts[1];
          const z = parts[2] || 0;
          const res = adapter.mapController.dataManager.xyz2crd({ x, y, z }, currentMap);
          coords.push([res[0], res[1]]);
        } else {
          coords.push([parts[0], parts[1]]);
        }
      }
    });

    if (coords.length < 2) return;

    devToolsController.drawLine(coords, {
      strokeColor: params.strokeColor,
      strokeWidth: params.strokeWidth,
    });

    setCoordInput('');
  };

  if (!devToolsController) {
    return null;
  }

  return (
    <div className="text-xs text-white space-y-3 w-64">
      <CoordTypeSelector />

      <div className="space-y-1">
        <label className="block text-gray-400">
          点位集合（PolyLine）
          <span className="block text-[10px] text-gray-500">
            {coordType === DevToolsCoordType.Game ? '格式: x, y, z' : '格式: x, y'}
          </span>
        </label>
        <textarea
          className="w-full h-24 bg-black/40 border border-white/20 rounded px-2 py-1 outline-none resize-none font-mono"
          value={coordInput}
          onChange={(e) => setCoordInput(e.target.value)}
          placeholder={
            coordType === DevToolsCoordType.Game ? '100, 0, 100\n120, 0, 100\n...' : '100, 200\n150, 250\n...'
          }
        />
      </div>

      <div className="space-y-2 border-t border-white/10 pt-2">
        <ColorPicker
          label="颜色"
          value={params.strokeColor}
          onChange={(color) => setParams({ ...params, strokeColor: color })}
        />
        <div className="space-y-1">
          <label className="text-gray-400">线宽</label>
          <input
            type="number"
            className="w-full bg-black/40 border border-white/20 rounded px-2 py-1 outline-none"
            value={params.strokeWidth}
            onChange={(e) => setParams({ ...params, strokeWidth: Number(e.target.value) })}
          />
        </div>
      </div>

      <button
        className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded py-1.5 transition-colors font-medium disabled:opacity-50"
        onClick={handleDraw}
        disabled={!coordInput.trim()}
      >
        绘制 PolyLine
      </button>
    </div>
  );
});
