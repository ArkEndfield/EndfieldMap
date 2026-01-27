import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 合并class
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
