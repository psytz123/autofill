/**
 * Shared Formatting Utilities
 * Common functions for formatting data consistently across web and mobile platforms
 */

// Currency formatting options
export interface CurrencyFormatOptions {
  locale?: string;
  currency?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  showSymbol?: boolean;
}

/**
 * Format a number as currency
 */
export function formatCurrency(
  amount: number,
  options: CurrencyFormatOptions = {}
): string {
  const {
    locale = 'en-US',
    currency = 'USD',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    showSymbol = true,
  } = options;

  const formatter = new Intl.NumberFormat(locale, {
    style: showSymbol ? 'currency' : 'decimal',
    currency: showSymbol ? currency : undefined,
    minimumFractionDigits,
    maximumFractionDigits,
  });

  return formatter.format(amount);
}

/**
 * Format a decimal number with specific precision
 */
export function formatDecimal(
  value: number,
  minimumFractionDigits = 0,
  maximumFractionDigits = 2
): string {
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits,
    maximumFractionDigits,
  });

  return formatter.format(value);
}

/**
 * Date formatting options
 */
export interface DateFormatOptions {
  locale?: string;
  format?: 'full' | 'long' | 'medium' | 'short' | 'custom';
  customFormat?: Intl.DateTimeFormatOptions;
  includeTime?: boolean;
}

/**
 * Format a date
 */
export function formatDate(date: Date | string | number, options: DateFormatOptions = {}): string {
  const {
    locale = 'en-US',
    format = 'medium',
    customFormat,
    includeTime = false,
  } = options;

  // Convert to Date object if string or number
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;

  // Get format options based on the format parameter
  let formatOptions: Intl.DateTimeFormatOptions;
  
  switch (format) {
    case 'full':
      formatOptions = { dateStyle: 'full' } as Intl.DateTimeFormatOptions;
      break;
    case 'long':
      formatOptions = { dateStyle: 'long' } as Intl.DateTimeFormatOptions;
      break;
    case 'medium':
      formatOptions = { dateStyle: 'medium' } as Intl.DateTimeFormatOptions;
      break;
    case 'short':
      formatOptions = { dateStyle: 'short' } as Intl.DateTimeFormatOptions;
      break;
    case 'custom':
      formatOptions = customFormat || { year: 'numeric', month: 'short', day: 'numeric' };
      break;
    default:
      formatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  }

  // Add time options if requested
  if (includeTime) {
    if (format !== 'custom' || !customFormat?.timeStyle) {
      formatOptions = {
        ...formatOptions,
        timeStyle: 'short',
      } as Intl.DateTimeFormatOptions;
    }
  }

  // Format the date
  try {
    const formatter = new Intl.DateTimeFormat(locale, formatOptions);
    return formatter.format(dateObj);
  } catch (error) {
    // Fallback to simple formatting if Intl fails
    return dateObj.toLocaleString();
  }
}

/**
 * Format a relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(
  date: Date | string | number,
  now: Date = new Date()
): string {
  // Convert to Date object if string or number
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;

  const diffMs = now.getTime() - dateObj.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);
  const diffWeek = Math.round(diffDay / 7);
  const diffMonth = Math.round(diffDay / 30);
  const diffYear = Math.round(diffDay / 365);

  if (diffSec < 60) {
    return diffSec <= 5 ? 'just now' : `${diffSec} seconds ago`;
  } else if (diffMin < 60) {
    return diffMin === 1 ? '1 minute ago' : `${diffMin} minutes ago`;
  } else if (diffHour < 24) {
    return diffHour === 1 ? '1 hour ago' : `${diffHour} hours ago`;
  } else if (diffDay < 7) {
    return diffDay === 1 ? 'yesterday' : `${diffDay} days ago`;
  } else if (diffWeek < 4) {
    return diffWeek === 1 ? '1 week ago' : `${diffWeek} weeks ago`;
  } else if (diffMonth < 12) {
    return diffMonth === 1 ? '1 month ago' : `${diffMonth} months ago`;
  } else {
    return diffYear === 1 ? '1 year ago' : `${diffYear} years ago`;
  }
}

/**
 * Format a phone number to (XXX) XXX-XXXX format
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Check if the number has 10 digits (US phone number)
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  // If it has 11 digits and starts with 1 (US country code)
  if (cleaned.length === 11 && cleaned.charAt(0) === '1') {
    return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  // For other formats, just return in blocks
  if (cleaned.length > 4) {
    // Group in blocks of 3-3-4 or whatever is available
    const lastFour = cleaned.slice(-4);
    const secondGroup = cleaned.slice(-7, -4);
    const firstGroup = cleaned.slice(0, -7);
    
    if (firstGroup && secondGroup) {
      return `${firstGroup}-${secondGroup}-${lastFour}`;
    } else if (secondGroup) {
      return `${secondGroup}-${lastFour}`;
    }
    
    return lastFour;
  }
  
  // If it's a short number, return as is
  return cleaned;
}

/**
 * Format a file size with units (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format an address
 */
export function formatAddress(
  address: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  },
  singleLine = false
): string {
  const { street, city, state, zipCode, country } = address;
  
  if (singleLine) {
    let addressParts = [];
    if (street) addressParts.push(street);
    
    let cityStateZip = '';
    if (city) cityStateZip += city;
    if (state) cityStateZip += cityStateZip ? `, ${state}` : state;
    if (zipCode) cityStateZip += cityStateZip ? ` ${zipCode}` : zipCode;
    
    if (cityStateZip) addressParts.push(cityStateZip);
    if (country) addressParts.push(country);
    
    return addressParts.join(', ');
  } else {
    let line1 = street || '';
    let line2 = '';
    
    if (city) line2 += city;
    if (state) line2 += line2 ? `, ${state}` : state;
    if (zipCode) line2 += line2 ? ` ${zipCode}` : zipCode;
    
    let lines = [line1, line2];
    if (country) lines.push(country);
    
    return lines.filter(Boolean).join('\n');
  }
}

/**
 * Truncate text with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return `${text.substring(0, maxLength - 3)}...`;
}

/**
 * Format distance in miles or kilometers
 */
export interface DistanceFormatOptions {
  unit?: 'imperial' | 'metric';
  precision?: number;
  includeUnit?: boolean;
  spaceBetween?: boolean;
}

export function formatDistance(
  miles: number,
  options: DistanceFormatOptions = {}
): string {
  const {
    unit = 'imperial',
    precision = 1,
    includeUnit = true,
    spaceBetween = true,
  } = options;
  
  let value: number;
  let unitLabel: string;
  
  if (unit === 'metric') {
    // Convert miles to kilometers
    value = miles * 1.60934;
    unitLabel = 'km';
  } else {
    value = miles;
    unitLabel = 'mi';
  }
  
  // Format the number with specified precision
  const formattedValue = value.toFixed(precision);
  // Remove trailing zeros and decimal point if not needed
  const cleanValue = formattedValue.replace(/\.0+$/, '');
  
  if (includeUnit) {
    return `${cleanValue}${spaceBetween ? ' ' : ''}${unitLabel}`;
  } else {
    return cleanValue;
  }
}