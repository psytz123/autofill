/**
 * Shared Validation Utilities
 * Common validation functions for consistent form validation across platforms
 */

// Email validation with support for Unicode characters
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  
  // This regex allows Unicode characters in local part
  // It covers most valid email formats, including international domains
  const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  return emailRegex.test(email);
}

// Phone number validation (10 digits, with or without formatting)
export function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  
  // Strip all non-numeric characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Check if we have a valid US number (10 digits or 11 digits starting with 1)
  return (digitsOnly.length === 10) || 
         (digitsOnly.length === 11 && digitsOnly.charAt(0) === '1');
}

// Password strength validation
export interface PasswordValidationOptions {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
}

export interface PasswordValidationResult {
  isValid: boolean;
  strength: 'weak' | 'medium' | 'strong' | 'very-strong';
  missing: string[];
}

export function validatePassword(
  password: string,
  options: PasswordValidationOptions = {}
): PasswordValidationResult {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = true,
  } = options;
  
  const missing: string[] = [];
  
  // Check minimum length
  if (password.length < minLength) {
    missing.push(`at least ${minLength} characters`);
  }
  
  // Check for uppercase letters
  if (requireUppercase && !/[A-Z]/.test(password)) {
    missing.push('uppercase letter');
  }
  
  // Check for lowercase letters
  if (requireLowercase && !/[a-z]/.test(password)) {
    missing.push('lowercase letter');
  }
  
  // Check for numbers
  if (requireNumbers && !/[0-9]/.test(password)) {
    missing.push('number');
  }
  
  // Check for special characters
  if (requireSpecialChars && !/[^A-Za-z0-9]/.test(password)) {
    missing.push('special character');
  }
  
  // Determine password strength
  let strength: 'weak' | 'medium' | 'strong' | 'very-strong';
  
  if (missing.length > 2) {
    strength = 'weak';
  } else if (missing.length > 0) {
    strength = 'medium';
  } else if (password.length < 12) {
    strength = 'strong';
  } else {
    strength = 'very-strong';
  }
  
  return {
    isValid: missing.length === 0,
    strength,
    missing,
  };
}

// Credit card validation helper
export function isValidCreditCard(cardNumber: string): boolean {
  if (!cardNumber) return false;
  
  // Remove all non-digit characters
  const digitsOnly = cardNumber.replace(/\D/g, '');
  
  // Check length (most cards are 13-19 digits)
  if (digitsOnly.length < 13 || digitsOnly.length > 19) {
    return false;
  }
  
  // Luhn algorithm (credit card checksum)
  let sum = 0;
  let shouldDouble = false;
  
  // Loop from right to left
  for (let i = digitsOnly.length - 1; i >= 0; i--) {
    let digit = parseInt(digitsOnly.charAt(i), 10);
    
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  
  return sum % 10 === 0;
}

// Credit card type detection
export type CardType = 
  | 'visa'
  | 'mastercard'
  | 'amex'
  | 'discover'
  | 'dinersclub'
  | 'jcb'
  | 'unknown';

export function getCreditCardType(cardNumber: string): CardType {
  if (!cardNumber) return 'unknown';
  
  // Remove all non-digit characters
  const digitsOnly = cardNumber.replace(/\D/g, '');
  
  // Visa
  if (/^4/.test(digitsOnly)) {
    return 'visa';
  }
  
  // Mastercard
  if (/^5[1-5]/.test(digitsOnly) || /^2[2-7]/.test(digitsOnly)) {
    return 'mastercard';
  }
  
  // American Express
  if (/^3[47]/.test(digitsOnly)) {
    return 'amex';
  }
  
  // Discover
  if (/^6(?:011|5)/.test(digitsOnly)) {
    return 'discover';
  }
  
  // Diners Club
  if (/^3(?:0[0-5]|[68])/.test(digitsOnly)) {
    return 'dinersclub';
  }
  
  // JCB
  if (/^35/.test(digitsOnly)) {
    return 'jcb';
  }
  
  return 'unknown';
}

// ZIP/Postal code validation (simple US validation)
export function isValidZipCode(zipCode: string, country = 'US'): boolean {
  if (!zipCode) return false;
  
  // Different formats for different countries
  if (country === 'US') {
    // US zip codes: 5 digits or 5+4 format
    return /^\d{5}(-\d{4})?$/.test(zipCode);
  } else if (country === 'CA') {
    // Canadian postal codes: A1A 1A1 format
    return /^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$/.test(zipCode);
  } else if (country === 'UK') {
    // UK postcodes: Various formats
    return /^[A-Z]{1,2}[0-9R][0-9A-Z]? [0-9][A-Z]{2}$/i.test(zipCode);
  }
  
  // For other countries, just ensure it's not empty
  return zipCode.trim().length > 0;
}

// Vehicle license plate validation (basic format check)
export function isValidLicensePlate(plate: string, stateOrCountry = 'any'): boolean {
  if (!plate) return false;
  
  // Remove whitespace
  const trimmedPlate = plate.trim();
  
  // Basic validation: minimum length and no invalid characters
  if (trimmedPlate.length < 2 || trimmedPlate.length > 10) {
    return false;
  }
  
  // Only allow alphanumeric characters and hyphens
  if (!/^[A-Za-z0-9-]+$/.test(trimmedPlate)) {
    return false;
  }
  
  // For specific states, we could add more precise validation rules
  // For now, just return true if it passes the basic checks
  return true;
}

// URL validation
export function isValidUrl(url: string): boolean {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

// Empty or whitespace check
export function isEmptyOrWhitespace(str: string | null | undefined): boolean {
  return !str || str.trim() === '';
}

// Check if a number is within a range
export function isWithinRange(
  num: number,
  min: number,
  max: number,
  inclusive = true
): boolean {
  if (inclusive) {
    return num >= min && num <= max;
  } else {
    return num > min && num < max;
  }
}

// Check if a string is a valid number
export function isValidNumber(value: string): boolean {
  if (isEmptyOrWhitespace(value)) return false;
  return !isNaN(Number(value));
}

// Check if a string contains only letters
export function containsOnlyLetters(value: string): boolean {
  if (isEmptyOrWhitespace(value)) return false;
  return /^[A-Za-z]+$/.test(value);
}

// Check if a string contains only digits
export function containsOnlyDigits(value: string): boolean {
  if (isEmptyOrWhitespace(value)) return false;
  return /^\d+$/.test(value);
}

// Check if a string is a valid date
export function isValidDate(dateStr: string): boolean {
  if (isEmptyOrWhitespace(dateStr)) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

// Check if a date is in the future
export function isFutureDate(date: Date | string | number): boolean {
  const dateToCheck = typeof date === 'object' ? date : new Date(date);
  const now = new Date();
  return dateToCheck > now;
}

// Check if a date is in the past
export function isPastDate(date: Date | string | number): boolean {
  const dateToCheck = typeof date === 'object' ? date : new Date(date);
  const now = new Date();
  return dateToCheck < now;
}