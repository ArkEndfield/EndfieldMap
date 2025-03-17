import { useI18n } from 'vue-i18n';

/**
 * 格式化日期，返回本地化的字符串
 * @param date 要格式化的日期
 * @param format 格式类型，可选 'short' 或 'long'
 * @returns 格式化后的日期字符串
 */
export function formatDate(
  date: Date | string | number,
  format: 'short' | 'long' = 'short'
): string {
  const { d } = useI18n();

  // 确保date是Date类型
  const dateObj = date instanceof Date ? date : new Date(date);

  return d(dateObj, format);
}

/**
 * 计算相对时间（例如：5分钟前）
 * @param date 要计算的日期
 * @returns 相对时间字符串
 */
export function formatRelativeTime(date: Date | string | number): string {
  const { t } = useI18n();

  const now = new Date();
  const dateObj = date instanceof Date ? date : new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  // 刚刚
  if (diffInSeconds < 5) {
    return t('date.format.just_now');
  }

  // 秒前
  if (diffInSeconds < 60) {
    return t('date.format.seconds_ago', [diffInSeconds]);
  }

  // 分钟前
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return t('date.format.minutes_ago', [diffInMinutes]);
  }

  // 小时前
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return t('date.format.hours_ago', [diffInHours]);
  }

  // 天前
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return t('date.format.days_ago', [diffInDays]);
  }

  // 周前
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return t('date.format.weeks_ago', [diffInWeeks]);
  }

  // 月前
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return t('date.format.months_ago', [diffInMonths]);
  }

  // 年前
  const diffInYears = Math.floor(diffInDays / 365);
  return t('date.format.years_ago', [diffInYears]);
}

/**
 * 示例：使用自定义格式
 * @param date 要格式化的日期
 * @param formatString 格式字符串
 * @returns 格式化后的日期字符串
 */
export function formatCustomDate(
  date: Date | string | number,
  formatString: string
): string {
  const { locale } = useI18n();
  const dateObj = date instanceof Date ? date : new Date(date);

  // 根据当前语言设置不同的格式
  if (locale.value.startsWith('zh')) {
    return formatChineseDate(dateObj, formatString);
  }

  // 其他语言使用英文格式
  return formatEnglishDate(dateObj, formatString);
}

/**
 * 中文日期格式化
 */
function formatChineseDate(date: Date, formatString: string): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  // 替换格式字符串中的占位符
  return formatString
    .replace('YYYY', year.toString())
    .replace('MM', month.toString().padStart(2, '0'))
    .replace('DD', day.toString().padStart(2, '0'))
    .replace('HH', hours.toString().padStart(2, '0'))
    .replace('mm', minutes.toString().padStart(2, '0'))
    .replace('ss', seconds.toString().padStart(2, '0'));
}

/**
 * 英文日期格式化
 */
function formatEnglishDate(date: Date, formatString: string): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  // 替换格式字符串中的占位符
  return formatString
    .replace('YYYY', year.toString())
    .replace('MM', month.toString().padStart(2, '0'))
    .replace('DD', day.toString().padStart(2, '0'))
    .replace('HH', hours.toString().padStart(2, '0'))
    .replace('mm', minutes.toString().padStart(2, '0'))
    .replace('ss', seconds.toString().padStart(2, '0'));
}
