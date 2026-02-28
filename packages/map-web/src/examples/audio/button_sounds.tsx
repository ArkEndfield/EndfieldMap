/**
 * 音效系统 - 按钮音效示例
 * 展示如何为按钮添加点击和悬停音效
 */

import { SoundType } from '@endfieldmap/map-web-theme-types/audio';
import { useAudio, useButtonSound } from '@endfieldmap/web-components';
import { observer } from 'mobx-react-lite';

/**
 * 示例 1: 带点击音效的按钮
 */
export const ButtonWithClickSound = observer(() => {
  const { play } = useAudio();

  const handleClick = () => {
    play(SoundType.CLICK);
    console.log('按钮被点击了');
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">示例 1: 带点击音效的按钮</h3>
      <button
        onClick={handleClick}
        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        点击我
      </button>
    </div>
  );
});

/**
 * 示例 2: 使用 useButtonSound hook
 */
export const ButtonWithHookSound = observer(() => {
  const { onClick } = useButtonSound(SoundType.CLICK);

  const handleClick = () => {
    onClick(); // 播放音效
    console.log('按钮被点击了');
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">示例 2: 使用 useButtonSound</h3>
      <button
        onClick={handleClick}
        className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
      >
        使用 Hook 的按钮
      </button>
    </div>
  );
});

/**
 * 示例 3: 带悬停和点击音效的按钮
 */
export const ButtonWithHoverAndClick = observer(() => {
  const { play } = useAudio();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">示例 3: 悬停 + 点击音效</h3>
      <button
        onClick={() => play(SoundType.CLICK)}
        onMouseEnter={() => play(SoundType.CLICK)}
        className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
      >
        悬停并点击我
      </button>
    </div>
  );
});

/**
 * 示例 4: 可重用的音效按钮组件
 */
interface SoundButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  className?: string;
}

const SoundButton = observer(({ onClick, children, variant = 'primary', className = '' }: SoundButtonProps) => {
  const { play } = useAudio();

  const variantStyles = {
    primary: 'bg-blue-500 hover:bg-blue-600',
    secondary: 'bg-gray-500 hover:bg-gray-600',
    danger: 'bg-red-500 hover:bg-red-600',
    success: 'bg-green-500 hover:bg-green-600',
  };

  const handleClick = () => {
    play(SoundType.CLICK);
    onClick?.();
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => play(SoundType.CLICK)}
      className={`px-6 py-3 text-white rounded-lg transition-colors ${variantStyles[variant]} ${className}`}
    >
      {children}
    </button>
  );
});

export const ReusableSoundButtonExample = observer(() => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">示例 4: 可重用的音效按钮组件</h3>
      <div className="flex gap-4 flex-wrap">
        <SoundButton variant="primary" onClick={() => console.log('Primary clicked')}>
          主要按钮
        </SoundButton>
        <SoundButton variant="secondary" onClick={() => console.log('Secondary clicked')}>
          次要按钮
        </SoundButton>
        <SoundButton variant="success" onClick={() => console.log('Success clicked')}>
          成功按钮
        </SoundButton>
        <SoundButton variant="danger" onClick={() => console.log('Danger clicked')}>
          危险按钮
        </SoundButton>
      </div>
    </div>
  );
});

/**
 * 示例 5: 不同按钮状态的音效
 */
export const ButtonStatesExample = observer(() => {
  const { play } = useAudio();

  const handleSuccess = () => {
    play(SoundType.CLICK);
    alert('操作成功！');
  };

  const handleError = () => {
    play(SoundType.CLAIM);
    alert('操作失败！');
  };

  const handleInfo = () => {
    play(SoundType.TICK);
    alert('这是一条通知');
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">示例 5: 根据操作结果播放不同音效</h3>
      <div className="flex gap-4">
        <button onClick={handleSuccess} className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600">
          成功操作
        </button>
        <button onClick={handleError} className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600">
          失败操作
        </button>
        <button onClick={handleInfo} className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
          通知信息
        </button>
      </div>
    </div>
  );
});

/**
 * 组合所有按钮音效示例
 */
export const ButtonSoundExamples = observer(() => {
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <h2 className="text-2xl font-bold mb-6">音效系统 - 按钮音效示例</h2>

      <ButtonWithClickSound />
      <hr className="border-gray-300" />

      <ButtonWithHookSound />
      <hr className="border-gray-300" />

      <ButtonWithHoverAndClick />
      <hr className="border-gray-300" />

      <ReusableSoundButtonExample />
      <hr className="border-gray-300" />

      <ButtonStatesExample />
    </div>
  );
});
