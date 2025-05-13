
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as currency
 */
export function formatCurrency(value: number, options?: Intl.NumberFormatOptions): string {
  const defaultOptions = { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  };

  const mergedOptions = { ...defaultOptions, ...options };
  
  return new Intl.NumberFormat('en-US', mergedOptions).format(value);
}

/**
 * Format a number as percentage
 */
export function formatPercent(value: number, options?: Intl.NumberFormatOptions): string {
  const defaultOptions = { 
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  };

  const mergedOptions = { ...defaultOptions, ...options };
  
  return new Intl.NumberFormat('en-US', mergedOptions).format(value / 100);
}

/**
 * Debounce a function call
 */
export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}
