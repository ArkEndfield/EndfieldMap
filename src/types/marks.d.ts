export interface MarkInfoDetail {
  finish: boolean;
}

export type MarkInfo = Record<string | number, MarkInfoDetail>;

export type MarkFilterType = 'all' | 'marked' | 'unmarked';

export type MarkChangeCallback = () => void;
