export interface InputProps {
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
