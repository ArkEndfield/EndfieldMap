import type { ReactNode } from 'react';

export interface ZmdAlertProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  dismissible?: boolean;
  hideCancel?: boolean;
  cancelText?: string;
  confirmText?: string;
  loading?: boolean;
  showIcon?: boolean;
  width?: string;
  height?: string;
  children?: ReactNode;
  classNames?: {
    backdrop?: string | ((open?: boolean) => string);
    alert?: string | ((open?: boolean) => string);
    content?: string | ((open?: boolean) => string);
  };
  onDismiss?: () => boolean | void | Promise<boolean | void>;
  onCancel?: () => boolean | void | Promise<boolean | void>;
  onClose?: () => boolean | void | Promise<boolean | void>;
  onConfirm?: () => boolean | void | Promise<boolean | void>;
  keyboardCloseable?: boolean;
}

export interface ZmdAlertFullProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  dismissible?: boolean;
  hideCancel?: boolean;
  cancelText?: string;
  confirmText?: string;
  loading?: boolean;
  showIcon?: boolean;
  height?: string;
  children?: ReactNode;
  onDismiss?: () => boolean | void | Promise<boolean | void>;
  onCancel?: () => boolean | void | Promise<boolean | void>;
  onClose?: () => boolean | void | Promise<boolean | void>;
  onConfirm?: () => boolean | void | Promise<boolean | void>;
  keyboardCloseable?: boolean;
}
