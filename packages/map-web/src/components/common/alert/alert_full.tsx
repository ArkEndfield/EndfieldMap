import { type ZmdAlertFullProps } from '@themes/types/alert';
import { observer } from 'mobx-react-lite';
import { Suspense, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import shortcutService from '@/services/shortcut';
import uiManager from '@/services/ui_manager';

const AlertFullRenderer = observer((props: ZmdAlertFullProps) => {
  const AlertFullComponent = uiManager.ThemedComponents.alert.AlertFull;

  if (!AlertFullComponent) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <AlertFullComponent {...props} />
    </Suspense>
  );
});

export const ZmdAlertFull = ({
  onDismiss = () => {},
  onCancel = () => {},
  onClose = () => {},
  onConfirm = () => {},
  loading = false,
  dismissible = true,
  keyboardCloseable,
  ...props
}: ZmdAlertFullProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

  // Logic Handlers
  const handleClose = () => {
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
  };

  const handleDismiss = () => {
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
  };

  const handleKeyboardClose = () => {
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
  };

  const handleCancel = () => {
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
  };

  const handleConfirm = () => {
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
  };

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
  }, [props.open, dismissible, keyboardCloseable, isProcessing]);

  return createPortal(
    <AlertFullRenderer
      {...props}
      dismissible={dismissible}
      loading={loading || isProcessing}
      onDismiss={handleDismiss}
      onCancel={handleCancel}
      onClose={handleClose}
      onConfirm={handleConfirm}
    />,
    document.body
  );
};

export type { ZmdAlertFullProps };
