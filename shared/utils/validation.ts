/**
 * Validation Utilities
 * 
 * This module provides data validation utilities for use across web and mobile platforms.
 */

import { ValidationError } from './error-handling';

/**
 * Validation result
 */
export interface ValidationResult<T> {
  valid: boolean;
  value: T | undefined;
  errors?: Record<string, string>;
}

/**
 * Validation schema
 */
export interface ValidationSchema<T> {
  validate(data: unknown): ValidationResult<T>;
}

/**
 * Validate data against a schema
 * @param data Data to validate
 * @param schema Validation schema
 * @param errorMessage Custom error message
 * @returns Validated data
 * @throws ValidationError if validation fails
 */
export function validateData<T>(
  data: unknown,
  schema: ValidationSchema<T>,
  errorMessage: string = 'Validation failed'
): T {
  const result = schema.validate(data);
  
  if (!result.valid || result.value === undefined) {
    throw new ValidationError(errorMessage, {
      fieldErrors: result.errors,
    });
  }
  
  return result.value;
}

/**
 * Validator functions
 */
export const Validators = {
  /**
   * Check if a value is defined (not undefined or null)
   * @param value Value to check
   * @param message Custom error message
   * @returns True if the value is defined
   */
  required: (value: any, message: string = 'This field is required'): string | true => {
    return value !== undefined && value !== null && value !== '' ? true : message;
  },
  
  /**
   * Check if a value is a string
   * @param value Value to check
   * @param message Custom error message
   * @returns True if the value is a string
   */
  string: (value: any, message: string = 'Must be a string'): string | true => {
    return typeof value === 'string' ? true : message;
  },
  
  /**
   * Check if a value is a number
   * @param value Value to check
   * @param message Custom error message
   * @returns True if the value is a number
   */
  number: (value: any, message: string = 'Must be a number'): string | true => {
    return typeof value === 'number' && !isNaN(value) ? true : message;
  },
  
  /**
   * Check if a value is a boolean
   * @param value Value to check
   * @param message Custom error message
   * @returns True if the value is a boolean
   */
  boolean: (value: any, message: string = 'Must be a boolean'): string | true => {
    return typeof value === 'boolean' ? true : message;
  },
  
  /**
   * Check if a value is an array
   * @param value Value to check
   * @param message Custom error message
   * @returns True if the value is an array
   */
  array: (value: any, message: string = 'Must be an array'): string | true => {
    return Array.isArray(value) ? true : message;
  },
  
  /**
   * Check if a value is an object
   * @param value Value to check
   * @param message Custom error message
   * @returns True if the value is an object
   */
  object: (value: any, message: string = 'Must be an object'): string | true => {
    return typeof value === 'object' && value !== null && !Array.isArray(value) ? true : message;
  },
  
  /**
   * Check if a string matches a minimum length
   * @param min Minimum length
   * @param message Custom error message
   * @returns Validator function
   */
  minLength: (min: number, message?: string) => {
    return (value: string): string | true => {
      return value.length >= min ? true : message || `Must be at least ${min} characters`;
    };
  },
  
  /**
   * Check if a string matches a maximum length
   * @param max Maximum length
   * @param message Custom error message
   * @returns Validator function
   */
  maxLength: (max: number, message?: string) => {
    return (value: string): string | true => {
      return value.length <= max ? true : message || `Must be at most ${max} characters`;
    };
  },
  
  /**
   * Check if a number is at least a minimum value
   * @param min Minimum value
   * @param message Custom error message
   * @returns Validator function
   */
  min: (min: number, message?: string) => {
    return (value: number): string | true => {
      return value >= min ? true : message || `Must be at least ${min}`;
    };
  },
  
  /**
   * Check if a number is at most a maximum value
   * @param max Maximum value
   * @param message Custom error message
   * @returns Validator function
   */
  max: (max: number, message?: string) => {
    return (value: number): string | true => {
      return value <= max ? true : message || `Must be at most ${max}`;
    };
  },
  
  /**
   * Check if a string matches a pattern
   * @param pattern Regular expression pattern
   * @param message Custom error message
   * @returns Validator function
   */
  pattern: (pattern: RegExp, message: string = 'Invalid format') => {
    return (value: string): string | true => {
      return pattern.test(value) ? true : message;
    };
  },
  
  /**
   * Check if a string is a valid email
   * @param message Custom error message
   * @returns Validator function
   */
  email: (message: string = 'Invalid email address') => {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return Validators.pattern(emailPattern, message);
  },
  
  /**
   * Check if a string is a valid phone number
   * @param message Custom error message
   * @returns Validator function
   */
  phoneNumber: (message: string = 'Invalid phone number') => {
    const phonePattern = /^\+?[0-9]{10,15}$/;
    return Validators.pattern(phonePattern, message);
  },
  
  /**
   * Check if a string is a valid URL
   * @param message Custom error message
   * @returns Validator function
   */
  url: (message: string = 'Invalid URL') => {
    return (value: string): string | true => {
      try {
        new URL(value);
        return true;
      } catch (error) {
        return message;
      }
    };
  },
  
  /**
   * Check if a string is a valid credit card number (simple check)
   * @param message Custom error message
   * @returns Validator function
   */
  creditCard: (message: string = 'Invalid credit card number') => {
    return (value: string): string | true => {
      // Remove spaces and dashes
      const sanitized = value.replace(/[\s-]/g, '');
      
      // Check if it contains only digits
      if (!/^\d+$/.test(sanitized)) {
        return message;
      }
      
      // Check length (most credit cards are 13-19 digits)
      if (sanitized.length < 13 || sanitized.length > 19) {
        return message;
      }
      
      // Luhn algorithm (checksum)
      let sum = 0;
      let double = false;
      
      for (let i = sanitized.length - 1; i >= 0; i--) {
        let digit = parseInt(sanitized.charAt(i), 10);
        
        if (double) {
          digit *= 2;
          if (digit > 9) {
            digit -= 9;
          }
        }
        
        sum += digit;
        double = !double;
      }
      
      return sum % 10 === 0 ? true : message;
    };
  },
  
  /**
   * Check if a value is one of a set of allowed values
   * @param allowedValues Array of allowed values
   * @param message Custom error message
   * @returns Validator function
   */
  oneOf: <T>(allowedValues: T[], message?: string) => {
    return (value: T): string | true => {
      return allowedValues.includes(value) ? true : message || `Must be one of: ${allowedValues.join(', ')}`;
    };
  },
  
  /**
   * Check if a date is in the future
   * @param message Custom error message
   * @returns Validator function
   */
  futureDate: (message: string = 'Must be a future date') => {
    return (value: string | Date): string | true => {
      const date = value instanceof Date ? value : new Date(value);
      const now = new Date();
      
      return date > now ? true : message;
    };
  },
  
  /**
   * Check if a date is in the past
   * @param message Custom error message
   * @returns Validator function
   */
  pastDate: (message: string = 'Must be a past date') => {
    return (value: string | Date): string | true => {
      const date = value instanceof Date ? value : new Date(value);
      const now = new Date();
      
      return date < now ? true : message;
    };
  },
  
  /**
   * Check if a password meets complexity requirements
   * @param options Password complexity options
   * @param message Custom error message
   * @returns Validator function
   */
  passwordComplexity: (
    options: {
      minLength?: number;
      maxLength?: number;
      requireLowercase?: boolean;
      requireUppercase?: boolean;
      requireNumbers?: boolean;
      requireSpecialChars?: boolean;
    } = {},
    message?: string
  ) => {
    const {
      minLength = 8,
      maxLength = 100,
      requireLowercase = true,
      requireUppercase = true,
      requireNumbers = true,
      requireSpecialChars = true,
    } = options;
    
    return (value: string): string | true => {
      const errors = [];
      
      if (value.length < minLength) {
        errors.push(`Must be at least ${minLength} characters`);
      }
      
      if (value.length > maxLength) {
        errors.push(`Must be at most ${maxLength} characters`);
      }
      
      if (requireLowercase && !/[a-z]/.test(value)) {
        errors.push('Must include a lowercase letter');
      }
      
      if (requireUppercase && !/[A-Z]/.test(value)) {
        errors.push('Must include an uppercase letter');
      }
      
      if (requireNumbers && !/[0-9]/.test(value)) {
        errors.push('Must include a number');
      }
      
      if (requireSpecialChars && !/[^a-zA-Z0-9]/.test(value)) {
        errors.push('Must include a special character');
      }
      
      return errors.length === 0 ? true : message || errors.join(', ');
    };
  },
  
  /**
   * Create a custom validator
   * @param validator Custom validator function
   * @returns Validator function
   */
  custom: <T>(validator: (value: T) => string | true) => {
    return validator;
  },
};

