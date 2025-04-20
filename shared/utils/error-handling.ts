/**
 * Error Handling Utilities
 * 
 * This module provides standardized error handling for use across web and mobile platforms.
 */

/**
 * Base application error class
 */
export class AppError extends Error {
  public retryable: boolean;
  public code?: string;
  public context?: Record<string, any>;
  
  constructor(message: string, options: {
    retryable?: boolean;
    code?: string;
    context?: Record<string, any>;
    cause?: Error;
  } = {}) {
    super(message);
    
    // Set the prototype explicitly to ensure instanceof works correctly
    Object.setPrototypeOf(this, AppError.prototype);
    
    this.name = this.constructor.name;
    this.retryable = options.retryable || false;
    this.code = options.code;
    this.context = options.context;
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    
    // Include cause if provided
    if (options.cause) {
      (this as any).cause = options.cause;
    }
  }
}

/**
 * API Error - For errors returned by an API
 */
export class ApiError extends AppError {
  public status: number;
  
  constructor(message: string, status: number, options: {
    retryable?: boolean;
    code?: string;
    context?: Record<string, any>;
    cause?: Error;
  } = {}) {
    super(message, options);
    
    // Set the prototype explicitly to ensure instanceof works correctly
    Object.setPrototypeOf(this, ApiError.prototype);
    
    this.status = status;
    
    // Some HTTP status codes are retryable by default
    if (options.retryable === undefined) {
      this.retryable = status >= 500 || status === 429 || status === 408;
    }
  }
}

/**
 * Network Error - For network related failures
 */
