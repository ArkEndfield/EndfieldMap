import { useCallback, useEffect, useRef, useState } from 'react';

import { SoundType } from '@endfieldmap/map-web-theme-types/audio';
import audioService from '../services/audio_service';

interface UseAudioOptions {
  autoInitialize?: boolean;
  volume?: number;
  rate?: number;
  loop?: boolean;
}

interface UseAudioReturn {
  play: (soundType: SoundType, options?: UseAudioOptions) => Promise<void>;
  stopAll: () => void;
  isEnabled: boolean;
  toggleAudio: () => void;
  masterVolume: number;
  setMasterVolume: (volume: number) => void;
  isInitialized: boolean;
}

export function useAudio(options: UseAudioOptions = {}): UseAudioReturn {
  const { autoInitialize = true } = options;

  const playingSources = useRef<AudioBufferSourceNode[]>([]);

  useEffect(() => {
    if (autoInitialize && !audioService.initialized) {
      audioService.initialize();
    }
  }, [autoInitialize]);

  useEffect(() => {
    return () => {
      playingSources.current.forEach((source) => {
        try {
          source.stop();
        } catch {
          // ignore
        }
      });
      playingSources.current = [];
    };
  }, []);

  const play = useCallback(
    async (soundType: SoundType, playOptions?: UseAudioOptions) => {
      const source = await audioService.play(soundType, {
        volume: playOptions?.volume ?? options.volume,
        rate: playOptions?.rate ?? options.rate,
        loop: playOptions?.loop ?? options.loop,
      });

      if (source) {
        playingSources.current.push(source);

        source.onended = () => {
          const index = playingSources.current.indexOf(source);
          if (index > -1) {
            playingSources.current.splice(index, 1);
          }
        };
      }
    },
    [options.volume, options.rate, options.loop]
  );

  const stopAll = useCallback(() => {
    playingSources.current.forEach((source) => {
      try {
        source.stop();
      } catch {
        // ignore
      }
    });
    playingSources.current = [];
  }, []);

  const toggleAudio = useCallback(() => {
    audioService.setEnabled(!audioService.enabled);
  }, []);

  const setMasterVolume = useCallback((volume: number) => {
    audioService.setMasterVolume(volume);
  }, []);

  return {
    play,
    stopAll,
    isEnabled: audioService.enabled,
    toggleAudio,
    masterVolume: audioService.masterVolume,
    setMasterVolume,
    isInitialized: audioService.initialized,
  };
}

export function useSound(
  soundType: SoundType,
  options: UseAudioOptions = {}
): {
  play: () => Promise<void>;
  stop: () => void;
  isPlaying: boolean;
} {
  const [isPlaying, setIsPlaying] = useState(false);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  const play = useCallback(async () => {
    const source = await audioService.play(soundType, {
      volume: options.volume,
      rate: options.rate,
      loop: options.loop,
    });

    if (source) {
      sourceRef.current = source;
      setIsPlaying(true);

      source.onended = () => {
        setIsPlaying(false);
        sourceRef.current = null;
      };
    }
  }, [soundType, options.volume, options.rate, options.loop]);

  const stop = useCallback(() => {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
        setIsPlaying(false);
        sourceRef.current = null;
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      if (sourceRef.current) {
        try {
          sourceRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return { play, stop, isPlaying };
}

export function useButtonSound(
  soundType: SoundType = SoundType.CLICK,
  options: UseAudioOptions = {}
): {
  onClick: () => void;
  play: () => Promise<void>;
} {
  const { play } = useAudio(options);

  const onClick = useCallback(() => {
    play(soundType);
  }, [play, soundType]);

  const playSound = useCallback(() => {
    return play(soundType);
  }, [play, soundType]);

  return {
    onClick,
    play: playSound,
  };
}
