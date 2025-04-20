/**
 * Shared Validation Utilities
 * Common validation functions for both web and mobile platforms
 */

/**
 * Validates an email address
 * @param email Email address to validate
 * @returns True if the email is valid
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  
  // RFC 5322 compliant email regex
  const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return emailRegex.test(email);
}

/**
 * Validates a phone number
 * @param phone Phone number to validate
 * @returns True if the phone number is valid
 */
export function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  
  // Remove non-numeric characters for validation
  const digits = phone.replace(/\D/g, '');
  
  // Check for valid formats:
  // - 10 digits (standard US number)
  // - 11 digits starting with 1 (US with country code)
  return (digits.length === 10) || (digits.length === 11 && digits.charAt(0) === '1');
}

/**
 * Password strength options
 */
interface PasswordOptions {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
}

/**
 * Password validation result
 */
interface PasswordValidationResult {
  isValid: boolean;
  strength: 'weak' | 'medium' | 'strong' | 'very-strong';
  missing: string[];
  score: number;
}

/**
 * Validates a password and returns detailed info about its strength
 * @param password Password to validate
 * @param options Validation options
 */
export function validatePassword(
  password: string,
  options: PasswordOptions = {}
): PasswordValidationResult {
  const opts = {
    minLength: options.minLength || 8,
    requireUppercase: options.requireUppercase !== false,
    requireLowercase: options.requireLowercase !== false,
    requireNumbers: options.requireNumbers !== false,
    requireSpecialChars: options.requireSpecialChars !== false,
  };
  
  // Check various password criteria
  const hasMinLength = password.length >= opts.minLength;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[^A-Za-z0-9]/.test(password);
  
  // Calculate score and collect missing criteria
  let score = 0;
  const missing: string[] = [];
  
  if (hasMinLength) score++;
  else missing.push(`at least ${opts.minLength} characters`);
  
  if (hasUppercase || !opts.requireUppercase) score++;
  else missing.push('uppercase letter');
  
  if (hasLowercase || !opts.requireLowercase) score++;
  else missing.push('lowercase letter');
  
  if (hasNumbers || !opts.requireNumbers) score++;
  else missing.push('number');
  
  if (hasSpecialChars || !opts.requireSpecialChars) score++;
  else missing.push('special character');
  
  // Add bonus points for length
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  
  // Determine strength
  let strength: 'weak' | 'medium' | 'strong' | 'very-strong';
  if (score <= 2) strength = 'weak';
  else if (score <= 4) strength = 'medium';
  else if (score <= 6) strength = 'strong';
  else strength = 'very-strong';
  
  // Validity requires all mandatory criteria to be met
  const isValid = missing.length === 0;
  
  return {
    isValid,
    strength,
    missing,
    score
  };
}

/**
 * Credit card type detection and validation
 */
export type CreditCardType = 
  | 'visa'
  | 'mastercard' 
  | 'amex' 
  | 'discover' 
  | 'dinersclub' 
  | 'jcb' 
  | 'unknown';

/**
 * Card type patterns
 */
const CARD_PATTERNS = {
  visa: /^4[0-9]{12}(?:[0-9]{3})?$/,
  mastercard: /^5[1-5][0-9]{14}$/,
  amex: /^3[47][0-9]{13}$/,
  discover: /^6(?:011|5[0-9]{2})[0-9]{12}$/,
  dinersclub: /^3(?:0[0-5]|[68][0-9])[0-9]{11}$/,
  jcb: /^(?:2131|1800|35\d{3})\d{11}$/
};

/**
 * Determines the credit card type
 * @param cardNumber Credit card number
 * @returns The card type or 'unknown'
 */
export function getCreditCardType(cardNumber: string): CreditCardType {
  // Remove spaces and dashes
  const normalizedNumber = cardNumber.replace(/[\s-]/g, '');
  
  for (const [type, pattern] of Object.entries(CARD_PATTERNS)) {
    if (pattern.test(normalizedNumber)) {
      return type as CreditCardType;
    }
  }
  
  return 'unknown';
}

/**
 * Validates a credit card number using Luhn algorithm and card type patterns
 * @param cardNumber Credit card number
 * @returns True if the card number is valid
 */
export function isValidCreditCard(cardNumber: string): boolean {
  if (!cardNumber) return false;
  
  // Remove spaces and dashes
  const normalizedNumber = cardNumber.replace(/[\s-]/g, '');
  
  // Check if the number matches any known card type pattern
  const cardType = getCreditCardType(normalizedNumber);
  if (cardType === 'unknown') return false;
  
  // Luhn algorithm validation
  let sum = 0;
  let shouldDouble = false;
  
  // Walk through the card number in reverse
  for (let i = normalizedNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(normalizedNumber.charAt(i));
    
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  
  return (sum % 10) === 0;
}

/**
 * Validates a date string
 * @param dateStr Date string in format YYYY-MM-DD
 * @returns True if the date is valid
 */
export function isValidDate(dateStr: string): boolean {
  // Check format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  
  // Parse the date parts to integers
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  
  // Check the ranges of month and day
  if (year < 1000 || year > 3000 || month < 1 || month > 12) return false;
  
  const monthLength = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  
  // Adjust for leap years
  if (year % 400 === 0 || (year % 100 !== 0 && year % 4 === 0)) {
    monthLength[1] = 29;
  }
  
  return day > 0 && day <= monthLength[month - 1];
}

/**
 * Validates a URL
 * @param url URL to validate
 * @returns True if the URL is valid
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch (e) {
    return false;
  }
}

/**
 * Validates a postal/zip code
 * @param code Postal code to validate
 * @param countryCode ISO country code (default 'US')
 * @returns True if the postal code is valid
 */
export function isValidPostalCode(code: string, countryCode = 'US'): boolean {
  if (!code) return false;
  
  // Different formats for different countries
  switch (countryCode.toUpperCase()) {
    case 'US':
      return /^\d{5}(-\d{4})?$/.test(code);
    case 'CA':
      return /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(code);
    case 'UK':
    case 'GB':
      return /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i.test(code);
    default:
      // Default validation - at least 3 characters
      return code.length >= 3;
  }
}