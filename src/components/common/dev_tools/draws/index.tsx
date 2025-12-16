import { useState } from 'react';

import { PointDraw } from '@/components/common/dev_tools/draws/point';
import { ShapeDraw } from '@/components/common/dev_tools/draws/shape';
import { ZoneDraw } from '@/components/common/dev_tools/draws/zone';

export const Draws = () => {
  const [activeTab, setActiveTab] = useState<'point' | 'zone' | 'shape'>('point');

  return (
    <div className="flex flex-col gap-2 border border-white/10 rounded-md">
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
    </div>
  );
};
