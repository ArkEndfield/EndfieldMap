import { crd2xyz, domEventListener, xyz2crd } from '@endfieldmap/tools';
import { MAP_EVENT } from '@endfieldmap/map-core/const/event';
import { observer } from 'mobx-react-lite';
import { useEffect, useRef, useState } from 'react';

import { DevToolsDrawPanel } from '@/components/common/dev_tools/draw_panel';
import { CogIcon, EditIcon, MinusIcon } from '@/components/common/icons';
import { useAdapter } from '@/hooks/use_adapter';
import { cn } from '@/utils/style';

// 开发工具面板
const DevToolsPanel = observer(() => {
  const { dataService } = useAdapter();
  const devToolsState = dataService.mapStateDataService.devToolsState;

  const [position, setPosition] = useState(devToolsState?.value?.position || { right: 20, top: 20 });
  const [isDragging, setIsDragging] = useState(false);

  const [windowSize, setWindowSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  const dragStartOffset = useRef({ right: 0, top: 0 });
  const ref = useRef<HTMLDivElement>(null);

  // 同步数据
  useEffect(() => {
    const handleResize = () => setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    const dispose = domEventListener(window, 'resize', handleResize);
    return () => dispose?.();
  }, []);

  useEffect(() => {
    if (!devToolsState?.value?.position || isDragging) return;

    const storedPos = devToolsState.value.position;

    const updatePosition = () => {
      if (ref.current) {
        const width = ref.current.offsetWidth;
        const height = ref.current.offsetHeight;

        const currentWinW = window.innerWidth;
        const currentWinH = window.innerHeight;

        const maxTop = currentWinH - height;
        const maxRight = currentWinW - width;

        const newTop = Math.max(0, Math.min(storedPos.top, maxTop));
        const newRight = Math.max(0, Math.min(storedPos.right, maxRight));

        setPosition({ right: newRight, top: newTop });
      } else {
        setPosition(storedPos);
      }
    };

    const timer = setTimeout(updatePosition, 0);
    return () => clearTimeout(timer);
  }, [devToolsState?.value?.position, devToolsState?.value?.panelCollapsed, windowSize, isDragging]);

  const dragStartMousePos = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    hasMoved.current = false;
    dragStartMousePos.current = { x: e.clientX, y: e.clientY };

    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      const currentRightVal = window.innerWidth - rect.right;
      const mouseDistFromWindowRight = window.innerWidth - e.clientX;
      dragStartOffset.current = {
        right: mouseDistFromWindowRight - currentRightVal,
        top: e.clientY - rect.top,
      };
    }
  };

  useEffect(() => {
    if (isDragging) {
      const d1 = domEventListener(window, 'mousemove', (e) => {
        if (!isDragging) return;

        if (!hasMoved.current) {
          const moveDist = Math.hypot(e.clientX - dragStartMousePos.current.x, e.clientY - dragStartMousePos.current.y);
          if (moveDist > 3) {
            hasMoved.current = true;
          } else {
            return;
          }
        }

        const mouseDistFromWindowRight = window.innerWidth - e.clientX;
        let newRight = mouseDistFromWindowRight - dragStartOffset.current.right;
        let newTop = e.clientY - dragStartOffset.current.top;

        // 边界检测
        if (ref.current) {
          const width = ref.current.offsetWidth;
          const height = ref.current.offsetHeight;
          const maxRight = window.innerWidth - width;
          const maxTop = window.innerHeight - height;

          newRight = Math.max(0, Math.min(newRight, maxRight));
          newTop = Math.max(0, Math.min(newTop, maxTop));
        }

        setPosition({ right: newRight, top: newTop });
      });
      const d2 = domEventListener(window, 'mouseup', () => {
        if (isDragging) {
          setIsDragging(false);
          if (devToolsState && hasMoved.current) {
            devToolsState.value = {
              ...devToolsState.value,
              position: position,
            };
          }
        }
      });
      const dispose = () => {
        d1?.();
        d2?.();
      };

      return () => {
        dispose?.();
      };
    }
  }, [isDragging, position, devToolsState]);

  const toggleCollapse = () => {
    if (!devToolsState) return;
    devToolsState.value = {
      ...devToolsState.value,
      panelCollapsed: !(devToolsState.value.panelCollapsed ?? false),
    };
  };

  if (!devToolsState) return null;

  const collapsed = devToolsState.value.panelCollapsed ?? false;

  return (
    <div
      ref={ref}
      className={cn(
        'fixed z-50 bg-black/80 text-white rounded-lg shadow-lg border border-white/20 overflow-hidden backdrop-blur-md',
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      )}
      style={{
        right: position.right,
        top: position.top,
        width: collapsed ? '40px' : 'auto',
        height: collapsed ? '40px' : 'auto',
      }}
      onMouseDown={handleMouseDown}
    >
      <div className={cn('flex items-center justify-between p-2 select-none h-10', collapsed ? 'p-0 h-10' : '')}>
        {!collapsed && <span className="text-xs font-bold ml-1">DevTools</span>}
        <div
          className={cn(
            'cursor-pointer hover:bg-white/20 rounded-sm p-1 flex items-center justify-center transition-colors',
            collapsed ? 'w-full h-full' : ''
          )}
          onClick={(e) => {
            e.stopPropagation();
            if (!hasMoved.current) {
              toggleCollapse();
            }
          }}
        >
          {collapsed ? <CogIcon className="text-lg" /> : <MinusIcon className="text-sm" />}
        </div>
      </div>

      {!collapsed && (
        <div
          className="p-4 border-t text-xs text-gray-300 border-white/10 space-y-2"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="border border-white/10 rounded-md p-2 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span>显示鼠标坐标</span>
              <input
                type="checkbox"
                className="cursor-pointer"
                checked={devToolsState.value.showCursorPosition || false}
                onChange={(e) => {
                  devToolsState.value = { ...devToolsState.value, showCursorPosition: e.target.checked };
                }}
              />
            </div>
            {devToolsState.value.showCursorPosition && <CursorPositionDisplay />}
            <TierControls />
            <button
              className={cn(
                'w-full flex items-center justify-center gap-2 px-2 py-1.5 rounded text-xs border border-white/10 transition-colors',
                devToolsState.value.drawPanelOpen
                  ? 'bg-white/15 text-white hover:bg-white/20'
                  : 'bg-white/5 hover:bg-white/10'
              )}
              type="button"
              onClick={() => {
                devToolsState.value = {
                  ...devToolsState.value,
                  drawPanelOpen: !(devToolsState.value.drawPanelOpen ?? false),
                };
              }}
            >
              <EditIcon className="text-sm" />
              {devToolsState.value.drawPanelOpen ? '隐藏绘制面板' : '显示绘制面板'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

interface TierGridData {
  lb: [number, number];
  rt: [number, number];
  items: Record<string, string>;
}

type TierGridsData = Record<string, TierGridData>;

const TierControls = observer(() => {
  const { adapter } = useAdapter();
  const [tierEnabled, setTierEnabled] = useState(false);
  const [tierBoundaryEnabled, setTierBoundaryEnabled] = useState(false);
  const [tierGridsData, setTierGridsData] = useState<TierGridsData | null>(null);
  const [availableTiers, setAvailableTiers] = useState<Array<{ name: string; imagePath: string; level: number }>>([]);
  const [selectedTierIndex, setSelectedTierIndex] = useState(0);
  const [currentRegion, setCurrentRegion] = useState<{ x: number; y: number } | null>(null);
  const [boundaryFeatureIds, setBoundaryFeatureIds] = useState<number[]>([]);

  useEffect(() => {
    const loadTierData = async () => {
      try {
        const response = await fetch('/tier/grid_tiers.json');
        const data: TierGridsData = await response.json();
        setTierGridsData(data);
      } catch (error) {
        console.error('Failed to load tier grids data:', error);
      }
    };
    loadTierData();
  }, []);

  useEffect(() => {
    if (!tierGridsData) return;

    const updateAvailableTiers = (center: [number, number] | undefined) => {
      if (!center) return;

      const [crdX, crdY] = center;
      const xyzPos = crd2xyz([crdX, crdY], adapter.currentMapIndex);
      const gameX = xyzPos.x;
      const gameY = xyzPos.z;

      for (const [, gridData] of Object.entries(tierGridsData)) {
        const [lbX, lbY] = gridData.lb;
        const [rtX, rtY] = gridData.rt;

        if (gameX >= lbX && gameX <= rtX && gameY >= lbY && gameY <= rtY) {
          const tiers = Object.entries(gridData.items).map(([name, imagePath], index) => ({
            name,
            imagePath: `/tier/${imagePath}.png`,
            level: index,
          }));

          setAvailableTiers(tiers);
          setCurrentRegion({ x: lbX, y: lbY });
          return;
        }
      }

      setAvailableTiers([]);
      setCurrentRegion(null);
    };

    const initialCenter = adapter.mapController.mapRenderer.map.getView().getCenter();
    updateAvailableTiers(initialCenter as [number, number] | undefined);

    const dispose = adapter.event.on(MAP_EVENT.MAP_CENTER_CHANGE, (center) => {
      updateAvailableTiers(center as [number, number] | undefined);
    });

    return () => {
      dispose();
    };
  }, [tierGridsData, adapter]);

  const handleToggleTier = async () => {
    console.log('tier info:', currentRegion?.x, currentRegion?.y);
    if (!currentRegion || availableTiers.length === 0) return;

    if (!tierEnabled) {
      availableTiers.forEach((tier) => {
        adapter.tierController.addTier(
          adapter.currentMapIndex,
          tier.level,
          currentRegion.x,
          currentRegion.y,
          tier.imagePath
        );
      });

      if (availableTiers.length > 0) {
        await adapter.renderTier(adapter.currentMapIndex, currentRegion.x, currentRegion.y, selectedTierIndex);
      }
      setTierEnabled(true);
    } else {
      adapter.clearTier(adapter.currentMapIndex, currentRegion.x, currentRegion.y);
      setTierEnabled(false);
    }
  };

  const handleTierChange = async (index: number) => {
    setSelectedTierIndex(index);
    if (tierEnabled && currentRegion) {
      await adapter.renderTier(adapter.currentMapIndex, currentRegion.x, currentRegion.y, index);
    }
  };

  const handleToggleTierBoundary = () => {
    if (!tierGridsData) return;

    const devToolsController = adapter.devToolsController;
    if (!devToolsController) return;

    if (!tierBoundaryEnabled) {
      const featureIds: number[] = [];
      const currentMap = adapter.currentMapIndex;

      for (const [key, gridData] of Object.entries(tierGridsData)) {
        if (!key.startsWith(currentMap)) continue;

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

  const hasAvailableTiers = availableTiers.length > 0;

  return (
    <div className="space-y-2 border-t border-white/10 pt-2">
      <div className="flex items-center justify-between gap-3">
        <span>显示分层</span>
        <input
          type="checkbox"
          className="cursor-pointer"
          checked={tierEnabled}
          onChange={handleToggleTier}
          disabled={!hasAvailableTiers}
        />
      </div>
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
      {!hasAvailableTiers && (
        <div className="space-y-1">
          <div className="text-[10px] text-gray-500">当前位置无分层数据</div>
        </div>
      )}
      {hasAvailableTiers && tierEnabled && (
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
      )}
    </div>
  );
});

const CursorPositionDisplay = observer(() => {
  const { adapter } = useAdapter();
  const [coords, setCoords] = useState<string>('');

  useEffect(() => {
    const map = adapter.mapController.mapRenderer.map;
    const listener = (e: { coordinate: number[] }) => {
      const [x, y] = e.coordinate;
      setCoords(`${x.toFixed(2)}, ${y.toFixed(2)}`);
    };
    map.on('pointermove', listener);
    return () => {
      map.un('pointermove', listener);
    };
  }, [adapter]);

  if (!coords) return null;

  const xyzPosition = crd2xyz([Number(coords.split(',')[0]), Number(coords.split(',')[1])], adapter.currentMapIndex);

  return (
    <div className="mb-2 font-mono text-[10px] text-green-400 select-all">
      <div>[{coords}]</div>{' '}
      <div>
        {'{'}x: {xyzPosition.x.toFixed(2)}, y: {xyzPosition.y.toFixed(2)}, z: {xyzPosition.z.toFixed(2)}
        {'}'}
      </div>
    </div>
  );
});

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

const DevTools = observer(() => {
  return (
    <>
      <DevToolsPanel />
      <DevToolsDrawPanel />
    </>
  );
});

export default DevTools;
