import React from 'react';
import { observer } from 'mobx-react-lite';
import { dataService } from '@/services/data';
import { useAdapter } from '@/hooks/use_adapter';

const MobilePopup: React.FC = observer(() => {
  const { adapter } = useAdapter();
  const activeFeature = adapter?.activeFeatureController.activeFeature;

  const handleClose = () => {
    adapter?.activeFeatureController.clearActiveFeature();
  };

  const handleToggleMarked = () => {
    if (activeFeature) {
      activeFeature.toggleMarked();
    }
  };

  if (!activeFeature || dataService.electricPoleDataService.isInElectricOperateMode) return null;

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
});

export default MobilePopup;
