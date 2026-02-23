import { logger } from '@endfieldmap/tools';
import { SoundType } from '@endfieldmap/map-web-theme-types/audio';
import { action, observable, runInAction } from 'mobx';

import { AUDIO_CONFIG, AUDIO_SETTINGS } from './audio_config';

interface AudioInstance {
  buffer: AudioBuffer;
  config: (typeof AUDIO_CONFIG)[SoundType];
}

class AudioService {
  private audioContext: AudioContext | null = null;
  private audioCache: Map<SoundType, AudioInstance> = new Map();
  private loadingPromises: Map<SoundType, Promise<void>> = new Map();
  private initializationPromise: Promise<void> | null = null;

  @observable accessor masterVolume: number = AUDIO_SETTINGS.DEFAULT_VOLUME;
  @observable accessor enabled: boolean = AUDIO_SETTINGS.ENABLE_AUDIO;
  @observable accessor initialized: boolean = false;

  @action
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = (async () => {
      try {
        this.audioContext = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

        const preloadPromises: Promise<void>[] = [];
        for (const [soundType, config] of Object.entries(AUDIO_CONFIG)) {
          if (config.preload !== false) {
            preloadPromises.push(this.loadSound(soundType as SoundType));
          }
        }

        await Promise.all(preloadPromises);
        runInAction(() => {
          this.initialized = true;
        });

        logger.log('[AudioService] 已初始化并预加载音效');
      } catch (error) {
        logger.error('[AudioService] 初始化失败:', error);
      } finally {
        this.initializationPromise = null;
      }
    })();

    return this.initializationPromise;
  }

  private async loadSound(soundType: SoundType): Promise<void> {
    if (this.loadingPromises.has(soundType)) {
      return this.loadingPromises.get(soundType);
    }

    if (this.audioCache.has(soundType)) {
      return Promise.resolve();
    }

    const config = AUDIO_CONFIG[soundType];
    if (!config) {
      throw new Error(`音效类型 "${soundType}" 在配置中未找到`);
    }

    const loadPromise = (async () => {
      try {
        const response = await fetch(config.path);
        if (!response.ok) {
          throw new Error(`获取音效失败: ${config.path}`);
        }

        const arrayBuffer = await response.arrayBuffer();

        if (!this.audioContext) {
          await this.initialize();
        }

        const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);

        this.audioCache.set(soundType, {
          buffer: audioBuffer,
          config,
        });
      } catch (error) {
        logger.error(`[AudioService] 加载音效 "${soundType}" 失败:`, error);
        throw error;
      } finally {
        this.loadingPromises.delete(soundType);
      }
    })();

    this.loadingPromises.set(soundType, loadPromise);
    return loadPromise;
  }

  public async play(
    soundType: SoundType,
    options?: {
      volume?: number;
      loop?: boolean;
      rate?: number;
    }
  ): Promise<AudioBufferSourceNode | null> {
    if (!this.enabled) {
      return null;
    }

    try {
      if (!this.audioContext) {
        await this.initialize();
      }

      if (this.audioContext!.state === 'suspended') {
        await this.audioContext!.resume();
      }

      if (!this.audioCache.has(soundType)) {
        await this.loadSound(soundType);
      }

      const audioInstance = this.audioCache.get(soundType);
      if (!audioInstance) {
        throw new Error(`音效 "${soundType}" 未在缓存中找到`);
      }

      const source = this.audioContext!.createBufferSource();
      source.buffer = audioInstance.buffer;

      const gainNode = this.audioContext!.createGain();
      const volume = options?.volume ?? audioInstance.config.volume ?? 1.0;
      gainNode.gain.value = volume * this.masterVolume;

      source.connect(gainNode);
      gainNode.connect(this.audioContext!.destination);

      if (options?.loop) {
        source.loop = true;
      }
      if (options?.rate) {
        source.playbackRate.value = options.rate;
      }

      source.start(0);

      return source;
    } catch (error) {
      console.error(`[AudioService] 播放音效 "${soundType}" 失败:`, error);
      return null;
    }
  }

  @action
  public setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  public getMasterVolume(): number {
    return this.masterVolume;
  }

  @action
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public async preload(soundTypes: SoundType[]): Promise<void> {
    const promises = soundTypes.map((type) => this.loadSound(type));
    await Promise.all(promises);
  }

  public clearCache(): void {
    this.audioCache.clear();
    logger.log('[AudioService] 缓存已清空');
  }

  public getCacheStatus(): {
    cached: SoundType[];
    total: number;
    size: number;
  } {
    return {
      cached: Array.from(this.audioCache.keys()),
      total: Object.keys(AUDIO_CONFIG).length,
      size: this.audioCache.size,
    };
  }
}

export const audioService = new AudioService();
