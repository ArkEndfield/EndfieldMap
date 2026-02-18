/**
 * 音效配置
 * 定义所有可用的音效及其文件路径
 */

import { service } from '@/services';

const { audio: audioUrl } = service.assetService.url;

export enum SoundType {
  CLICK = 'click',
  CLAIM = 'claim',
  TICK = 'tick',
  PRIZE_CONFIRM = 'prizeConfirm',
  RESERVE_CLICK = 'reserveClick',
  CLOSE_CLICK = 'closeClick',
  NEWS_CATE_CLICK = 'newsCateClick',
  CHAR_LIST_ENTER = 'charListEnter',

  EXPLORING_GACHA_INTERFACE = 'exploringGachaInterface',
}

export interface AudioConfig {
  path: string;
  volume?: number; // 0.0 到 1.0，默认 1.0
  preload?: boolean; // 是否预加载此音效，默认 true
}

/**
 * 音效文件配置
 * 将音效类型映射到其文件路径和设置
 */
export const AUDIO_CONFIG: Record<SoundType, AudioConfig> = {
  [SoundType.CLICK]: {
    path: `${audioUrl}/common_click.wav`,
    volume: 1,
    preload: true,
  },
  [SoundType.CLAIM]: {
    path: `${audioUrl}/claim.wav`,
    volume: 1,
    preload: true,
  },
  [SoundType.TICK]: {
    path: `${audioUrl}/roulette_tick.wav`,
    volume: 1,
    preload: true,
  },
  [SoundType.PRIZE_CONFIRM]: {
    path: `${audioUrl}/prize_confirm.wav`,
    volume: 1,
    preload: true,
  },
  [SoundType.RESERVE_CLICK]: {
    path: `${audioUrl}/reserve_click.mp3`,
    volume: 1,
    preload: true,
  },
  [SoundType.CLOSE_CLICK]: {
    path: `${audioUrl}/close_click.mp3`,
    volume: 1,
    preload: true,
  },
  [SoundType.NEWS_CATE_CLICK]: {
    path: `${audioUrl}/news_cate_click.mp3`,
    volume: 1,
    preload: true,
  },
  [SoundType.CHAR_LIST_ENTER]: {
    path: `${audioUrl}/char_list_enter.mp3`,
    volume: 1,
    preload: true,
  },
  [SoundType.EXPLORING_GACHA_INTERFACE]: {
    path: `${audioUrl}/exploring_gacha_interface.mp3`,
    volume: 1,
    preload: false,
  },
};

/**
 * 全局音效设置
 */
export const AUDIO_SETTINGS = {
  DEFAULT_VOLUME: 1.0,
  ENABLE_AUDIO: true,
  CACHE_ENABLED: true,
} as const;
