import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { observer } from 'mobx-react-lite';
import { StrokeSVGFilter } from './deco';
import { LeftContentContainer } from './left';
import { RightContentContainer } from './right';
import { dataService } from '@/services/data';
import { useAdapter } from '@/hooks/use_adapter';

const PCPopup: React.FC = observer(() => {
  const { adapter } = useAdapter();

  const container = useMemo(() => {
    const div = document.createElement('div');
    div.className = 'relative pointer-events-none';
    return div;
  }, []);

  const activeFeature = adapter?.activeFeatureController.activeFeature;

  // 桌面端：设置Overlay元素
  useEffect(() => {
    if (!adapter?.popupController) return;

    adapter.popupController.setOverlayElement(container);

    return () => {
      adapter.popupController?.setOverlayElement(null);
    };
  }, [adapter, container]);

  // 桌面端：在内容渲染完成后，通知 PopupController 再做一次位置更新 + 视图自动平移
  useEffect(() => {
    if (!adapter?.popupController || !activeFeature) return;

    const timeoutId = window.setTimeout(() => {
      adapter.popupController?.updatePosition();
    }, 150);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [adapter, activeFeature]);

  const [isExpand, setIsExpand] = useState(false);

  const handleExpandButton = () => {
    setIsExpand((isExpand) => !isExpand);
    // 调整位置
    window.setTimeout(() => {
      adapter.popupController?.updatePosition();
    }, 200);
  };

  return createPortal(
    <>
      <StrokeSVGFilter />
      <AnimatePresence>
        {activeFeature &&
          !dataService.electricPoleDataService.isInElectricOperateMode &&
          !dataService.customPointDataService.isInCustomPointOperateMode && (
            <motion.div
              key="desktop-popup"
              initial={{ opacity: 0, y: 18, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: 'spring', bounce: 0.4, duration: 0.45 }}
              className="relative z-1"
            >
              {/* 指向feature的三角箭头 */}
              <div className="absolute left-39 -translate-x-1/2 top-full -mt-px -translate-y-1.5 w-0 h-0 border-l-18 border-r-18 border-t-16 border-l-transparent border-r-transparent border-t-[#393A39] z-1" />
              {/* 内容 - 横向展开卡片容器 */}
              <motion.div
                key={activeFeature.id}
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                transition={{ type: 'spring', bounce: 0.35, duration: 0.35 }}
                className="w-auto flex pointer-events-auto cursor-pointer relative z-0"
              >
                {/* 左侧内容 */}
                <LeftContentContainer />

                {/* 右侧展开内容 */}
                <RightContentContainer isExpand={isExpand} toggleExpand={handleExpandButton} />
              </motion.div>
            </motion.div>
          )}
      </AnimatePresence>
    </>,
    container
  );
});

export default PCPopup;
