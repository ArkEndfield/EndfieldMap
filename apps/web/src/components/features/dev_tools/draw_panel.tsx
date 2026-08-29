import { DevToolsShapeType } from '@endfieldmap/map-adapter-ol';
import { domEventListener } from '@endfieldmap/tools';
import { cn } from '@endfieldmap/tools';
import { useWindow } from '@endfieldmap/web-components';
import { CloseIcon, EditIcon, TrashIcon, ViewAltIcon } from '@endfieldmap/web-components';
import { observer } from 'mobx-react-lite';
import { useEffect, useRef, useState } from 'react';

import { Draws } from '@/components/features/dev_tools/draws';
import { useAdapter } from '@/hooks/use_adapter';
import { service } from '@/services';

const shapeTypeLabel: Record<DevToolsShapeType, string> = {
  [DevToolsShapeType.POINT]: '点',
  [DevToolsShapeType.CIRCLE]: '圆形',
  [DevToolsShapeType.POLYGON]: '多边形',
  [DevToolsShapeType.LINE]: '折线',
  [DevToolsShapeType.RECTANGLE]: '矩形',
};

export const DevToolsDrawPanelToggle = observer(() => {
  const devToolsState = service.dataService.mapDataService.mapStateDataService.devToolsState;

  if (!devToolsState) {
    return null;
  }

  const open = devToolsState.value.drawPanelOpen ?? false;

  return (
    <button
      className={cn(
        'fixed z-50 right-4 bottom-4 w-10 h-10 rounded-full border border-white/20 shadow-lg backdrop-blur-md transition-colors',
        open ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-black/70 text-white hover:bg-black/80'
      )}
      type="button"
      title={open ? '隐藏绘制面板' : '显示绘制面板'}
      onClick={() => {
        devToolsState.value = { ...devToolsState.value, drawPanelOpen: !open };
      }}
    >
      <EditIcon className="text-lg mx-auto" />
    </button>
  );
});

