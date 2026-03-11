import type { FieldErrors, FieldValues } from 'react-hook-form';

import { alertApi } from '@/components/ui/alert';
import { service } from '@/services/map-service';

/**
 * Catches errors from async functions and displays them as alert tips.
 * Returns the result on success, or false on error.
 */
export const catchErrorWithTip = async <T>(
  func: () => T | Promise<T>,
  onError?: (error: unknown) => void
): Promise<T | false> => {
  try {
    const result = await func();
    return result;
  } catch (error: unknown) {
    console.error('[catchErrorWithTip]', error);
    onError?.(error);

    if (error instanceof Error) {
      alertApi.info(
        service.i18nService.translate(error.message, {
          defaultValue: error.message,
        })
      );
    } else {
      alertApi.info(
        service.i18nService.translate('user.unknown_error', {
          defaultValue: '未知错误',
        })
      );
    }
    return false;
  }
};

/**
 * Handles form validation errors by showing the first error message in an alert.
 */
export const onFormInvalid = <T extends FieldValues = FieldValues>(errors: FieldErrors<T>) => {
  const firstError = Object.values(errors)[0];
  if (firstError?.message && typeof firstError.message === 'string') {
    alertApi.info(
      service.i18nService.translate(`schema.${firstError.message}`, {
        defaultValue: firstError.message,
        ns: 'error',
      }) as unknown as string
    );
  }
};
