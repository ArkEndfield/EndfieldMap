import { RangeInput } from '@themes/blur/zoom_controller/range_input';
import { observer } from 'mobx-react-lite';
import { useEffect, useRef, useState } from 'react';

import { useAdapter } from '@/hooks/use_adapter';
import { useIsMobile } from '@/hooks/use_is_mobile';
import { cn } from '@/utils/style';

const ZoomController: React.FC = observer(() => {
  const isMobile = useIsMobile();
  const { adapter } = useAdapter();
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(1);
  const [maxZoom, setMaxZoom] = useState(5);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = adapter.zoomController;
    if (!controller) return;

    if (containerRef.current) {
      controller.setElement(containerRef.current);
    }

    const unsubscribe = controller.onZoomChange((newZoom, newMinZoom, newMaxZoom) => {
      setZoom(newZoom);
      setMinZoom(newMinZoom);
      setMaxZoom(newMaxZoom);
    });

    return () => {
      unsubscribe();
    };
  }, [adapter]);

  // Handle zoom change from RangeInput
  // isDragging is true when dragging (no animation), false when clicking (with animation)
  const handleZoomChange = (newZoom: number, isDragging?: boolean) => {
    adapter.zoomController?.setZoom(newZoom, !isDragging);
  };

  // Handle increment button click (with animation)
  const handleIncrement = () => {
    const newZoom = Math.min(zoom + 0.5, maxZoom);
    adapter.zoomController?.setZoom(newZoom, true);
  };

  // Handle decrement button click (with animation)
  const handleDecrement = () => {
    const newZoom = Math.max(zoom - 0.5, minZoom);
    adapter.zoomController?.setZoom(newZoom, true);
  };

  if (isMobile) return null;

  return (
    <div ref={containerRef} className="fixed right-4 top-1/2 -translate-y-1/2">
      <div
        className={cn(
          'flex flex-col gap-1.5 p-2 rounded-xl',
          'bg-black/40 backdrop-blur-2xl',
          'border border-white/20',
          'shadow-xl shadow-black/20'
        )}
      >
        <RangeInput
          value={zoom}
          onChange={handleZoomChange}
          onIncrement={handleIncrement}
          onDecrement={handleDecrement}
          direction="vertical"
          className="h-40"
          min={minZoom}
          max={maxZoom}
          step={0.5}
          snapToStep={false}
        />
      </div>
    </div>
  );
});

export default ZoomController;
