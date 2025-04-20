/**
 * Shared Utils Index
 * Exports all shared utilities for use in web and mobile platforms
 */

// Re-export all utilities from their respective modules
export * from './api-client';
export * from './analytics';
export * from './error-handling';
export * from './validation';

// Export additional utility functions

/**
 * Format a currency amount for display
 * @param amount Amount to format (in the smallest currency unit, e.g. cents)
 * @param currency Currency code (default: USD)
 * @param locale Locale for formatting (default: en-US)
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number, 
  currency: string = 'USD', 
  locale: string = 'en-US'
): string {
  // Convert amount from cents to dollars
  const dollars = amount / 100;
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);
}

/**
 * Format a date for display
 * @param date Date to format (Date object or ISO string)
 * @param format Format style ('full', 'long', 'medium', 'short')
 * @param locale Locale for formatting (default: en-US)
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string,
  format: 'full' | 'long' | 'medium' | 'short' = 'medium',
  locale: string = 'en-US'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Use Intl.DateTimeFormat for consistent formatting across platforms
  return new Intl.DateTimeFormat(locale, {
    dateStyle: format,
  }).format(dateObj);
}

/**
 * Format a time for display
 * @param date Date to format (Date object or ISO string)
 * @param format Format style ('full', 'long', 'medium', 'short')
 * @param locale Locale for formatting (default: en-US)
 * @returns Formatted time string
 */
export function formatTime(
  date: Date | string,
  format: 'full' | 'long' | 'medium' | 'short' = 'short',
  locale: string = 'en-US'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Use Intl.DateTimeFormat for consistent formatting across platforms
  return new Intl.DateTimeFormat(locale, {
    timeStyle: format,
  }).format(dateObj);
}

/**
 * Format a date and time for display
 * @param date Date to format (Date object or ISO string)
 * @param dateFormat Format style for date ('full', 'long', 'medium', 'short')
 * @param timeFormat Format style for time ('full', 'long', 'medium', 'short')
 * @param locale Locale for formatting (default: en-US)
 * @returns Formatted date and time string
 */
export function formatDateTime(
  date: Date | string,
  dateFormat: 'full' | 'long' | 'medium' | 'short' = 'medium',
  timeFormat: 'full' | 'long' | 'medium' | 'short' = 'short',
  locale: string = 'en-US'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Use Intl.DateTimeFormat for consistent formatting across platforms
  return new Intl.DateTimeFormat(locale, {
    dateStyle: dateFormat,
    timeStyle: timeFormat,
  }).format(dateObj);
}

/**
 * Format a phone number for display
 * @param phone Phone number to format (string of digits)
 * @param format Format style ('national', 'international')
 * @param countryCode Country code for formatting (default: 'US')
 * @returns Formatted phone number string
 */
export function formatPhoneNumber(
  phone: string,
  format: 'national' | 'international' = 'national',
  countryCode: string = 'US'
): string {
  // Simple formatting for US numbers (XXX) XXX-XXXX
  if (countryCode === 'US') {
    // Remove non-digits
    const digits = phone.replace(/\D/g, '');
    
    // Handle different lengths
    if (digits.length === 10) {
      if (format === 'national') {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
      } else {
        return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
      }
    } else if (digits.length === 11 && digits[0] === '1') {
      if (format === 'national') {
        return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
      } else {
        return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
      }
    }
  }
  
  // For other countries, just return as-is with country code if international
  return format === 'international' ? `+${countryCode} ${phone}` : phone;
}

/**
 * Format a file size for display
 * @param bytes Size in bytes
 * @param decimals Number of decimal places (default: 2)
 * @returns Formatted file size string (e.g. "1.5 MB")
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Generate a unique ID
 * @param length Length of the ID (default: 16)
 * @returns Unique ID string
 */
export function generateId(length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = chars.length;
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * charactersLength));
  }
  
  return result;
}

