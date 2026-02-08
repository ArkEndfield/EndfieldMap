import { SoundType } from '@/const/audio_config';

export interface InputProps {
  disabled?: boolean;
  soundType?: SoundType;
  placeholder?: string;
  defaultValue?: string;
  inputType?: string;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  inputClassName?: string;
  onValueChange: (value: string) => void;
  content?: React.ReactNode;
}
