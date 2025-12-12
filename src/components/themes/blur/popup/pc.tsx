import { LeftContent } from '@themes/blur/popup/left';
import { RightContent } from '@themes/blur/popup/right';
import { observer } from 'mobx-react-lite';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { CloseIcon, DoubleChevronRight } from '@/components/common/icons';
import { ScrollArea } from '@/components/common/scroll_area';
import { useAdapter } from '@/hooks/use_adapter';
import uiManager from '@/services/ui_manager';
import { hasReward } from '@/utils/reward';
import { cn } from '@/utils/style';

const PCPopup: React.FC = observer(() => {
  const { adapter, dataService } = useAdapter();

  const container = useMemo(() => {
    const div = document.createElement('div');
    div.className = 'relative pointer-events-none';
    return div;
  }, []);

  const activeFeature = adapter?.activeFeatureController.activeFeature;
  const entity = activeFeature?.data;
  const showRewards = entity && hasReward(entity);

  useEffect(() => {
    if (!adapter?.popupController) return;

    adapter.popupController.setOverlayElement(container);

    return () => {
      adapter.popupController?.setOverlayElement(null);
    };
  }, [adapter, container]);

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
            initial={{ y: 10, scale: 0.95 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 10, scale: 0.95 }}
            transition={{ type: 'spring', bounce: 0.25, duration: 0.3 }}
            className="relative z-0"
          >
            <motion.div
              key={activeFeature.id}
              initial={{ scale: 0.98 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.25, duration: 0.25 }}
              className="w-auto flex pointer-events-auto relative z-0"
            >
              {/* Pointer arrow - positioned at left-39 like endfield */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  'absolute left-39 -translate-x-1/2 top-full -mt-px',
                  'w-0 h-0 border-l-12 border-r-12 border-t-10',
                  'border-l-transparent border-r-transparent border-t-black/60',
                  'z-1'
                )}
              />

              {/* Main content card */}
              <div className={cn('w-80 rounded-2xl overflow-hidden relative')}>
                {/* Background with blur and shadow - 独立做 opacity 动画 */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 bg-black/40 border border-white/20 rounded-2xl backdrop-blur-[40px] shadow-xl shadow-black/20"
                />

                {/* Content */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="relative z-1"
                >
                  {/* Close button */}
                  <button
                    className={cn(
                      'absolute top-3 right-3 z-10',
                      'w-8 h-8 rounded-full',
                      'bg-white/10 hover:bg-white/20',
                      'flex items-center justify-center',
                      'text-white/70 hover:text-white',
                      'transition-all duration-200',
                      'active:scale-95'
                    )}
                    onClick={() => adapter.activeFeatureController.clearActiveFeature?.()}
                  >
                    <CloseIcon className="w-4 h-4" />
                  </button>

                  <div className="p-4 text-white">
                    <ScrollArea className="max-h-60">
                      <LeftContent />
                    </ScrollArea>
                  </div>
                </motion.div>
              </div>

              {/* Toggle button - attached to left card */}
              {showRewards && (
                <div
                  className={cn(
                    'w-8 h-16 rounded-r-lg overflow-hidden shrink-0',
                    'relative self-start mt-4'
                  )}
                >
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 bg-black/40 border border-l-0 border-white/20 rounded-r-lg backdrop-blur-[40px] shadow-xl shadow-black/20"
                  />
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      'relative z-1 w-full h-full',
                      'flex items-center justify-center',
                      'text-white/70 hover:text-white hover:bg-white/10',
                      'transition-all duration-200',
                      'active:scale-95'
                    )}
                    onClick={handleExpandButton}
                  >
                    <DoubleChevronRight
                      className={cn('w-4 h-4 transition-transform duration-200', isExpand && 'rotate-180')}
                    />
                  </motion.button>
                </div>
              )}

              {/* Expandable rewards panel */}
              {showRewards && (
                <motion.div
                  initial={false}
                  animate={{
                    width: isExpand ? 256 : 0,
                  }}
                  transition={{ type: 'spring', bounce: 0.25, duration: 0.3 }}
                  className={cn('rounded-2xl overflow-hidden relative')}
                >
                  {/* Background with blur and shadow */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isExpand ? 1 : 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 bg-black/40 border border-white/20 rounded-2xl backdrop-blur-[40px] shadow-xl shadow-black/20"
                  />

                  {/* Content */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isExpand ? 1 : 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="relative z-1"
                  >
                    <div className="p-4 w-64 text-white">
                      <ScrollArea className="max-h-60">
                        <RightContent />
                      </ScrollArea>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
    </AnimatePresence>,
    container
  );
});

export default PCPopup;
