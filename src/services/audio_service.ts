/**
 * 音效服务
 * 管理音效加载、缓存和播放
 */

import { action, observable, runInAction } from 'mobx';

import { AUDIO_CONFIG, AUDIO_SETTINGS, SoundType } from '@/const/audio_config';
import { logger } from '@endfieldmap/tools';

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

  /**
   * 初始化音频上下文并预加载音效
   */
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
        // 创建 AudioContext（延迟初始化）
        this.audioContext = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

        // 预加载所有标记为需要预加载的音效
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

  /**
   * 加载音效文件并缓存
   */
  private async loadSound(soundType: SoundType): Promise<void> {
    // 如果已经在加载中，返回现有的 Promise
    if (this.loadingPromises.has(soundType)) {
      return this.loadingPromises.get(soundType);
    }

    // 如果已经缓存，立即返回
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

        // logger.log(`[AudioService] 已加载音效: ${soundType}`);
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

  /**
   * 播放音效
   */
  public async play(
    soundType: SoundType,
    options?: {
      volume?: number; // 覆盖此次播放的音量
      loop?: boolean; // 循环播放
      rate?: number; // 播放速率（默认 1.0）
    }
  ): Promise<AudioBufferSourceNode | null> {
    if (!this.enabled) {
      return null;
    }

    try {
      // 确保音频上下文已初始化
      if (!this.audioContext) {
        await this.initialize();
      }

      // 如果音频上下文被暂停，恢复它（由于浏览器自动播放策略）
      if (this.audioContext!.state === 'suspended') {
        await this.audioContext!.resume();
      }

      // 如果未缓存，加载音效
      if (!this.audioCache.has(soundType)) {
        await this.loadSound(soundType);
      }

      const audioInstance = this.audioCache.get(soundType);
      if (!audioInstance) {
        throw new Error(`音效 "${soundType}" 未在缓存中找到`);
      }

      // 创建源节点
      const source = this.audioContext!.createBufferSource();
      source.buffer = audioInstance.buffer;

      // 创建增益节点用于音量控制
      const gainNode = this.audioContext!.createGain();
      const volume = options?.volume ?? audioInstance.config.volume ?? 1.0;
      gainNode.gain.value = volume * this.masterVolume;

      // 连接节点
      source.connect(gainNode);
      gainNode.connect(this.audioContext!.destination);

      // 应用选项
      if (options?.loop) {
        source.loop = true;
      }
      if (options?.rate) {
        source.playbackRate.value = options.rate;
      }

      // 播放音效
      source.start(0);

      return source;
    } catch (error) {
      console.error(`[AudioService] 播放音效 "${soundType}" 失败:`, error);
      return null;
    }
  }

  /**
   * 设置主音量 (0.0 到 1.0)
   */
  @action
  public setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * 获取当前主音量
   */
  public getMasterVolume(): number {
    return this.masterVolume;
  }

  /**
   * 启用或禁用所有音效
   */
  @action
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * 检查音效是否启用
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * 预加载特定音效
   */
  public async preload(soundTypes: SoundType[]): Promise<void> {
    const promises = soundTypes.map((type) => this.loadSound(type));
    await Promise.all(promises);
  }

  /**
   * 清空音效缓存（释放内存）
   */
  public clearCache(): void {
    this.audioCache.clear();
    logger.log('[AudioService] 缓存已清空');
  }

  /**
   * 获取缓存状态
   */
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

// 直接导出实例（遵循项目模式）
const audioService = new AudioService();

export default audioService;
