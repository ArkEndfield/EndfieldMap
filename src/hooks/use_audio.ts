/**
 * useAudio Hook
 * 提供在 React 组件中便捷访问音效播放的功能
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { SoundType } from '@/const/audio_config';
import audioService from '@/services/audio_service';

interface UseAudioOptions {
  /**
   * 是否在挂载时自动初始化音效服务
   * @default true
   */
  autoInitialize?: boolean;
  /**
   * 音量覆盖 (0.0 到 1.0)
   */
  volume?: number;
  /**
   * 播放速率
   * @default 1.0
   */
  rate?: number;
  /**
   * 是否循环播放
   * @default false
   */
  loop?: boolean;
}

interface UseAudioReturn {
  /**
   * 播放音效
   */
  play: (soundType: SoundType, options?: UseAudioOptions) => Promise<void>;
  /**
   * 停止此 hook 启动的所有音效
   */
  stopAll: () => void;
  /**
   * 音效是否已启用 (MobX observable)
   */
  isEnabled: boolean;
  /**
   * 切换音效开关
   */
  toggleAudio: () => void;
  /**
   * 当前主音量 (0.0 到 1.0, MobX observable)
   */
  masterVolume: number;
  /**
   * 设置主音量 (0.0 到 1.0)
   */
  setMasterVolume: (volume: number) => void;
  /**
   * 音效服务是否已初始化 (MobX observable)
   */
  isInitialized: boolean;
}

/**
 * 用于播放音效的 Hook
 * 使用 audioService 的 MobX observables 进行响应式状态管理
 * @param options - 配置选项
 * @returns 音效控制函数和状态
 */
export function useAudio(options: UseAudioOptions = {}): UseAudioReturn {
  const { autoInitialize = true } = options;

  // 跟踪正在播放的音源，以便停止它们
  const playingSources = useRef<AudioBufferSourceNode[]>([]);

  // 初始化音效服务
  useEffect(() => {
    if (autoInitialize && !audioService.initialized) {
      audioService.initialize();
    }
  }, [autoInitialize]);

  // 卸载时清理：停止此 hook 启动的所有音效
  useEffect(() => {
    return () => {
      playingSources.current.forEach((source) => {
        try {
          source.stop();
        } catch {
          // 忽略已停止的错误
        }
      });
      playingSources.current = [];
    };
  }, []);

  /**
   * 播放音效
   */
  const play = useCallback(
    async (soundType: SoundType, playOptions?: UseAudioOptions) => {
      const source = await audioService.play(soundType, {
        volume: playOptions?.volume ?? options.volume,
        rate: playOptions?.rate ?? options.rate,
        loop: playOptions?.loop ?? options.loop,
      });

      if (source) {
        playingSources.current.push(source);

        // 播放结束时从数组中移除
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

  /**
   * 停止此 hook 启动的所有音效
   */
  const stopAll = useCallback(() => {
    playingSources.current.forEach((source) => {
      try {
        source.stop();
      } catch {
        // 忽略已停止的错误
      }
    });
    playingSources.current = [];
  }, []);

  /**
   * 切换音效开关
   */
  const toggleAudio = useCallback(() => {
    audioService.setEnabled(!audioService.enabled);
  }, []);

  /**
   * 设置主音量
   */
  const setMasterVolume = useCallback((volume: number) => {
    audioService.setMasterVolume(volume);
  }, []);

  return {
    play,
    stopAll,
    // 直接返回 observable 属性 - 使用此 hook 的组件
    // 应该用 observer() 包装以响应变化
    isEnabled: audioService.enabled,
    toggleAudio,
    masterVolume: audioService.masterVolume,
    setMasterVolume,
    isInitialized: audioService.initialized,
  };
}

/**
 * 用于播放特定音效的 Hook
 * 当组件只需要一个音效时很有用
 * @param soundType - 要播放的音效
 * @param options - 配置选项
 */
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
        // 忽略已停止的错误
      }
    }
  }, []);

  // 卸载时清理
  useEffect(() => {
    return () => {
      if (sourceRef.current) {
        try {
          sourceRef.current.stop();
        } catch {
          // 忽略错误
        }
      }
    };
  }, []);

  return { play, stop, isPlaying };
}

/**
 * 用于按钮点击音效的 Hook
 * 返回一个播放音效的 onClick 处理函数
 */
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
