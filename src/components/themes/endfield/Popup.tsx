import { useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import type { PopupProps } from '@/components/themes/types/popup';
import { useIsMobile } from '@/hooks/useIsMobile';

const Popup: React.FC<PopupProps> = observer(({ adapter }) => {
  const desktopRef = useRef<HTMLDivElement>(null);
  const activeFeature = adapter?.activeFeatureController.activeFeature;
  const isMobile = useIsMobile();
  // 桌面端：设置Overlay元素
  useEffect(() => {
    if (isMobile || !adapter?.popupController || !desktopRef.current) return;

    adapter.popupController.setOverlayElement(desktopRef.current);

    return () => {
      adapter.popupController?.setOverlayElement(null);
    };
  }, [adapter, isMobile]);

  const handleClose = () => {
    adapter?.activeFeatureController.clearActiveFeature();
  };

  const handleToggleMarked = () => {
    if (activeFeature) {
      activeFeature.toggleMarked();
    }
  };

  // 移动端：固定在底部的Sheet
  if (isMobile) {
    // 如果没有feature，不渲染
    if (!activeFeature) return null;
    return (
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[80vh] overflow-y-auto transform transition-transform duration-300 ease-out">
        {/* 顶部拖拽指示器 */}
        <div className="flex justify-center py-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* 内容 */}
        <div className="p-4 pb-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="font-bold text-lg flex-1 truncate">{activeFeature.data.entityDataIdKey || '实体'}</h3>
            <button onClick={handleClose} className="ml-3 text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-gray-500 min-w-[60px]">ID:</span>
              <span className="font-mono text-gray-900">{activeFeature.data.entityDataIdKey}</span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-gray-500 min-w-[60px]">位置:</span>
              <span className="font-mono text-gray-900">
                ({activeFeature.data.position.x}, {activeFeature.data.position.y})
              </span>
            </div>

            {activeFeature.data.position.z !== undefined && (
              <div className="flex items-center space-x-2">
                <span className="text-gray-500 min-w-[60px]">高度:</span>
                <span className="font-mono text-gray-900">{activeFeature.data.position.z}</span>
              </div>
            )}

            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-gray-500">状态:</span>
                <div className="flex flex-wrap gap-2">
                  {activeFeature.marked && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-md font-medium">已标记</span>
                  )}
                  {activeFeature.isSelected && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md font-medium">已选择</span>
                  )}
                  {activeFeature.active && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md font-medium">激活中</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleToggleMarked}
              className="flex-1 py-3 border-2 font-medium rounded-lg transition-colors"
              style={{
                borderColor: activeFeature.marked ? '#f59e0b' : '#d1d5db',
                color: activeFeature.marked ? '#f59e0b' : '#6b7280',
                backgroundColor: activeFeature.marked ? '#fef3c7' : 'white',
              }}
            >
              {activeFeature.marked ? '取消标记' : '标记'}
            </button>
            <button
              onClick={handleClose}
              className="flex-1 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 桌面端：跟随feature的Overlay
  // 始终渲染容器以便PopupController可以设置Overlay，但只在有feature时显示内容
  return (
    <div ref={desktopRef} className="relative pointer-events-none">
      {activeFeature && (
        <>
          {/* 指向feature的三角箭头 */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white" />
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-[9px] w-0 h-0 border-l-[9px] border-r-[9px] border-t-[9px] border-l-transparent border-r-transparent border-t-gray-200" />
          {/* 内容 */}
          <div className="relative bg-white rounded-lg shadow-xl border border-gray-200 min-w-[280px] max-w-sm p-4 pointer-events-auto">
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
                  ({activeFeature.data.position.x}, {activeFeature.data.position.y})
                </span>
              </div>

              {activeFeature.data.position.z !== undefined && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500 min-w-[50px]">高度:</span>
                  <span className="font-mono text-gray-900 text-xs">{activeFeature.data.position.z}</span>
                </div>
              )}

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
          </div>
        </>
      )}
    </div>
  );
});

export default Popup;