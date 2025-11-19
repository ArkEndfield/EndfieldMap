import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 合并class
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
