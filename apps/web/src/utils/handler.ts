import type { FieldErrors, FieldValues } from 'react-hook-form';

import { alert } from '@/components/common/alert/alert_api';
import { service } from '@/services';

/**
 * 捕获函数执行过程中的错误，并显示错误提示
 * @template T - 函数返回值类型
 * @param func - 要执行的函数，可以是同步或异步函数
 * @param onError - 可选的错误回调函数，在显示错误提示后执行
 * @returns 如果执行成功返回函数结果，如果出错返回 false
 *
 * @example
 * // 异步函数
 * const result = await catchErrorWithTip(async () => fetchData());
 * // result 类型: Data | false
 *
 * // 带错误回调（用于乐观更新回滚）
 * const result = await catchErrorWithTip(
 *   async () => likePreset(id),
 *   () => revertOptimisticUpdate(id)
 * );
 */
export const catchErrorWithTip = async <T>(
  func: () => T | Promise<T>,
  onError?: (error: unknown) => void
): Promise<T | false> => {
  try {
    const result = await func();
    return result;
  } catch (error: unknown) {
    // 执行错误回调（如乐观更新回滚）
    onError?.(error);

    if (error instanceof Error) {
      alert.info(
        service.i18nService.translate(error.message, {
          defaultValue: error.message,
        })
      );
    } else {
      alert.info(
        service.i18nService.translate('user.unknown_error', {
          defaultValue: '未知错误',
        })
      );
    }
    return false;
  }
};

/**
 * 捕获表单验证错误
 * @param errors - 表单验证错误
 */
export const onFormInvalid = <T extends FieldValues = FieldValues>(errors: FieldErrors<T>) => {
  const firstError = Object.values(errors)[0];
  if (firstError?.message && typeof firstError.message === 'string') {
    alert.info(
      service.i18nService.translate(`schema.${firstError.message}`, {
        defaultValue: firstError.message,
        ns: 'error',
      }) as unknown as string
    );
  }
};
