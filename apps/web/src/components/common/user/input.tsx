import { SoundType } from '@endfieldmap/map-web-theme-types/audio';
import { cn } from '@endfieldmap/tools';
import { ButtonWithAudio, InVisibleIcon, useAudio,VisibleIcon } from '@endfieldmap/web-components';
import { useRef, useState } from 'react';

export interface UserInputProps {
  icon?: React.ReactNode;
  type?: React.InputHTMLAttributes<HTMLInputElement>['type'];
  label: React.ReactNode;
  placeholder?: string;
  value: string;
  error?: boolean;
  onChange: (value: string) => void;
  soundType?: SoundType;
}

const DefaultIcon = () => (
  <div className="w-5 h-5 border-2 border-[#f0fd2d] p-0.75 rounded-full">
    <div className="w-full h-full border-3 border-[#f0fd2d] rounded-full" />
  </div>
);

export const UserInput: React.FC<UserInputProps> = ({
  icon = <DefaultIcon />,
  type,
  label,
  placeholder,
  value,
  error,
  onChange,
  soundType = SoundType.CLICK,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { play } = useAudio();

  const handleWrapperClick = () => {
    inputRef.current?.focus();
    play(soundType);
  };

  return (
    <div
      onClick={handleWrapperClick}
      className={cn(
        'relative col-span-2 grid grid-cols-subgrid items-center py-1 pl-2 pr-6 group/input transition-colors duration-300',
        'before:absolute before:inset-0 before:-z-10 before:bg-black/20 before:transition-colors before:duration-300',
        'before:[clip-path:polygon(0.5rem_0,100%_0,100%_calc(100%-0.5rem),calc(100%-0.5rem)_100%,0_100%,0_0.5rem)]',
        'hover:before:bg-black/40'
      )}
    >
      <div className="flex items-center gap-2">
        <label className="shrink-0">{icon}</label>
        <label className="font-medium shrink-0 text-lg whitespace-nowrap">{label}</label>
      </div>
      <div className="relative flex-1">
        <input
          ref={inputRef}
          type={type === 'password' && showPassword ? 'text' : type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="block w-full outline-0 border-none bg-transparent text-sm pt-0.5 pb-1.5 ml-1 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
        />
        {type === 'password' && (
          <ButtonWithAudio
            type="button"
            className="absolute right-0 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors cursor-pointer z-10"
            onClick={(e) => {
              e.stopPropagation();
              setShowPassword(!showPassword);
            }}
          >
            {showPassword ? <VisibleIcon /> : <InVisibleIcon />}
          </ButtonWithAudio>
        )}

        {/* 底部边框底层 */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-[#f0fd2d]" />

        {/* 底部边框上层动画 */}
        <div
          className={cn(
            'absolute bottom-0 left-0 h-px transition-all duration-300 ease-out',
            isFocused || value || error ? 'w-full' : 'w-0 group-hover/input:w-full',

            // 颜色逻辑优先级：
            // 1. 聚焦 -> 紫红色
            // 2. 有内容 && 有错误 -> 红色
            // 3. 有内容 && 无错误 -> 绿色
            // 4. (隐式 else: 无内容 && 不聚焦) -> hover时显示深一点的黄色
            isFocused ? 'bg-[#ff1aac]' : error ? 'bg-red-500' : value ? 'bg-[#01ffa2]' : 'bg-[#e79003]'
          )}
        />
      </div>
    </div>
  );
};