export class NetworkError extends AppError {
  constructor(message: string, options: {
    code?: string;
    context?: Record<string, any>;
    cause?: Error;
  } = {}) {
    super(message, { ...options, retryable: true });
    
    // Set the prototype explicitly to ensure instanceof works correctly
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Timeout Error - For request timeouts
 */
export class TimeoutError extends AppError {
  constructor(message: string, options: {
    code?: string;
    context?: Record<string, any>;
    cause?: Error;
  } = {}) {
    super(message, { ...options, retryable: true });
    
    // Set the prototype explicitly to ensure instanceof works correctly
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/**
 * Rate Limit Error - For rate limiting failures
 */
export class RateLimitError extends AppError {
  public retryAfter?: number;
  
  constructor(message: string, options: {
    retryAfter?: number;
    code?: string;
    context?: Record<string, any>;
    cause?: Error;
  } = {}) {
    super(message, { ...options, retryable: true });
    
    // Set the prototype explicitly to ensure instanceof works correctly
    Object.setPrototypeOf(this, RateLimitError.prototype);
    
    this.retryAfter = options.retryAfter;
  }
}

/**
 * Validation Error - For data validation failures
 */
export class ValidationError extends AppError {
  public fieldErrors?: Record<string, string>;
  
  constructor(message: string, options: {
    fieldErrors?: Record<string, string>;
    code?: string;
    context?: Record<string, any>;
    cause?: Error;
  } = {}) {
    super(message, { ...options, retryable: false });
    
    // Set the prototype explicitly to ensure instanceof works correctly
    Object.setPrototypeOf(this, ValidationError.prototype);
    
    this.fieldErrors = options.fieldErrors;
  }
}

/**
 * Authentication Error - For auth related failures
 */
export class AuthenticationError extends AppError {
  constructor(message: string, options: {
    code?: string;
    context?: Record<string, any>;
    cause?: Error;
  } = {}) {
    super(message, { ...options, retryable: false });
    
    // Set the prototype explicitly to ensure instanceof works correctly
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Authorization Error - For permission related failures
 */
export class AuthorizationError extends AppError {
  constructor(message: string, options: {
    code?: string;
    context?: Record<string, any>;
    cause?: Error;
  } = {}) {
    super(message, { ...options, retryable: false });
    
    // Set the prototype explicitly to ensure instanceof works correctly
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

/**
 * Not Found Error - For resource not found failures
 */
export class NotFoundError extends AppError {
  constructor(message: string, options: {
    code?: string;
    context?: Record<string, any>;
    cause?: Error;
  } = {}) {
    super(message, { ...options, retryable: false });
    
    // Set the prototype explicitly to ensure instanceof works correctly
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Parse an API error response into a specific error instance
 * @param response Fetch response object
 * @param errorData Error data from response
 * @returns Specific error instance
 */
export function parseApiErrorResponse(
  response: Response,
  errorData: any
): AppError {
  const message = errorData?.message || response.statusText || 'Unknown error';
  const code = errorData?.code;
  const context = errorData?.context;
  
  // Determine the appropriate error type based on status code
  switch (response.status) {
    case 400:
      return new ValidationError(message, { 
        code, 
        context,
        fieldErrors: errorData?.errors
      });
    
    case 401:
      return new AuthenticationError(message, { code, context });
    
    case 403:
      return new AuthorizationError(message, { code, context });
    
    case 404:
      return new NotFoundError(message, { code, context });
    
    case 408:
      return new TimeoutError(message, { code, context });
    
    case 429:
      return new RateLimitError(message, { 
        code, 
        context,
        retryAfter: parseInt(response.headers.get('retry-after') || '', 10) || undefined
      });
    
    default:
      return new ApiError(message, response.status, { code, context });
  }
}

/**
 * Normalize an error to ensure it's an instance of AppError
 * @param error Error to normalize
 * @returns Normalized AppError
 */
export function normalizeError(error: any): AppError {
  // Already an AppError instance
  if (error instanceof AppError) {
    return error;
  }
  
  // Error-like object with message
  if (error && typeof error === 'object' && 'message' in error) {
    return new AppError(error.message, { cause: error });
  }
  
  // String error
  if (typeof error === 'string') {
    return new AppError(error);
  }
  
  // Unknown error
  return new AppError('Unknown error');
}

/**
 * Check if an error is retryable
 * @param error Error to check
 * @returns True if the error is retryable
 */
export function isRetryableError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.retryable;
  }
  
  // Network errors are typically retryable
  if (
    error instanceof TypeError &&
    error.message.includes('NetworkError')
  ) {
    return true;
  }
  
  // DOMExceptions like AbortError (timeout) are typically retryable
  if (
    error instanceof DOMException &&
    error.name === 'AbortError'
  ) {
    return true;
  }
  
  return false;
}

/**
 * Get a user-friendly error message
 * @param error Error to get message for
 * @returns User-friendly error message
 */
export function getUserFriendlyErrorMessage(error: any): string {
  const normalizedError = normalizeError(error);
  
  if (normalizedError instanceof NetworkError) {
    return 'Network connection issue. Please check your internet connection and try again.';
  }
  
  if (normalizedError instanceof TimeoutError) {
    return 'Request timed out. Please try again later.';
  }
  
  if (normalizedError instanceof RateLimitError) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  
  if (normalizedError instanceof ValidationError) {
    return normalizedError.message || 'Please check your input and try again.';
  }
  
  if (normalizedError instanceof AuthenticationError) {
    return 'Authentication required. Please sign in and try again.';
  }
  
  if (normalizedError instanceof AuthorizationError) {
    return 'You don\'t have permission to perform this action.';
  }
  
  if (normalizedError instanceof NotFoundError) {
    return 'The requested resource was not found.';
  }
  
  if (normalizedError instanceof ApiError && normalizedError.status >= 500) {
    return 'Server error. Please try again later.';
  }
  
  return normalizedError.message || 'An unexpected error occurred.';
}

/**
 * Global error handler - should be called at the highest level of the application
 * @param error Error to handle
 * @param errorReporter Optional error reporting function (e.g., to Sentry, LogRocket, etc.)
 */
export function handleGlobalError(
  error: any,
  errorReporter?: (error: Error, context?: Record<string, any>) => void
): void {
  const normalizedError = normalizeError(error);
  
  // Log the error
  console.error('[Global Error]', normalizedError);
  
  // Report the error if a reporter is provided
  if (errorReporter) {
    try {
      errorReporter(normalizedError, normalizedError.context);
    } catch (reportingError) {
      console.error('Error reporting failed:', reportingError);
    }
  }
  
  // You might want to show a global error UI here in a real application
}

/**
 * Error boundary props
 */
export interface ErrorBoundaryProps {
  fallback: React.ReactNode | ((error: Error, reset: () => void) => React.ReactNode);
  onError?: (error: Error, info: { componentStack: string }) => void;
  children: React.ReactNode;
}

/**
 * Error boundary state
 */
export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary component for React
 * Note: This is defined as a class reference but should be implemented
 * in React-specific code with access to the React import
 */
export const ErrorBoundaryImpl = `
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
    this.reset = this.reset.bind(this);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // Report the error
    if (this.props.onError) {
      this.props.onError(error, info);
    }
  }

  reset() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (this.state.hasError) {
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback(this.state.error!, this.reset);
      }
      return this.props.fallback;
    }

    return this.props.children;
  }
}
`;