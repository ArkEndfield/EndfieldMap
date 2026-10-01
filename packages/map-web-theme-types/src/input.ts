import type { HTMLInputTypeAttribute } from 'react';

import { type SoundType } from './audio';

export interface InputProps {
  disabled?: boolean;
  soundType?: SoundType;
  placeholder?: string;
  defaultValue?: string;
  inputType?: HTMLInputTypeAttribute | 'textarea';
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  inputClassName?: string;
  className?: string;
  onValueChange?: (value: string) => void;
  content?: React.ReactNode;
  rows?: number;
  cols?: number;
  /**
   * 是否自动聚焦。默认 true —— 该组件最早只服务于「弹窗里唯一一个输入框」的场景。
   * 同一页面放多个输入框时必须显式关掉，否则它们会互相抢焦点。
   */
  autoFocus?: boolean;
  /** 受控值。传了就以外部状态为准，不再使用内部 state。 */
  value?: string;
}
