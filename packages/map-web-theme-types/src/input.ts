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
  onValueChange?: (value: string) => void;
  content?: React.ReactNode;
  rows?: number;
  cols?: number;
}
