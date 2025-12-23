import { xyz2crd } from '@endfieldmap/tools';
import { observer } from 'mobx-react-lite';
import { useMemo, useState } from 'react';

import { ColorPicker } from '@/components/common/dev_tools/draws/components/color_picker';
import { DevToolsCoordType, useCoordType } from '@/components/common/dev_tools/draws/hooks/use_coord_type';
import { useAdapter } from '@/hooks/use_adapter';

type RuleShapeType = 'box' | 'sphere';

export const RuleShapesDraw = observer(() => {
  const { adapter, dataService } = useAdapter();
  const devToolsController = adapter.devToolsController;
  const currentMap = dataService.mapStateDataService.currentMap.value;

  const { coordType, CoordTypeSelector } = useCoordType();
  const [shapeType, setShapeType] = useState<RuleShapeType>('box');

  const [center, setCenter] = useState({ x: 0, y: 0, z: 0 });
  const [boxSize, setBoxSize] = useState({ width: 100, height: 100 });
  const [sphereRadius, setSphereRadius] = useState(100);

  const [params, setParams] = useState({
    strokeColor: '#3388ff',
    strokeWidth: 2,
    fillColor: 'rgba(51, 136, 255, 0.2)',
  });

  const centerLabel = useMemo(() => {
    return coordType === DevToolsCoordType.Game ? '中心点 (x, y, z)' : '中心点 (x, y)';
  }, [coordType]);

  const handleDraw = () => {
    if (!devToolsController) return;

    if (shapeType === 'box') {
      if (coordType === DevToolsCoordType.Game) {
        const halfW = boxSize.width / 2;
        const halfH = boxSize.height / 2;
        const topLeft = xyz2crd({ x: center.x - halfW, y: center.y, z: center.z - halfH }, currentMap);
        const bottomRight = xyz2crd({ x: center.x + halfW, y: center.y, z: center.z + halfH }, currentMap);
        devToolsController.drawRectangle([topLeft[0], topLeft[1]], [bottomRight[0], bottomRight[1]], {
          strokeColor: params.strokeColor,
          strokeWidth: params.strokeWidth,
          fillColor: params.fillColor,
        });
      } else {
        const halfW = boxSize.width / 2;
        const halfH = boxSize.height / 2;
        const topLeft: [number, number] = [center.x - halfW, center.y - halfH];
        const bottomRight: [number, number] = [center.x + halfW, center.y + halfH];
        devToolsController.drawRectangle(topLeft, bottomRight, {
          strokeColor: params.strokeColor,
          strokeWidth: params.strokeWidth,
          fillColor: params.fillColor,
        });
      }
      return;
    }

    if (shapeType === 'sphere') {
      if (coordType === DevToolsCoordType.Game) {
        const centerCrd = xyz2crd({ x: center.x, y: center.y, z: center.z }, currentMap);
        const edgeCrd = xyz2crd({ x: center.x + sphereRadius, y: center.y, z: center.z }, currentMap);
        const radius = Math.hypot(edgeCrd[0] - centerCrd[0], edgeCrd[1] - centerCrd[1]);
        devToolsController.drawCircle([centerCrd[0], centerCrd[1]], radius, {
          strokeColor: params.strokeColor,
          strokeWidth: params.strokeWidth,
          fillColor: params.fillColor,
        });
      } else {
        devToolsController.drawCircle([center.x, center.y], sphereRadius, {
          strokeColor: params.strokeColor,
          strokeWidth: params.strokeWidth,
          fillColor: params.fillColor,
        });
      }
    }
  };

  if (!devToolsController) {
    return null;
  }

  return (
    <div className="text-xs text-white space-y-3 w-64">
      <CoordTypeSelector />

      <div className="space-y-1">
        <label className="block text-gray-400">形状类型</label>
        <select
          className="w-full bg-black/40 border border-white/20 rounded px-2 py-1 outline-none"
          value={shapeType}
          onChange={(e) => setShapeType(e.target.value as RuleShapeType)}
        >
          <option value="box">Box（矩形）</option>
          <option value="sphere">Sphere（圆）</option>
        </select>
      </div>

      <div className="space-y-2">
        <div className="space-y-1">
          <label className="text-gray-400">{centerLabel}</label>
          <div className="flex gap-2">
            <input
              type="number"
              className="w-full bg-black/40 border border-white/20 rounded px-2 py-1 outline-none"
              value={center.x}
              onChange={(e) => setCenter({ ...center, x: Number(e.target.value) })}
              placeholder="x"
            />
            <input
              type="number"
              className="w-full bg-black/40 border border-white/20 rounded px-2 py-1 outline-none"
              value={center.y}
              onChange={(e) => setCenter({ ...center, y: Number(e.target.value) })}
              placeholder="y"
            />
            {coordType === DevToolsCoordType.Game && (
              <input
                type="number"
                className="w-full bg-black/40 border border-white/20 rounded px-2 py-1 outline-none"
                value={center.z}
                onChange={(e) => setCenter({ ...center, z: Number(e.target.value) })}
                placeholder="z"
              />
            )}
          </div>
        </div>

        {shapeType === 'box' && (
          <div className="space-y-1">
            <label className="text-gray-400">尺寸</label>
            <div className="flex gap-2">
              <input
                type="number"
                className="w-full bg-black/40 border border-white/20 rounded px-2 py-1 outline-none"
                value={boxSize.width}
                onChange={(e) => setBoxSize({ ...boxSize, width: Number(e.target.value) })}
                placeholder="width"
              />
              <input
                type="number"
                className="w-full bg-black/40 border border-white/20 rounded px-2 py-1 outline-none"
                value={boxSize.height}
                onChange={(e) => setBoxSize({ ...boxSize, height: Number(e.target.value) })}
                placeholder="height"
              />
            </div>
            {coordType === DevToolsCoordType.Game && (
              <div className="text-[10px] text-gray-500">Box 尺寸会按游戏坐标 (x/z) 推导四角后再转换为地图坐标。</div>
            )}
          </div>
        )}

        {shapeType === 'sphere' && (
          <div className="space-y-1">
            <label className="text-gray-400">半径</label>
            <input
              type="number"
              className="w-full bg-black/40 border border-white/20 rounded px-2 py-1 outline-none"
              value={sphereRadius}
              onChange={(e) => setSphereRadius(Number(e.target.value))}
            />
            {coordType === DevToolsCoordType.Game && (
              <div className="text-[10px] text-gray-500">Sphere 半径会通过转换中心点与偏移点后的距离计算。</div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2 border-t border-white/10 pt-2">
        <ColorPicker
          label="描边颜色"
          value={params.strokeColor}
          onChange={(color) => setParams({ ...params, strokeColor: color })}
        />
        <div className="space-y-1">
          <label className="text-gray-400">描边宽度</label>
          <input
            type="number"
            className="w-full bg-black/40 border border-white/20 rounded px-2 py-1 outline-none"
            value={params.strokeWidth}
            onChange={(e) => setParams({ ...params, strokeWidth: Number(e.target.value) })}
          />
        </div>
        <ColorPicker label="填充颜色" value={params.fillColor} onChange={(color) => setParams({ ...params, fillColor: color })} />
      </div>

      <button
        className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded py-1.5 transition-colors font-medium"
        onClick={handleDraw}
        type="button"
      >
        {shapeType === 'box' ? '绘制 Box' : '绘制 Sphere'}
      </button>
    </div>
  );
});

