/**
 * Common Utilities
 * 
 * This module provides common utility functions for use across web and mobile platforms.
 */

/**
 * Debounce a function call
 * @param fn Function to debounce
 * @param delay Delay in ms
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return function (...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

/**
 * Throttle a function call
 * @param fn Function to throttle
 * @param limit Limit in ms
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastArgs: Parameters<T> | undefined;
  
  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
        
        if (lastArgs) {
          fn(...lastArgs);
          lastArgs = undefined;
        }
      }, limit);
    } else {
      lastArgs = args;
    }
  };
}

/**
 * Deep clone an object
 * @param obj Object to clone
 * @returns Cloned object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any;
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as any;
  }
  
  if (obj instanceof Object) {
    const copy: any = {};
    
    Object.entries(obj).forEach(([key, value]) => {
      copy[key] = deepClone(value);
    });
    
    return copy;
  }
  
  return obj;
}

/**
 * Deep merge two objects
 * @param target Target object
 * @param source Source object
 * @returns Merged object
 */
export function deepMerge<T extends Record<string, any>, U extends Record<string, any>>(
  target: T,
  source: U
): T & U {
  const output = { ...target } as T & U;
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  
  return output;
}

/**
 * Check if a value is an object
 * @param value Value to check
 * @returns True if the value is an object
 */
export function isObject(value: any): value is Record<string, any> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Format a date
 * @param date Date to format
 * @param format Format string (e.g., 'YYYY-MM-DD')
 * @returns Formatted date string
 */
export function formatDate(date: Date, format: string = 'YYYY-MM-DD'): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * Generate a random ID
 * @param length Length of the ID
 * @returns Random ID
 */
export function generateId(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Format a number as currency
 * @param amount Amount to format
 * @param currency Currency code (ISO 4217)
 * @param locale Locale (e.g., 'en-US')
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a number with commas
 * @param number Number to format
 * @returns Formatted number string
 */
export function formatNumberWithCommas(number: number): string {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Parse a query string
 * @param queryString Query string to parse
 * @returns Parsed query params
 */
export function parseQueryString(queryString: string): Record<string, string> {
  if (!queryString || queryString === '?') {
    return {};
  }
  
  const query = queryString.startsWith('?') ? queryString.substring(1) : queryString;
  const pairs = query.split('&');
  const result: Record<string, string> = {};
  
  pairs.forEach(pair => {
    const [key, value] = pair.split('=');
    result[decodeURIComponent(key)] = decodeURIComponent(value || '');
  });
  
  return result;
}

/**
 * Convert an object to a query string
 * @param params Params to convert
 * @returns Query string
 */
export function toQueryString(params: Record<string, any>): string {
  return Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
}

/**
 * Capitalize a string
 * @param str String to capitalize
 * @returns Capitalized string
 */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Truncate a string
 * @param str String to truncate
 * @param length Maximum length
 * @param suffix Suffix to append if truncated
 * @returns Truncated string
 */
export function truncate(str: string, length: number, suffix: string = '...'): string {
  if (!str) return str;
  if (str.length <= length) return str;
  return str.substring(0, length) + suffix;
}

/**
 * Check if two arrays are equal
 * @param arr1 First array
 * @param arr2 Second array
 * @returns True if the arrays are equal
 */
export function arraysEqual<T>(arr1: T[], arr2: T[]): boolean {
  if (arr1.length !== arr2.length) {
    return false;
  }
  
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }
  
  return true;
}

/**
 * Group an array by a key
 * @param arr Array to group
 * @param keyFn Function to get the key
 * @returns Grouped array
 */
export function groupBy<T, K extends string | number | symbol>(
  arr: T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  return arr.reduce((result, item) => {
    const key = keyFn(item);
    
    if (!result[key]) {
      result[key] = [];
    }
    
    result[key].push(item);
    
    return result;
  }, {} as Record<K, T[]>);
}

/**
 * Chunk an array into smaller arrays
 * @param arr Array to chunk
 * @param size Chunk size
 * @returns Chunked array
 */
export function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  
  return result;
}

/**
 * Sleep for a specified duration
 * @param ms Duration in milliseconds
 * @returns Promise that resolves after the duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a random number between min and max
 * @param min Minimum value (inclusive)
 * @param max Maximum value (exclusive)
 * @returns Random number
 */
export function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min)) + min;
}

/**
 * Pick specific properties from an object
 * @param obj Object to pick from
 * @param keys Keys to pick
 * @returns New object with picked properties
 */
export function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  return keys.reduce((result, key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
    return result;
  }, {} as Pick<T, K>);
}

/**
 * Omit specific properties from an object
 * @param obj Object to omit from
 * @param keys Keys to omit
 * @returns New object without omitted properties
 */
export function omit<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj } as any;
  
  keys.forEach(key => {
    delete result[key];
  });
  
  return result as Omit<T, K>;
}