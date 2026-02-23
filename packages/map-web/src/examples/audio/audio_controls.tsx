/**
 * 音效系统 - 音效控制面板示例
 * 展示如何创建音效设置面板，包括音量控制、静音开关等
 */

import { observer } from 'mobx-react-lite';

import { SoundType } from '@endfieldmap/map-web-theme-types/audio';
import { useAudio } from '@endfieldmap/web-components';
import { audioService } from '@endfieldmap/web-components';

/**
 * 示例 1: 简单的音效开关
 */
export const SimpleToggleExample = observer(() => {
  const { isEnabled, toggleAudio } = useAudio();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">示例 1: 音效开关</h3>
      <div className="flex items-center gap-4">
        <button
          onClick={toggleAudio}
          className={`px-6 py-3 text-white rounded-lg transition-colors ${
            isEnabled ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-500 hover:bg-gray-600'
          }`}
        >
          {isEnabled ? '🔊 音效已启用' : '🔇 音效已禁用'}
        </button>
        <span className="text-sm text-gray-600">当前状态: {isEnabled ? '开启' : '关闭'}</span>
      </div>
    </div>
  );
});

/**
 * 示例 2: 音量滑块控制
 */
export const VolumeSliderExample = observer(() => {
  const { masterVolume, setMasterVolume, play } = useAudio();

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = Number(e.target.value) / 100;
    setMasterVolume(volume);
  };

  const testVolume = () => {
    play(SoundType.CLICK);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">示例 2: 音量控制</h3>
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium w-16">音量:</span>
        <input
          type="range"
          min="0"
          max="100"
          value={Math.round(masterVolume * 100)}
          onChange={handleVolumeChange}
          className="flex-1 max-w-xs"
        />
        <span className="text-sm font-medium w-12 text-right">{Math.round(masterVolume * 100)}%</span>
        <button onClick={testVolume} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          测试
        </button>
      </div>
    </div>
  );
});

/**
 * 示例 3: 完整的音效控制面板
 */
export const FullControlPanelExample = observer(() => {
  const { isEnabled, toggleAudio, masterVolume, setMasterVolume, play, isInitialized } = useAudio();

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = Number(e.target.value) / 100;
    setMasterVolume(volume);
  };

  const testSound = (soundType: SoundType) => {
    play(soundType);
  };

  return (
    <div className="space-y-6 bg-gray-100 p-6 rounded-lg">
      <h3 className="text-lg font-semibold">示例 3: 完整音效控制面板</h3>

      {/* 初始化状态 */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">初始化状态:</span>
        <span
          className={`text-sm px-2 py-1 rounded ${
            isInitialized ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'
          }`}
        >
          {isInitialized ? '✓ 已就绪' : '⏳ 加载中...'}
        </span>
      </div>

      {/* 音效开关 */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium w-24">音效:</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" checked={isEnabled} onChange={toggleAudio} className="sr-only" />
          <div className={`w-14 h-8 rounded-full transition-colors ${isEnabled ? 'bg-blue-500' : 'bg-gray-400'}`}>
            <div
              className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                isEnabled ? 'transform translate-x-6' : ''
              }`}
            />
          </div>
          <span className="ml-3 text-sm">{isEnabled ? '开启' : '关闭'}</span>
        </label>
      </div>

      {/* 主音量控制 */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium w-24">主音量:</span>
        <input
          type="range"
          min="0"
          max="100"
          value={Math.round(masterVolume * 100)}
          onChange={handleVolumeChange}
          disabled={!isEnabled}
          className="flex-1 max-w-xs disabled:opacity-50"
        />
        <span className="text-sm font-medium w-12 text-right">{Math.round(masterVolume * 100)}%</span>
      </div>

      {/* 测试音效 */}
      <div className="space-y-2">
        <span className="text-sm font-medium">测试音效:</span>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <button
            onClick={() => testSound(SoundType.CLICK)}
            disabled={!isEnabled}
            className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            点击
          </button>
          <button
            onClick={() => testSound(SoundType.CLAIM)}
            disabled={!isEnabled}
            className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            确认
          </button>
          <button
            onClick={() => testSound(SoundType.TICK)}
            disabled={!isEnabled}
            className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            勾选
          </button>
          <button
            onClick={() => testSound(SoundType.PRIZE_CONFIRM)}
            disabled={!isEnabled}
            className="px-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            领取奖励
          </button>
        </div>
      </div>
    </div>
  );
});

/**
 * 示例 4: 音效缓存状态显示
 */
export const CacheStatusExample = observer(() => {
  const cacheStatus = audioService.getCacheStatus();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">示例 4: 缓存状态</h3>
      <div className="bg-gray-100 p-4 rounded-lg space-y-2">
        <div className="flex justify-between">
          <span className="text-sm font-medium">已缓存音效:</span>
          <span className="text-sm">
            {cacheStatus.size} / {cacheStatus.total}
          </span>
        </div>
        <div className="text-xs text-gray-600">
          <div>缓存列表:</div>
          <div className="mt-1 flex flex-wrap gap-1">
            {cacheStatus.cached.map((type) => (
              <span key={type} className="px-2 py-1 bg-blue-200 text-blue-800 rounded">
                {type}
              </span>
            ))}
          </div>
        </div>
        <button
          onClick={() => audioService.clearCache()}
          className="mt-2 px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
        >
          清空缓存
        </button>
      </div>
    </div>
  );
});

/**
 * 示例 5: 紧凑型控制面板（适合设置页面）
 */
export const CompactControlPanelExample = observer(() => {
  const { isEnabled, toggleAudio, masterVolume, setMasterVolume } = useAudio();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">示例 5: 紧凑型控制面板</h3>
      <div className="bg-white border border-gray-300 rounded-lg p-4 max-w-md">
        <h4 className="font-medium mb-4">音效设置</h4>

        {/* 音效开关 */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm">启用音效</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={isEnabled} onChange={toggleAudio} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* 音量控制 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">音量</span>
            <span className="text-sm text-gray-600">{Math.round(masterVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(masterVolume * 100)}
            onChange={(e) => setMasterVolume(Number(e.target.value) / 100)}
            disabled={!isEnabled}
            className="w-full disabled:opacity-50"
          />
        </div>
      </div>
    </div>
  );
});

/**
 * 组合所有音效控制面板示例
 */
export const AudioControlExamples = observer(() => {
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <h2 className="text-2xl font-bold mb-6">音效系统 - 控制面板示例</h2>

      <SimpleToggleExample />
      <hr className="border-gray-300" />

      <VolumeSliderExample />
      <hr className="border-gray-300" />

      <FullControlPanelExample />
      <hr className="border-gray-300" />

      <CacheStatusExample />
      <hr className="border-gray-300" />

      <CompactControlPanelExample />
    </div>
  );
});
