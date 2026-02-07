import { alert } from '@/components/common/alert/alert_api';
import i18n from '@/i18n';

/**
 * 捕获函数执行过程中的错误，并显示错误提示
 * @template T - 函数返回值类型
 * @param func - 要执行的函数，可以是同步或异步函数
 * @returns 如果执行成功返回函数结果，如果出错返回 undefined
 *
 * @example
 * // 异步函数
 * const result = await catchErrorWithTip(async () => fetchData());
 * // result 类型: Data | undefined
 *
 * // 同步函数
 * const value = await catchErrorWithTip(() => computeValue());
 * // value 类型: number | undefined
 */
export const catchErrorWithTip = async <T>(func: () => T | Promise<T>): Promise<T | undefined> => {
  try {
    const result = await func();
    return result;
  } catch (error: unknown) {
    if (error instanceof Error) {
      alert.info(
        i18n.t(error.message, {
          defaultValue: error.message,
        })
      );
    } else {
      alert.info(
        i18n.t('user.unknown_error', {
          defaultValue: '未知错误',
        })
      );
    }
    return undefined;
  }
};

/**
 * 捕获表单验证错误
 * @param errors - 表单验证错误
 */
export const onFormInvalid = <T>(errors: FieldErrors<T>) => {
  const firstError = Object.values(errors)[0];
  if (firstError?.message) {
    alert.info(firstError.message);
  }
};
