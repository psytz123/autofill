/**
 * Defines custom error types used throughout the application
 */

// Custom API error class
interface ApiErrorOptions {
  message: string;
  statusCode: number;
  code?: string;
  data?: unknown;
  cause?: Error;
}

interface ApiValidationError {
  message: string;
  field: string;
  code: string;
}

declare global {
  // Custom Error classes for consistent error handling
  class ApiError extends Error {
    statusCode: number;
    code: string;
    data?: unknown;
    cause?: Error;

    constructor(options: ApiErrorOptions);

    static fromResponse(response: Response): Promise<ApiError>;
    static isApiError(error: unknown): error is ApiError;
  }

  class ValidationError extends Error {
    errors: ApiValidationError[];

    constructor(message: string, errors?: ApiValidationError[]);

    static isValidationError(error: unknown): error is ValidationError;
  }

  class AuthenticationError extends Error {
    constructor(message?: string);

    static isAuthenticationError(error: unknown): error is AuthenticationError;
  }

  class NetworkError extends Error {
    constructor(message?: string, public cause?: Error);

    static isNetworkError(error: unknown): error is NetworkError;
  }

  class RateLimitError extends Error {
    retryAfter?: number;
    
    constructor(message?: string, retryAfter?: number);

    static isRateLimitError(error: unknown): error is RateLimitError;
  }

  class TimeoutError extends Error {
    constructor(message?: string);

    static isTimeoutError(error: unknown): error is TimeoutError;
  }

  class NotFoundError extends Error {
    constructor(resource?: string, id?: string | number);

    static isNotFoundError(error: unknown): error is NotFoundError;
  }

  class ForbiddenError extends Error {
    constructor(message?: string);

    static isForbiddenError(error: unknown): error is ForbiddenError;
  }

  class ServiceUnavailableError extends Error {
    constructor(service?: string);

    static isServiceUnavailableError(error: unknown): error is ServiceUnavailableError;
  }

  // Error subtypes
  interface ErrorWithCode extends Error {
    code: string;
  }

  interface ErrorWithStatusCode extends Error {
    statusCode: number;
  }
}

// Make this a module
export {};