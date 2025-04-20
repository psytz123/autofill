/**
 * Shared Error Handling Utilities
 * Common error types and utilities for handling errors across web and mobile platforms
 */

/**
 * Base API Error with enhanced properties
 */
export class ApiError extends Error {
  status: number;
  code?: string;
  data?: any;
  cause?: Error;

  constructor({
    message,
    statusCode = 500,
    code,
    data,
    cause,
  }: {
    message: string;
    statusCode?: number;
    code?: string;
    data?: any;
    cause?: Error;
  }) {
    super(message);
    this.name = 'ApiError';
    this.status = statusCode;
    this.code = code;
    this.data = data;
    this.cause = cause;

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Authentication Error - used for auth-related errors
 */
export class AuthError extends ApiError {
  constructor(message = 'Authentication failed', code = 'AUTH_ERROR') {
    super({ message, statusCode: 401, code });
    this.name = 'AuthError';
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

/**
 * Not Found Error - used when resources aren't found
 */
export class NotFoundError extends ApiError {
  constructor(resourceType: string, resourceId: string) {
    super({ 
      message: `${resourceType} with ID ${resourceId} not found`, 
      statusCode: 404, 
      code: 'NOT_FOUND' 
    });
    this.name = 'NotFoundError';
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Validation Error - used for input validation errors
 */
export interface ValidationErrorDetail {
  field: string;
  message: string;
  code: string;
}

export class ValidationError extends ApiError {
  validationErrors: ValidationErrorDetail[];

  constructor(message: string, validationErrors: ValidationErrorDetail[] = []) {
    super({ 
      message, 
      statusCode: 400, 
      code: 'VALIDATION_ERROR',
      data: { validationErrors } 
    });
    this.name = 'ValidationError';
    this.validationErrors = validationErrors;
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Service Unavailable Error - used when external services are not available
 */
export class ServiceUnavailableError extends ApiError {
  serviceName: string;

  constructor(serviceName: string) {
    super({ 
      message: `The ${serviceName} service is currently unavailable. Please try again later.`, 
      statusCode: 503, 
      code: 'SERVICE_UNAVAILABLE' 
    });
    this.name = 'ServiceUnavailableError';
    this.serviceName = serviceName;
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ServiceUnavailableError.prototype);
  }
}

/**
 * Rate Limit Error - used when API rate limits are exceeded
 */
export class RateLimitError extends ApiError {
  retryAfter?: number;

  constructor(message = 'Rate limit exceeded', retryAfter?: number) {
    super({ 
      message, 
      statusCode: 429, 
      code: 'RATE_LIMIT_EXCEEDED',
      data: retryAfter ? { retryAfter } : undefined 
    });
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * Utility function to parse error responses from the API
 */
export function parseApiError(response: Response, errorData: any): ApiError {
  // Check for specific error types based on status code or error data
  const status = response.status;
  const code = errorData?.code;
  const message = errorData?.message || response.statusText || 'An unknown error occurred';

  // Handle validation errors
  if (status === 400 && code === 'VALIDATION_ERROR' && errorData?.validationErrors) {
    return new ValidationError(message, errorData.validationErrors);
  }

  // Handle authentication errors
  if (status === 401) {
    return new AuthError(message, code);
  }

  // Handle not found errors
  if (status === 404) {
    // Try to extract resource information from the error message
    const notFoundMatch = message.match(/(\w+) with ID ([\w-]+) not found/);
    if (notFoundMatch) {
      return new NotFoundError(notFoundMatch[1], notFoundMatch[2]);
    }
    // Generic not found
    return new NotFoundError('Resource', 'unknown');
  }

  // Handle rate limit errors
  if (status === 429) {
    const retryAfter = response.headers.get('Retry-After') 
      ? parseInt(response.headers.get('Retry-After')!, 10)
      : undefined;
    return new RateLimitError(message, retryAfter);
  }

  // Handle service unavailable errors
  if (status === 503) {
    const serviceMatch = message.match(/The (\w+) service is currently unavailable/);
    const serviceName = serviceMatch ? serviceMatch[1] : 'requested';
    return new ServiceUnavailableError(serviceName);
  }

  // Default to generic API error
  return new ApiError({
    message,
    statusCode: status,
    code,
    data: errorData
  });
}

/**
 * Format validation errors for displaying in forms
 */
export function formatValidationErrors(error: Error): Record<string, string> {
  if (error instanceof ValidationError && error.validationErrors) {
    return error.validationErrors.reduce((acc, curr) => {
      acc[curr.field] = curr.message;
      return acc;
    }, {} as Record<string, string>);
  }
  return {};
}

/**
 * Get a user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: Error): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  return 'An unexpected error occurred. Please try again later.';
}