export const DevToolsDrawPanel = observer(() => {
  const { adapter } = useAdapter();
  const devToolsController = adapter.devToolsController;
  const devToolsState = service.dataService.mapDataService.mapStateDataService.devToolsState;
  const currentWindow = useWindow();

  const [isDragging, setIsDragging] = useState(false);
  const dragStartOffset = useRef({ right: 0, top: 0 });
  const ref = useRef<HTMLDivElement>(null);

  const open = devToolsState?.value.drawPanelOpen ?? false;
  const storedPos = devToolsState?.value.drawPanelPosition ?? { right: 20, top: 80 };

  const [position, setPosition] = useState(storedPos);
  const positionRef = useRef(position);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    if (!open || isDragging || !devToolsState) return;
    const next = devToolsState.value.drawPanelPosition ?? { right: 20, top: 80 };
    setPosition((prev) => (prev.right === next.right && prev.top === next.top ? prev : next));
  }, [devToolsState, devToolsState?.value.drawPanelPosition, isDragging, open]);

  useEffect(() => {
    if (!open) return;
    const handleResize = () => {
      if (!ref.current) return;
      const width = ref.current.offsetWidth;
      const height = ref.current.offsetHeight;
      const maxTop = currentWindow.innerHeight - height;
      const maxRight = currentWindow.innerWidth - width;
      setPosition((prev) => ({
        right: Math.max(0, Math.min(prev.right, maxRight)),
        top: Math.max(0, Math.min(prev.top, maxTop)),
      }));
    };
    const dispose = domEventListener(currentWindow, 'resize', handleResize);
    return () => dispose?.();
  }, [open, currentWindow]);

  useEffect(() => {
    if (!isDragging) return;

    const d1 = domEventListener(currentWindow, 'mousemove', (e) => {
      if (!ref.current) return;

      const mouseDistFromWindowRight = currentWindow.innerWidth - e.clientX;
      let newRight = mouseDistFromWindowRight - dragStartOffset.current.right;
      let newTop = e.clientY - dragStartOffset.current.top;

      const width = ref.current.offsetWidth;
      const height = ref.current.offsetHeight;
      const maxRight = currentWindow.innerWidth - width;
      const maxTop = currentWindow.innerHeight - height;

      newRight = Math.max(0, Math.min(newRight, maxRight));
      newTop = Math.max(0, Math.min(newTop, maxTop));

      setPosition({ right: newRight, top: newTop });
    });
    const d2 = domEventListener(currentWindow, 'mouseup', () => {
      setIsDragging(false);
      if (!devToolsState) return;
      const prev = devToolsState.value.drawPanelPosition ?? { right: 20, top: 80 };
      const next = positionRef.current;
      if (prev.right === next.right && prev.top === next.top) return;
      devToolsState.value = {
        ...devToolsState.value,
        drawPanelPosition: next,
      };
    });

    return () => {
      d1?.();
      d2?.();
    };
  }, [devToolsState, isDragging, currentWindow]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const currentRightVal = currentWindow.innerWidth - rect.right;
    const mouseDistFromWindowRight = currentWindow.innerWidth - e.clientX;
    dragStartOffset.current = {
      right: mouseDistFromWindowRight - currentRightVal,
      top: e.clientY - rect.top,
    };
  };

  const layers = devToolsController ? [...devToolsController.layers].sort((a, b) => b.zIndex - a.zIndex) : [];

  if (!open || !devToolsController || !devToolsState) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={cn(
        'fixed z-50 bg-black/80 text-white rounded-lg shadow-lg border border-white/20 overflow-hidden backdrop-blur-md flex flex-col',
        isDragging ? 'cursor-grabbing' : ''
      )}
      style={{
        right: position.right,
        top: position.top,
        width: 380,
        maxWidth: 'calc(100vw - 16px)',
        maxHeight: '80vh',
      }}
    >
      <div
        className={cn(
          'flex items-center justify-between px-2 select-none h-10 border-b border-white/10 bg-white/5 shrink-0 grow-0',
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        )}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2 shrink-0 grow-0">
          <EditIcon className="text-base" />
          <span className="text-xs font-bold whitespace-nowrap">绘制</span>
        </div>
        <button
          className="cursor-pointer hover:bg-white/20 rounded-sm p-1 flex items-center justify-center transition-colors shrink-0 grow-0"
          type="button"
          title="关闭"
          onClick={() => {
            devToolsState.value = { ...devToolsState.value, drawPanelOpen: false };
          }}
        >
          <CloseIcon className="text-base" />
        </button>
      </div>

      <div className="p-3 text-xs flex flex-col gap-3 flex-1 min-h-0" onMouseDown={(e) => e.stopPropagation()}>
        <div className="shrink-0 grow-0">
          <Draws />
        </div>

        <div className="border border-white/10 rounded-md overflow-hidden flex flex-col flex-1 min-h-0">
          <div className="flex items-center justify-between px-2 py-1.5 border-b border-white/10 bg-white/5">
            <span className="text-[11px] text-gray-200">图层</span>
            <span className="text-[10px] text-gray-400">{layers.length} 个</span>
          </div>

          <div className="flex-1 min-h-0 overflow-auto">
            {layers.length === 0 ? (
              <div className="px-2 py-3 text-[11px] text-gray-400">暂无图层</div>
            ) : (
              <ul className="divide-y divide-white/10">
                {layers.map((layer) => (
                  <li key={layer.id} className="flex items-center justify-between px-2 py-1.5 hover:bg-white/10">
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        className={cn(
                          'p-1 rounded hover:bg-white/10 transition-colors',
                          layer.visible ? 'text-white' : 'text-gray-500'
                        )}
                        type="button"
                        title={layer.visible ? '隐藏图层' : '显示图层'}
                        onClick={() => devToolsController.setFeatureVisible(layer.id, !layer.visible)}
                      >
                        <ViewAltIcon className="text-sm" />
                      </button>
                      <div className="truncate">
                        <span className="text-gray-300">#{layer.id}</span>{' '}
                        <span className="text-gray-100">{shapeTypeLabel[layer.type]}</span>
                      </div>
                    </div>

                    <button
                      className="p-1 rounded text-red-400 hover:bg-red-500/20 transition-colors"
                      type="button"
                      title="删除图层"
                      onClick={() => devToolsController.removeFeature(layer.id)}
                    >
                      <TrashIcon className="text-sm" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
