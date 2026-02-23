import { type ReactNode } from 'react';

export interface DialogProps {
  open: boolean;
  title?: string;
  icon?: ReactNode;
  onOpenChange?: (open: boolean) => void;
  dismissible?: boolean;
  width?: string;
  height?: string;
  children?: ReactNode;
  className?: string;
  classNames?: {
    backdrop?: string | ((open?: boolean) => string);
    alert?: string | ((open?: boolean) => string);
    contentContainer?: string | ((open?: boolean) => string);
    header?: string | ((open?: boolean) => string);
    footer?: string | ((open?: boolean) => string);
    close?: string | ((open?: boolean) => string);
  };
  onDismiss?: () => boolean | void | Promise<boolean | void>;
  onClose?: () => boolean | void | Promise<boolean | void>;
  keyboardCloseable?: boolean;
}
