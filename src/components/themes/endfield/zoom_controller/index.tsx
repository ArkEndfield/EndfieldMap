import { observer } from 'mobx-react-lite';
import { useEffect, useState, useRef } from 'react';
import { RangeInput } from './range_input';
import { useIsMobile } from '@/hooks/use_is_mobile';
import { cn } from '@/utils/style';
import { useAdapter } from '@/hooks/use_adapter';

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

    // 将 React 创建的 DOM 元素设置为控件的元素
    if (containerRef.current) {
      controller.setElement(containerRef.current);
    }

    // 监听缩放变化
    const unsubscribe = controller.onZoomChange((newZoom, newMinZoom, newMaxZoom) => {
      setZoom(newZoom);
      setMinZoom(newMinZoom);
      setMaxZoom(newMaxZoom);
    });

    return () => {
      unsubscribe();
    };
  }, [adapter]);

  // 处理用户通过滑块改变缩放
  // isDragging 为 true 时不使用动画（拖动），为 false 时使用动画（点击）
  const handleZoomChange = (newZoom: number, isDragging?: boolean) => {
    adapter.zoomController?.setZoom(newZoom, !isDragging);
  };

  // 处理增减按钮点击（使用动画）
  const handleIncrement = () => {
    const newZoom = Math.min(zoom + 0.5, maxZoom);
    adapter.zoomController?.setZoom(newZoom, true);
  };

  const handleDecrement = () => {
    const newZoom = Math.max(zoom - 0.5, minZoom);
    adapter.zoomController?.setZoom(newZoom, true);
  };

  // TODO: mobile
  if (isMobile) return null;

  return (
    <div
      ref={containerRef}
      className="fixed right-4 top-1/2 -translate-y-1/2"
    >
      <RangeInput
        value={zoom}
        onChange={handleZoomChange}
        onIncrement={handleIncrement}
        onDecrement={handleDecrement}
        direction={isMobile ? 'horizontal' : 'vertical'}
        className={cn(isMobile ? 'w-40' : 'h-40')}
        min={minZoom}
        max={maxZoom}
        step={0.5}
        snapToStep={false}
      />
    </div>
  );
});

export default ZoomController;