/**
 * Deep clone an object or array
 * @param obj Object to clone
 * @returns Deep clone of the object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  // Handle Date
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any;
  }
  
  // Handle Array
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as any;
  }
  
  // Handle Object
  const cloned: Record<string, any> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone((obj as Record<string, any>)[key]);
    }
  }
  
  return cloned as T;
}

/**
 * Debounce a function
 * @param fn Function to debounce
 * @param delay Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function(...args: Parameters<T>): void {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle a function
 * @param fn Function to throttle
 * @param limit Limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  let lastFunc: NodeJS.Timeout;
  let lastRan: number;
  
  return function(...args: Parameters<T>): void {
    if (!inThrottle) {
      fn(...args);
      lastRan = Date.now();
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          fn(...args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}

/**
 * Check if a value is empty (null, undefined, empty string, empty array, empty object)
 * @param value Value to check
 * @returns True if the value is empty
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) {
    return true;
  }
  
  if (typeof value === 'string' || Array.isArray(value)) {
    return value.length === 0;
  }
  
  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }
  
  return false;
}

/**
 * Truncate a string to a maximum length
 * @param str String to truncate
 * @param maxLength Maximum length (default: 50)
 * @param suffix Suffix to add if truncated (default: '...')
 * @returns Truncated string
 */
export function truncate(
  str: string,
  maxLength: number = 50,
  suffix: string = '...'
): string {
  if (!str || str.length <= maxLength) {
    return str;
  }
  
  return `${str.slice(0, maxLength - suffix.length)}${suffix}`;
}

/**
 * Convert a number to a string with ordinal suffix (1st, 2nd, 3rd, etc.)
 * @param n Number to convert
 * @returns String with ordinal suffix
 */
export function toOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Group an array of objects by a key
 * @param array Array to group
 * @param key Key to group by
 * @returns Object with groups
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    result[groupKey] = result[groupKey] || [];
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

/**
 * Sort an array of objects by a key
 * @param array Array to sort
 * @param key Key to sort by
 * @param order Sort order ('asc' or 'desc')
 * @returns Sorted array
 */
export function sortBy<T>(
  array: T[],
  key: keyof T,
  order: 'asc' | 'desc' = 'asc'
): T[] {
  const sorted = [...array].sort((a, b) => {
    const aValue = a[key];
    const bValue = b[key];
    
    if (aValue < bValue) {
      return order === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return order === 'asc' ? 1 : -1;
    }
    return 0;
  });
  
  return sorted;
}

/**
 * Capitalize the first letter of each word in a string
 * @param str String to capitalize
 * @returns Capitalized string
 */
export function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, char => char.toUpperCase());
}

/**
 * Convert an object to query string parameters
 * @param params Object to convert
 * @returns Query string
 */
export function toQueryString(params: Record<string, any>): string {
  return Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return value
          .map(item => `${encodeURIComponent(key)}=${encodeURIComponent(item)}`)
          .join('&');
      }
      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    })
    .join('&');
}

/**
 * Parse query string parameters to an object
 * @param queryString Query string to parse
 * @returns Parsed object
 */
export function parseQueryString(queryString: string): Record<string, string | string[]> {
  // Remove leading ? if present
  const query = queryString.startsWith('?') ? queryString.slice(1) : queryString;
  
  if (!query) {
    return {};
  }
  
  return query.split('&').reduce((params, param) => {
    const [key, value] = param.split('=').map(decodeURIComponent);
    
    // Handle array parameters (e.g., ids[]=1&ids[]=2)
    if (key.endsWith('[]')) {
      const arrayKey = key.slice(0, -2);
      params[arrayKey] = [...(params[arrayKey] || []) as string[], value];
    } else if (params[key]) {
      // Convert to array if parameter appears multiple times
      params[key] = Array.isArray(params[key])
        ? [...(params[key] as string[]), value]
        : [params[key] as string, value];
    } else {
      params[key] = value;
    }
    
    return params;
  }, {} as Record<string, string | string[]>);
}

/**
 * Encode HTML entities in a string
 * @param str String to encode
 * @returns Encoded string
 */
export function encodeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Calculate the distance between two coordinates in kilometers
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export function getDistanceInKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}