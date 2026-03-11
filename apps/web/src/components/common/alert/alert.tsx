import type { ZmdAlertProps } from '@endfieldmap/map-web-theme-types/alert';
import { shortcutService, useWindow } from '@endfieldmap/web-components';
import { observer } from 'mobx-react-lite';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import uiManager from '@/services/ui_manager';
import { useTranslation } from 'react-i18next';

const AlertRenderer = observer((props: ZmdAlertProps) => {
  const AlertComponent = uiManager.ThemedComponents.alert.Alert;

  if (!AlertComponent) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <AlertComponent {...props} />
    </Suspense>
  );
});

export const ZmdAlert = ({
  onDismiss = () => {},
  onCancel = () => {},
  onClose = () => {},
  onConfirm = () => {},
  loading = false,
  dismissible = true,
  keyboardCloseable,
  confirmText,
  cancelText,
  ...props
}: ZmdAlertProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const currentWindow = useWindow();
  const { t } = useTranslation();

  // Logic Handlers
  const handleClose = useCallback(() => {
    if (isProcessing) return;

    const result = onClose();
    if (result instanceof Promise) {
      setIsProcessing(true);
      result
        .then((res) => {
          setIsProcessing(false);
          if (res !== false) {
            props.onOpenChange?.(false);
          }
        })
        .catch(() => {
          setIsProcessing(false);
        });
    } else if (result !== false) {
      props.onOpenChange?.(false);
    }
  }, [isProcessing, onClose, props]);

  const handleDismiss = useCallback(() => {
    if (!dismissible || isProcessing) return;

    const result = onDismiss();
    if (result instanceof Promise) {
      setIsProcessing(true);
      result
        .then((res) => {
          setIsProcessing(false);
          if (res !== false) {
            handleClose();
          }
        })
        .catch(() => {
          setIsProcessing(false);
        });
    } else if (result !== false) {
      handleClose();
    }
  }, [dismissible, isProcessing, onDismiss, handleClose]);

  const handleKeyboardClose = useCallback(() => {
    if (isProcessing) return;

    // If keyboardCloseable is explicitly set, use it. Otherwise, fall back to dismissible behavior
    const shouldAllowKeyboardClose = keyboardCloseable !== undefined ? keyboardCloseable : dismissible;
    if (!shouldAllowKeyboardClose) return;

    const result = onDismiss();
    if (result instanceof Promise) {
      setIsProcessing(true);
      result
        .then((res) => {
          setIsProcessing(false);
          if (res !== false) {
            handleClose();
          }
        })
        .catch(() => {
          setIsProcessing(false);
        });
    } else if (result !== false) {
      handleClose();
    }
  }, [isProcessing, keyboardCloseable, dismissible, onDismiss, handleClose]);

  const handleCancel = useCallback(() => {
    if (isProcessing) return;

    const result = onCancel();
    if (result instanceof Promise) {
      setIsProcessing(true);
      result
        .then((res) => {
          setIsProcessing(false);
          if (res !== false) {
            handleClose();
          }
        })
        .catch(() => {
          setIsProcessing(false);
        });
    } else if (result !== false) {
      handleClose();
    }
  }, [isProcessing, onCancel, handleClose]);

  const handleConfirm = useCallback(() => {
    if (isProcessing) return;

    const result = onConfirm();
    if (result instanceof Promise) {
      setIsProcessing(true);
      result
        .then((res) => {
          setIsProcessing(false);
          if (res !== false) {
            handleClose();
          }
        })
        .catch(() => {
          setIsProcessing(false);
        });
    } else if (result !== false) {
      handleClose();
    }
  }, [isProcessing, onConfirm, handleClose]);

  useEffect(() => {
    // If keyboardCloseable is provided, use it. Otherwise, use dismissible.
    const shouldListen = keyboardCloseable !== undefined ? keyboardCloseable : dismissible;

    if (!props.open || !shouldListen) return;
    const dispose = shortcutService.register('Escape', (e: KeyboardEvent) => {
      e.preventDefault();
      handleKeyboardClose();
      return true;
    });
    return () => dispose();
  }, [props.open, dismissible, keyboardCloseable, isProcessing, handleKeyboardClose]);

  return createPortal(
    <AlertRenderer
      {...props}
      confirmText={confirmText || t('confirm')}
      cancelText={cancelText || t('cancel')}
      dismissible={dismissible}
      loading={loading || isProcessing}
      onDismiss={handleDismiss}
      onCancel={handleCancel}
      onClose={handleClose}
      onConfirm={handleConfirm}
    />,
    currentWindow.document.body
  );
};
