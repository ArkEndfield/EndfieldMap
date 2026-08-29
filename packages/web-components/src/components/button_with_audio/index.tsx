import { SoundType } from '@endfieldmap/map-web-theme-types/audio';
import { useAudio } from '@endfieldmap/web-components/hooks/use_audio';
import { type ComponentProps, forwardRef, type MouseEvent } from 'react';

export interface ButtonWithAudioProps extends ComponentProps<'button'> {
  soundType?: SoundType;
}

export const ButtonWithAudio = forwardRef<HTMLButtonElement, ButtonWithAudioProps>(
  ({ onClick, soundType = SoundType.CLICK, ...props }, ref) => {
    const { play } = useAudio();

    const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
      play(soundType);
      onClick?.(e);
    };

    return <button ref={ref} onClick={handleClick} {...props} />;
  }
);

ButtonWithAudio.displayName = 'ButtonWithAudio';
