/**
 * 音效系统 - 基础使用示例
 * 展示如何在组件中使用音效的基本方法
 */

import { observer } from 'mobx-react-lite';

import { SoundType } from '@endfieldmap/map-web-theme-types/audio';
import { useAudio } from '@endfieldmap/web-components';

/**
 * 示例 1: 最简单的按钮点击音效
 */
export const SimpleButtonExample = observer(() => {
  const { play } = useAudio();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">示例 1: 简单按钮点击</h3>
      <button
        onClick={() => play(SoundType.CLICK)}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        点击播放音效
      </button>
    </div>
  );
});

/**
 * 示例 2: 不同音效类型
 */
export const DifferentSoundsExample = observer(() => {
  const { play } = useAudio();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">示例 2: 不同音效类型</h3>
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => play(SoundType.CLICK)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          点击
        </button>
        <button
          onClick={() => play(SoundType.CLAIM)}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          确认
        </button>
        <button
          onClick={() => play(SoundType.TICK)}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          勾选
        </button>
        <button
          onClick={() => play(SoundType.PRIZE_CONFIRM)}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          领取奖励
        </button>
      </div>
    </div>
  );
});

/**
 * 示例 3: 自定义音量播放
 */
export const CustomVolumeExample = observer(() => {
  const { play } = useAudio();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">示例 3: 自定义音量</h3>
      <div className="flex gap-4">
        <button
          onClick={() => play(SoundType.CLICK, { volume: 0.2 })}
          className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
        >
          小声 (20%)
        </button>
        <button
          onClick={() => play(SoundType.CLICK, { volume: 0.5 })}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          中等 (50%)
        </button>
        <button
          onClick={() => play(SoundType.CLICK, { volume: 1.0 })}
          className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800"
        >
          最大 (100%)
        </button>
      </div>
    </div>
  );
});

/**
 * 示例 4: 组合所有基础示例
 */
export const BasicUsageExamples = observer(() => {
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <h2 className="text-2xl font-bold mb-6">音效系统 - 基础使用示例</h2>

      <SimpleButtonExample />
      <hr className="border-gray-300" />

      <DifferentSoundsExample />
      <hr className="border-gray-300" />

      <CustomVolumeExample />
    </div>
  );
});
