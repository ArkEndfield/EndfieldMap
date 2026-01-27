import { LeftContentContainer } from '@themes/endfield/ui/popup/left';
import { RightContentContainer } from '@themes/endfield/ui/popup/right';
import { useVisibleRightContentItems } from '@themes/endfield/ui/popup/right_content/items';
import { observer } from 'mobx-react-lite';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { useAdapter } from '@/hooks/use_adapter';
import uiManager from '@/services/ui_manager';

const PCPopup: React.FC = observer(() => {
  const { adapter, dataService } = useAdapter();
  const activeFeature = adapter?.activeFeatureController.activeFeature;
  const entity = activeFeature?.data;
  const { items, showSubPopup } = useVisibleRightContentItems(entity);

  const container = useMemo(() => {
    const div = document.createElement('div');
    div.className = 'relative pointer-events-none';
    return div;
  }, []);

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

    if (uiManager.adjustPopup.value) {
      const timeoutId = window.setTimeout(() => {
        adapter.popupController?.updatePosition();
      }, 150);

      return () => {
        window.clearTimeout(timeoutId);
      };
    }
  }, [adapter, activeFeature]);

  const [isExpand, setIsExpand] = useState(false);

  const handleExpandButton = () => {
    setIsExpand((isExpand) => !isExpand);
    // 调整位置
    if (uiManager.adjustPopup.value) {
      window.setTimeout(() => {
        adapter.popupController?.updatePosition();
      }, 200);
    }
  };

  return createPortal(
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
            className="relative z-0"
          >
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
              className="w-auto flex pointer-events-auto relative z-0 h-64"
            >
              {/* 指向feature的三角箭头 */}
              <div className="absolute left-39 -translate-x-1/2 top-full -mt-px -translate-y-1 w-0 h-0 border-l-16 border-r-16 border-t-16 border-l-transparent border-r-transparent border-t-[#272827] z-1" />
              {/* 左侧内容 */}
              <LeftContentContainer
                showSubPopup={showSubPopup}
                isExpanded={isExpand}
                toggleExpand={handleExpandButton}
              />

              {/* 右侧展开内容 */}
              <RightContentContainer isExpand={isExpand && showSubPopup} items={items} />
            </motion.div>
          </motion.div>
        )}
    </AnimatePresence>,
    container
  );
});

export default PCPopup;
