import { crd2xyz, domEventListener } from '@endfieldmap/tools';
import { observer } from 'mobx-react-lite';
import { useEffect, useRef, useState } from 'react';

import { DevToolsDrawPanel } from '@/components/common/dev_tools/draw_panel';
import { CogIcon, EditIcon, MinusIcon } from '@/components/common/icons';
import { useAdapter } from '@/hooks/use_adapter';
import { cn } from '@/utils/style';
import { TierControls } from '@/components/common/dev_tools/views/tier_controller';

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

const DevTools = observer(() => {
  return (
    <>
      <DevToolsPanel />
      <DevToolsDrawPanel />
    </>
  );
});

export default DevTools;
