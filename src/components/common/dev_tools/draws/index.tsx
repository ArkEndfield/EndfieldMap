import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import { DrawHistoryProvider } from '@/components/common/dev_tools/draws/components/draw_history';
import { useDrawHistory } from '@/components/common/dev_tools/draws/hooks/use_draw_history';
import { PointDraw } from '@/components/common/dev_tools/draws/point';
import { ShapeDraw } from '@/components/common/dev_tools/draws/shape';
import { ZoneDraw } from '@/components/common/dev_tools/draws/zone';
import { useAdapter } from '@/hooks/use_adapter';
import { cn } from '@/utils/style';

const DrawToolbar = () => {
  const { canUndo, canRedo, featureCount, undo, redo, clear } = useDrawHistory();

  return (
    <div className="flex items-center justify-between gap-2 px-2 py-1.5 border-b border-white/10 bg-white/5">
      <div className="flex items-center gap-1">
        <button
          className={cn(
            'px-2 py-1 rounded text-xs transition-colors',
            canUndo ? 'text-white hover:bg-white/20' : 'text-gray-500 cursor-not-allowed'
          )}
          onClick={undo}
          disabled={!canUndo}
          title="撤销 (Undo)"
        >
          ↩ 撤销
        </button>
        <button
          className={cn(
            'px-2 py-1 rounded text-xs transition-colors',
            canRedo ? 'text-white hover:bg-white/20' : 'text-gray-500 cursor-not-allowed'
          )}
          onClick={redo}
          disabled={!canRedo}
          title="重做 (Redo)"
        >
          ↪ 重做
        </button>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-gray-400">{featureCount} 个图形</span>
        <button
          className={cn(
            'px-2 py-1 rounded text-xs transition-colors',
            featureCount > 0 ? 'text-red-400 hover:bg-red-500/20' : 'text-gray-500 cursor-not-allowed'
          )}
          onClick={clear}
          disabled={featureCount === 0}
          title="清空所有"
        >
          清空
        </button>
      </div>
    </div>
  );
};

const DrawTabs = () => {
  const [activeTab, setActiveTab] = useState<'point' | 'zone' | 'shape'>('point');

  return (
    <>
      <div className="flex gap-2 border-b border-white/10 p-2">
        <button
          className={`px-3 py-1 rounded text-xs transition-colors ${
            activeTab === 'point' ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'
          }`}
          onClick={() => setActiveTab('point')}
        >
          点绘制
        </button>
        <button
          className={`px-3 py-1 rounded text-xs transition-colors ${
            activeTab === 'shape' ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'
          }`}
          onClick={() => setActiveTab('shape')}
        >
          形状绘制
        </button>
        <button
          className={`px-3 py-1 rounded text-xs transition-colors ${
            activeTab === 'zone' ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'
          }`}
          onClick={() => setActiveTab('zone')}
        >
          区域绘制
        </button>
      </div>

      <div className="p-2">
        {activeTab === 'point' && <PointDraw />}
        {activeTab === 'shape' && <ShapeDraw />}
        {activeTab === 'zone' && <ZoneDraw />}
      </div>
    </>
  );
};

export const Draws = observer(() => {
  const { adapter } = useAdapter();
  const map = adapter.mapController.mapRenderer.map;

  return (
    <DrawHistoryProvider map={map}>
      <div className="flex flex-col gap-0 border border-white/10 rounded-md">
        <DrawToolbar />
        <DrawTabs />
      </div>
    </DrawHistoryProvider>
  );
});
