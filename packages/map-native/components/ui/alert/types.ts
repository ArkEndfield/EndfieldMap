export interface NativeAlertConfig {
  content: string;
  dismissible?: boolean;
  hideCancel?: boolean;
  cancelText?: string;
  confirmText?: string;
  onDismiss?: () => boolean | void | Promise<boolean | void>;
  onCancel?: () => boolean | void | Promise<boolean | void>;
  onConfirm?: () => boolean | void | Promise<boolean | void>;
}

export interface NativePromptConfig extends Omit<NativeAlertConfig, 'onConfirm'> {
  defaultValue?: string;
  placeholder?: string;
  onConfirm?: (value: string) => boolean | void | Promise<boolean | void>;
}

export interface AlertInstance {
  id: string;
  config: NativeAlertConfig;
  visible: boolean;
  isPrompt?: boolean;
  promptDefaultValue?: string;
  promptPlaceholder?: string;
}
