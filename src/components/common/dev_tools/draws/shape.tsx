import { MapOL } from '@endfieldmap/map-core';
import { xyz2crd } from '@endfieldmap/tools';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import { DevToolsCoordType, useCoordType } from '@/components/common/dev_tools/draws/hooks/use_coord_type';
import { getDevLayer } from '@/components/common/dev_tools/draws/utils';
import { useAdapter } from '@/hooks/use_adapter';

export const ShapeDraw = observer(() => {
  const { adapter, dataService } = useAdapter();
  const map = adapter.mapController.mapRenderer.map;
  const currentMap = dataService.mapStateDataService.currentMap.value;

  const { coordType, CoordTypeSelector } = useCoordType();
  const [coordInput, setCoordInput] = useState('');
  const [params, setParams] = useState({
    strokeColor: '#3388ff',
    strokeWidth: 2,
  });

  const handleDraw = () => {
    if (!map || !coordInput.trim()) return;

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
          const res = xyz2crd({ x, y, z }, currentMap);
          coords.push([res[0], res[1]]);
        } else {
          coords.push([parts[0], parts[1]]);
        }
      }
    });

    if (coords.length < 2) return;

    const geometry = new MapOL.geom.LineString(coords);

    const feature = new MapOL.Feature({
      geometry,
    });

    const style = new MapOL.style.Style({
      stroke: new MapOL.style.Stroke({
        color: params.strokeColor,
        width: params.strokeWidth,
      }),
    });

    feature.setStyle(style);

    const layer = getDevLayer(map);
    layer.getSource()?.addFeature(feature);

    setCoordInput('');
  };

  return (
    <div className="text-xs text-white space-y-3 w-64">
      <CoordTypeSelector />

      <div className="space-y-1">
        <label className="block text-gray-400">
          点位集合
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
        <div className="flex gap-2">
          <div className="flex-1 space-y-1">
            <label className="text-gray-400">颜色</label>
            <input
              type="color"
              className="w-full h-6 bg-transparent"
              value={params.strokeColor}
              onChange={(e) => setParams({ ...params, strokeColor: e.target.value })}
            />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-gray-400">尺寸</label>
            <input
              type="number"
              className="w-full bg-black/40 border border-white/20 rounded px-2 py-1 outline-none"
              value={params.strokeWidth}
              onChange={(e) => setParams({ ...params, strokeWidth: Number(e.target.value) })}
            />
          </div>
        </div>
      </div>

      <button
        className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded py-1.5 transition-colors font-medium disabled:opacity-50"
        onClick={handleDraw}
        disabled={!coordInput.trim()}
      >
        绘制线条
      </button>
    </div>
  );
});
