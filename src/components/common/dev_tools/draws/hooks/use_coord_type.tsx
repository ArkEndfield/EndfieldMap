import { useState } from 'react';

export enum DevToolsCoordType {
  Game = 'game',
  OL = 'ol',
}

export const useCoordType = () => {
  const [coordType, setCoordType] = useState<DevToolsCoordType>(DevToolsCoordType.Game);

  const CoordTypeSelector = () => (
    <div className="space-y-1">
      <label className="block text-gray-400">点位类型</label>
      <select
        className="w-full bg-black/40 border border-white/20 rounded px-2 py-1 outline-none focus:border-white/50"
        value={coordType}
        onChange={(e) => setCoordType(e.target.value as DevToolsCoordType)}
      >
        <option value={DevToolsCoordType.Game}>游戏坐标 (XYZ)</option>
        <option value={DevToolsCoordType.OL}>OpenLayers坐标 (XY)</option>
      </select>
    </div>
  );

  return {
    coordType,
    setCoordType,
    CoordTypeSelector,
  };
};
