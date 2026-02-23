import { type AudioConfig, SoundType } from '@endfieldmap/map-web-theme-types/audio';

let audioBaseUrl = '/audio';

export function setAudioBaseUrl(url: string) {
  audioBaseUrl = url;
}

export function getAudioBaseUrl() {
  return audioBaseUrl;
}

export const AUDIO_CONFIG: Record<SoundType, AudioConfig> = {
  [SoundType.CLICK]: {
    get path() {
      return `${audioBaseUrl}/common_click.wav`;
    },
    volume: 1,
    preload: true,
  },
  [SoundType.CLAIM]: {
    get path() {
      return `${audioBaseUrl}/claim.wav`;
    },
    volume: 1,
    preload: true,
  },
  [SoundType.TICK]: {
    get path() {
      return `${audioBaseUrl}/roulette_tick.wav`;
    },
    volume: 1,
    preload: true,
  },
  [SoundType.PRIZE_CONFIRM]: {
    get path() {
      return `${audioBaseUrl}/prize_confirm.wav`;
    },
    volume: 1,
    preload: true,
  },
  [SoundType.RESERVE_CLICK]: {
    get path() {
      return `${audioBaseUrl}/reserve_click.mp3`;
    },
    volume: 1,
    preload: true,
  },
  [SoundType.CLOSE_CLICK]: {
    get path() {
      return `${audioBaseUrl}/close_click.mp3`;
    },
    volume: 1,
    preload: true,
  },
  [SoundType.NEWS_CATE_CLICK]: {
    get path() {
      return `${audioBaseUrl}/news_cate_click.mp3`;
    },
    volume: 1,
    preload: true,
  },
  [SoundType.CHAR_LIST_ENTER]: {
    get path() {
      return `${audioBaseUrl}/char_list_enter.mp3`;
    },
    volume: 1,
    preload: true,
  },
  [SoundType.EXPLORING_GACHA_INTERFACE]: {
    get path() {
      return `${audioBaseUrl}/exploring_gacha_interface.mp3`;
    },
    volume: 1,
    preload: false,
  },
};

export const AUDIO_SETTINGS = {
  DEFAULT_VOLUME: 1.0,
  ENABLE_AUDIO: true,
  CACHE_ENABLED: true,
} as const;