/**
 * Create a validation schema
 * @param schema Validation schema definition
 * @returns ValidationSchema instance
 */
export function createValidationSchema<T>(schema: Record<string, ((value: any) => string | true)[]>): ValidationSchema<T> {
  return {
    validate(data: unknown): ValidationResult<T> {
      if (typeof data !== 'object' || data === null) {
        return { valid: false, value: undefined, errors: { _: 'Invalid data' } };
      }
      
      const errors: Record<string, string> = {};
      
      for (const field in schema) {
        if (Object.prototype.hasOwnProperty.call(schema, field)) {
          const validators = schema[field];
          const value = (data as Record<string, any>)[field];
          
          for (const validator of validators) {
            const result = validator(value);
            
            if (result !== true) {
              errors[field] = result;
              break;
            }
          }
        }
      }
      
      if (Object.keys(errors).length > 0) {
        return { valid: false, value: undefined, errors };
      }
      
      return { valid: true, value: data as T };
    },
  };
}

/**
 * Create a model validator
 * @param schema Validation schema
 * @param errorMessage Custom error message
 * @returns Validation function
 */
export function createValidator<T>(
  schema: ValidationSchema<T>,
  errorMessage: string = 'Validation failed'
): (data: unknown) => T {
  return (data: unknown) => validateData(data, schema, errorMessage);
}