import React, { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { observer } from 'mobx-react-lite';
import { AnimatePresence, motion } from 'motion/react';
import type { PopupProps } from '@/components/themes/types/popup';

const PCPopup: React.FC<PopupProps> = observer(({ adapter }) => {
  // Create a detached element to serve as the overlay container
  const container = useMemo(() => {
    const div = document.createElement('div');
    div.className = "relative pointer-events-none";
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

    const frameId = window.requestAnimationFrame(() => {
      adapter.popupController?.updatePosition();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [adapter, activeFeature]);

  const handleToggleMarked = () => {
    if (activeFeature) {
      activeFeature.toggleMarked();
    }
  };

  // Render content into the container using Portal
  return createPortal(
    <AnimatePresence>
      {activeFeature && (
        <motion.div
          key="desktop-popup"
          initial={{ opacity: 0, y: 18, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ type: 'spring', bounce: 0.4, duration: 0.45 }}
          className="relative pointer-events-none"
        >
          {/* 指向feature的三角箭头 */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white" />
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-[9px] w-0 h-0 border-l-[9px] border-r-[9px] border-t-[9px] border-l-transparent border-r-transparent border-t-gray-200" />
          {/* 内容 */}
          <motion.div
            key={activeFeature.id}
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', bounce: 0.35, duration: 0.35 }}
            className="relative bg-white rounded-lg shadow-xl border border-gray-200 min-w-[280px] max-w-sm p-4 pointer-events-auto"
          >
            <h3 className="font-bold text-base text-gray-900 mb-3 pr-6 truncate">
              {activeFeature.data.entityDataIdKey || '实体'}
            </h3>

            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-gray-500 min-w-[50px]">ID:</span>
                <span className="font-mono text-gray-900 text-xs">{activeFeature.data.entityDataIdKey}</span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-gray-500 min-w-[50px]">位置:</span>
                <span className="font-mono text-gray-900 text-xs">
                  ({activeFeature.coordinates[0]}, {activeFeature.coordinates[1]})
                </span>
              </div>

              <div className="pt-2 mt-2 border-t border-gray-100">
                <div className="flex items-start space-x-2 text-xs">
                  <span className="text-gray-500 min-w-[50px] pt-0.5">状态:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeFeature.marked && (
                      <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded text-[10px] font-medium">
                        已标记
                      </span>
                    )}
                    {activeFeature.isSelected && (
                      <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-medium">
                        已选择
                      </span>
                    )}
                    {activeFeature.active && (
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-medium">
                        激活中
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <button
                onClick={handleToggleMarked}
                className="w-full py-2 px-3 text-sm font-medium rounded border-2 transition-colors"
                style={{
                  borderColor: activeFeature.marked ? '#f59e0b' : '#d1d5db',
                  color: activeFeature.marked ? '#f59e0b' : '#6b7280',
                  backgroundColor: activeFeature.marked ? '#fef3c7' : 'white',
                }}
              >
                {activeFeature.marked ? '取消标记' : '标记'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    container
  );
});

export default PCPopup;
