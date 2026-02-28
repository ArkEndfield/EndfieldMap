import type { MapCoordinate } from '@endfieldmap/map-core';
import { domEventListener } from '@endfieldmap/tools';
import { cn } from '@endfieldmap/tools';
import { useWindow } from '@endfieldmap/web-components';
import { observer } from 'mobx-react-lite';
import { useEffect, useRef, useState } from 'react';

import { alert } from '@/components/common/alert/alert_api';
import { CogIcon, EditIcon, MinusIcon } from '@/components/common/icons';
import { DevToolsDrawPanel } from '@/components/features/dev_tools/draw_panel';
import { TierControls } from '@/components/features/dev_tools/views/tier_controller';
import { useAdapter } from '@/hooks/use_adapter';
import { service } from '@/services';

// 开发工具面板
const DevToolsPanel = observer(() => {
  const devToolsState = service.dataService.mapDataService.mapStateDataService.devToolsState;
  const currentWindow = useWindow();

  const [position, setPosition] = useState(devToolsState?.value?.position || { right: 20, top: 20 });
  const [isDragging, setIsDragging] = useState(false);

  const [windowSize, setWindowSize] = useState({ w: currentWindow.innerWidth, h: currentWindow.innerHeight });

  const dragStartOffset = useRef({ right: 0, top: 0 });
  const ref = useRef<HTMLDivElement>(null);

  // 同步数据
  useEffect(() => {
    const handleResize = () => setWindowSize({ w: currentWindow.innerWidth, h: currentWindow.innerHeight });
    const dispose = domEventListener(currentWindow, 'resize', handleResize);
    return () => dispose?.();
  }, [currentWindow]);

  useEffect(() => {
    if (!devToolsState?.value?.position || isDragging) return;

    const storedPos = devToolsState.value.position;

    const updatePosition = () => {
      if (ref.current) {
        const width = ref.current.offsetWidth;
        const height = ref.current.offsetHeight;

        const currentWinW = currentWindow.innerWidth;
        const currentWinH = currentWindow.innerHeight;

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
  }, [devToolsState?.value?.position, devToolsState?.value?.panelCollapsed, windowSize, isDragging, currentWindow]);

  const dragStartMousePos = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  const startDrag = (clientX: number, clientY: number) => {
    setIsDragging(true);
    hasMoved.current = false;
    dragStartMousePos.current = { x: clientX, y: clientY };

    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      const currentRightVal = currentWindow.innerWidth - rect.right;
      const mouseDistFromWindowRight = currentWindow.innerWidth - clientX;
      dragStartOffset.current = {
        right: mouseDistFromWindowRight - currentRightVal,
        top: clientY - rect.top,
      };
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    startDrag(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      startDrag(touch.clientX, touch.clientY);
    }
  };

  useEffect(() => {
    if (isDragging) {
      const handleMove = (clientX: number, clientY: number) => {
        if (!hasMoved.current) {
          const moveDist = Math.hypot(clientX - dragStartMousePos.current.x, clientY - dragStartMousePos.current.y);
          if (moveDist > 3) {
            hasMoved.current = true;
          } else {
            return;
          }
        }

        const mouseDistFromWindowRight = currentWindow.innerWidth - clientX;
        let newRight = mouseDistFromWindowRight - dragStartOffset.current.right;
        let newTop = clientY - dragStartOffset.current.top;

        // 边界检测
        if (ref.current) {
          const width = ref.current.offsetWidth;
          const height = ref.current.offsetHeight;
          const maxRight = currentWindow.innerWidth - width;
          const maxTop = currentWindow.innerHeight - height;

          newRight = Math.max(0, Math.min(newRight, maxRight));
          newTop = Math.max(0, Math.min(newTop, maxTop));
        }

        setPosition({ right: newRight, top: newTop });
      };

      const handleEnd = () => {
        if (isDragging) {
          setIsDragging(false);
          if (devToolsState && hasMoved.current) {
            devToolsState.value = {
              ...devToolsState.value,
              position: position,
            };
          }
        }
      };

      const d1 = domEventListener(currentWindow, 'mousemove', (e) => {
        handleMove(e.clientX, e.clientY);
      });
      const d2 = domEventListener(currentWindow, 'mouseup', handleEnd);
      const d3 = domEventListener(
        currentWindow,
        'touchmove',
        (e: TouchEvent) => {
          if (e.touches.length === 1) {
            const touch = e.touches[0];
            handleMove(touch.clientX, touch.clientY);
          }
        },
        { passive: true }
      );
      const d4 = domEventListener(currentWindow, 'touchend', handleEnd);
      const d5 = domEventListener(currentWindow, 'touchcancel', handleEnd);

      return () => {
        d1?.();
        d2?.();
        d3?.();
        d4?.();
        d5?.();
      };
    }
  }, [isDragging, position, devToolsState, currentWindow]);

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
      onTouchStart={handleTouchStart}
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
            <CoordinateJump />
            <EntityLocate />
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

const CoordinateJump = observer(() => {
  const { adapter } = useAdapter();
  const [mode, setMode] = useState<'xyz' | 'crd'>('xyz');
  const [x, setX] = useState('');
  const [y, setY] = useState('');
  const [z, setZ] = useState('');

  const handleJump = () => {
    if (mode === 'xyz') {
      const coord = adapter.mapController.dataManager.xyz2crd(
        { x: Number(x), y: Number(y), z: Number(z) },
        adapter.mapController.dataManager.currentMapId
      );
      adapter.mapController.setCenter(coord);
    } else {
      adapter.mapController.setCenter([Number(x), Number(z)]);
    }
  };

  return (
    <div className="border border-white/10 rounded p-2 space-y-2">
      <div className="flex gap-2">
        <button
          className={cn('px-2 py-1 text-[10px] rounded', mode === 'xyz' ? 'bg-white/20' : 'bg-white/5')}
          onClick={() => setMode('xyz')}
        >
          XYZ
        </button>
        <button
          className={cn('px-2 py-1 text-[10px] rounded', mode === 'crd' ? 'bg-white/20' : 'bg-white/5')}
          onClick={() => setMode('crd')}
        >
          CRD
        </button>
      </div>
      <div className="flex gap-1">
        <input
          className="w-full bg-white/5 border border-white/10 rounded px-1 py-0.5 text-[10px]"
          placeholder={mode === 'xyz' ? 'x' : 'crd[0]'}
          value={x}
          onChange={(e) => setX(e.target.value)}
        />
        {mode === 'xyz' && (
          <input
            className="w-full bg-white/5 border border-white/10 rounded px-1 py-0.5 text-[10px]"
            placeholder="y"
            value={y}
            onChange={(e) => setY(e.target.value)}
          />
        )}
        <input
          className="w-full bg-white/5 border border-white/10 rounded px-1 py-0.5 text-[10px]"
          placeholder={mode === 'xyz' ? 'z' : 'crd[1]'}
          value={z}
          onChange={(e) => setZ(e.target.value)}
        />
      </div>
      <button className="w-full bg-white/10 hover:bg-white/20 rounded px-2 py-1 text-[10px]" onClick={handleJump}>
        跳转
      </button>
    </div>
  );
});

const EntityLocate = observer(() => {
  const { adapter } = useAdapter();
  const [entityId, setEntityId] = useState('');

  const handleLocate = async () => {
    const id = parseInt(entityId, 10);
    if (isNaN(id)) {
      alert.info('请输入有效的 levelLogicId');
      return;
    }

    const found = await adapter.moveToEntity(id, true, true);
    if (!found) {
      alert.info(`未找到 levelLogicId 为 ${id} 的标点`);
    }
  };

  return (
    <div className="border border-white/10 rounded p-2 space-y-2">
      <span className="text-[10px] text-gray-400">定位标点 (levelLogicId)</span>
      <div className="flex gap-1">
        <input
          className="w-full bg-white/5 border border-white/10 rounded px-1 py-0.5 text-[10px]"
          placeholder="levelLogicId"
          value={entityId}
          onChange={(e) => setEntityId(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleLocate();
          }}
        />
      </div>
      <button className="w-full bg-white/10 hover:bg-white/20 rounded px-2 py-1 text-[10px]" onClick={handleLocate}>
        定位
      </button>
    </div>
  );
});

const CursorPositionDisplay = observer(() => {
  const { adapter } = useAdapter();
  const [coords, setCoords] = useState<string>('');

  useEffect(() => {
    const map = adapter.mapController.olMapRenderer.map;
    const listener = (e: { coordinate: number[] }) => {
      const [x, y] = e.coordinate as MapCoordinate;
      setCoords(`${x.toFixed(2)}, ${y.toFixed(2)}`);
    };
    map.on('pointermove', listener);
    return () => {
      map.un('pointermove', listener);
    };
  }, [adapter]);

  if (!coords) return null;

  const xyzPosition = adapter.mapController.dataManager.crd2xyz(
    [Number(coords.split(',')[0]), Number(coords.split(',')[1])],
    adapter.mapController.dataManager.currentMapId
  );

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

const DevTools = observer(() => {
  return (
    <>
      <DevToolsPanel />
      <DevToolsDrawPanel />
    </>
  );
});

export default DevTools;
