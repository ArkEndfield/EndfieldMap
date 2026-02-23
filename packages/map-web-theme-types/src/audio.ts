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
