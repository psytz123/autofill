/**
 * Shared Error Handling Utilities
 * Common error handling patterns for both web and mobile platforms
 */

/**
 * Custom error classes for different types of errors
 */
export class AppError extends Error {
  code: string;
  details?: Record<string, any>;
  
  constructor(message: string, code: string, details?: Record<string, any>) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
    
    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ApiError extends AppError {
  status: number;
  retryable: boolean;
  
  constructor(
    message: string, 
    status: number, 
    code: string = 'api_error',
    retryable: boolean = false,
    details?: Record<string, any>
  ) {
    super(message, code, details);
    this.name = 'ApiError';
    this.status = status;
    this.retryable = retryable;
    
    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export class NetworkError extends AppError {
  retryable: boolean;
  
  constructor(
    message: string = 'Network request failed', 
    retryable: boolean = true,
    details?: Record<string, any>
  ) {
    super(message, 'network_error', details);
    this.name = 'NetworkError';
    this.retryable = retryable;
    
    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

export class ValidationError extends AppError {
  fieldErrors?: Record<string, string[]>;
  
  constructor(
    message: string = 'Validation failed', 
    fieldErrors?: Record<string, string[]>,
    details?: Record<string, any>
  ) {
    super(message, 'validation_error', details);
    this.name = 'ValidationError';
    this.fieldErrors = fieldErrors;
    
    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class AuthenticationError extends AppError {
  constructor(
    message: string = 'Authentication required', 
    details?: Record<string, any>
  ) {
    super(message, 'authentication_error', details);
    this.name = 'AuthenticationError';
    
    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class AuthorizationError extends AppError {
  constructor(
    message: string = 'Not authorized', 
    details?: Record<string, any>
  ) {
    super(message, 'authorization_error', details);
    this.name = 'AuthorizationError';
    
    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(
    message: string = 'Resource not found', 
    details?: Record<string, any>
  ) {
    super(message, 'not_found', details);
    this.name = 'NotFoundError';
    
    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class TimeoutError extends AppError {
  retryable: boolean;
  
  constructor(
    message: string = 'Request timed out', 
    retryable: boolean = true,
    details?: Record<string, any>
  ) {
    super(message, 'timeout', details);
    this.name = 'TimeoutError';
    this.retryable = retryable;
    
    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

export class RateLimitError extends AppError {
  retryAfter?: number;
  
  constructor(
    message: string = 'Rate limit exceeded', 
    retryAfter?: number,
    details?: Record<string, any>
  ) {
    super(message, 'rate_limited', details);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    
    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

export class ServerError extends AppError {
  retryable: boolean;
  
  constructor(
    message: string = 'Server error', 
    retryable: boolean = true,
    details?: Record<string, any>
  ) {
    super(message, 'server_error', details);
    this.name = 'ServerError';
    this.retryable = retryable;
    
    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, ServerError.prototype);
  }
}

/**
 * Parse error response from API
 */
export function parseApiErrorResponse(response: Response, data: any): ApiError {
  const status = response.status;
  const code = data?.code || 'api_error';
  const message = data?.message || `API error: ${response.statusText}`;
  const details = data?.details;
  
  let error: ApiError;
  
  // Create the appropriate error based on the status code
  switch (status) {
    case 400:
      if (data?.fieldErrors) {
        error = new ValidationError(message, data.fieldErrors, details);
      } else {
        error = new ApiError(message, status, code, false, details);
      }
      break;
    case 401:
      error = new AuthenticationError(message, details);
      break;
    case 403:
      error = new AuthorizationError(message, details);
      break;
    case 404:
      error = new NotFoundError(message, details);
      break;
    case 408:
      error = new TimeoutError(message, true, details);
      break;
    case 429:
      const retryAfter = response.headers.get('Retry-After')
        ? parseInt(response.headers.get('Retry-After') || '0', 10)
        : undefined;
      error = new RateLimitError(message, retryAfter, details);
      break;
    case 500:
    case 502:
    case 503:
    case 504:
      error = new ServerError(message, true, details);
      break;
    default:
      // For other status codes
      const retryable = status >= 500; // Server errors are generally retryable
      error = new ApiError(message, status, code, retryable, details);
  }
  
  return error;
}

/**
 * Normalize error to AppError
 */
export function normalizeError(error: any): AppError {
  if (error instanceof AppError) {
    return error;
  }
  
  if (error instanceof TypeError && error.message.includes('Network request failed')) {
    return new NetworkError(error.message);
  }
  
  if (error instanceof Error) {
    return new AppError(error.message, 'unknown_error', { originalError: error });
  }
  
  if (typeof error === 'string') {
    return new AppError(error, 'unknown_error');
  }
  
  return new AppError('An unknown error occurred', 'unknown_error', { originalError: error });
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: any): boolean {
  const normalizedError = normalizeError(error);
  
  if (
    normalizedError instanceof NetworkError ||
    normalizedError instanceof TimeoutError ||
    normalizedError instanceof ServerError ||
    normalizedError instanceof RateLimitError
  ) {
    return normalizedError.retryable !== false;
  }
  
  if (normalizedError instanceof ApiError) {
    return normalizedError.retryable;
  }
  
  return false;
}

/**
 * Format API error for display
 */
export function formatApiErrorForDisplay(error: any): string {
  const normalizedError = normalizeError(error);
  
  if (normalizedError instanceof ValidationError && normalizedError.fieldErrors) {
    // Build a message from field errors
    const fieldMessages = Object.entries(normalizedError.fieldErrors)
      .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
      .join('\n');
    
    return `Validation failed:\n${fieldMessages}`;
  }
  
  if (normalizedError instanceof NetworkError) {
    return 'Network connection failed. Please check your internet connection and try again.';
  }
  
  if (normalizedError instanceof TimeoutError) {
    return 'Request timed out. Please try again later.';
  }
  
  if (normalizedError instanceof RateLimitError) {
    return `Rate limit exceeded. ${
      normalizedError.retryAfter 
        ? `Please try again in ${Math.ceil(normalizedError.retryAfter / 60)} minutes.` 
        : 'Please try again later.'
    }`;
  }
  
  if (normalizedError instanceof ServerError) {
    return 'The server encountered an error. Please try again later.';
  }
  
  if (normalizedError instanceof AuthenticationError) {
    return 'Authentication required. Please sign in to continue.';
  }
  
  if (normalizedError instanceof AuthorizationError) {
    return 'You do not have permission to perform this action.';
  }
  
  if (normalizedError instanceof NotFoundError) {
    return 'The requested resource could not be found.';
  }
  
  // Default fallback
  return normalizedError.message || 'An unexpected error occurred. Please try again.';
}

/**
 * Custom error boundary for React components
 */
export const ErrorBoundary = (
  Component: React.ComponentType<any>, 
  FallbackComponent: React.ComponentType<{ error: Error; reset: () => void }>
): React.FC<any> => {
  return (props: any) => {
    try {
      return <Component {...props} />;
    } catch (error) {
      const normalizedError = normalizeError(error);
      const reset = () => {
        // Force re-render
        // In a real implementation, this would reset the error state
      };
      
      return <FallbackComponent error={normalizedError} reset={reset} />;
    }
  };
};