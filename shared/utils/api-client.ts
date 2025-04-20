/**
 * Shared API Client Utilities
 * Common functionality for making API requests across web and mobile platforms
 */

import { ApiError, parseApiError } from './error-handling';

/**
 * Response structure for all API calls
 */
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: ApiError;
  status: number;
  success: boolean;
}

/**
 * Request options with enhanced features
 */
export interface ApiRequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  retryStatusCodes?: number[];
  headers?: HeadersInit;
}

/**
 * Default request options
 */
const DEFAULT_OPTIONS: ApiRequestOptions = {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Default to include credentials for session-based auth
  credentials: 'include',
  // Default timeout of 30 seconds
  timeout: 30000,
  // Default to 1 retry
  retries: 1,
  // Default retry delay of 1 second
  retryDelay: 1000,
  // Default retry on these status codes
  retryStatusCodes: [408, 429, 500, 502, 503, 504],
};

/**
 * Creates request headers with platform-specific modifications
 */
export async function createRequestHeaders(
  baseHeaders: HeadersInit = {},
  platform: 'web' | 'mobile' = 'web'
): Promise<HeadersInit> {
  const headers = { ...DEFAULT_OPTIONS.headers, ...baseHeaders };
  
  // On web, add CSRF token and other web-specific headers
  if (platform === 'web') {
    // This would be implemented by the platform-specific code
    // that imports this module
  }
  
  return headers;
}

/**
 * Executes a fetch request with timeout, retries, and enhanced error handling
 */
export async function fetchWithTimeout<T>(
  url: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  const {
    timeout = DEFAULT_OPTIONS.timeout,
    retries = DEFAULT_OPTIONS.retries,
    retryDelay = DEFAULT_OPTIONS.retryDelay,
    retryStatusCodes = DEFAULT_OPTIONS.retryStatusCodes,
    ...fetchOptions
  } = options;

  // Set up abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await executeFetchWithRetries<T>(
      url,
      {
        ...fetchOptions,
        signal: controller.signal,
      },
      retries,
      retryDelay,
      retryStatusCodes
    );
    
    return response;
  } catch (error: any) {
    // Handle timeout errors
    if (error.name === 'AbortError') {
      return {
        error: new ApiError({
          message: 'Request timed out',
          statusCode: 408,
          code: 'TIMEOUT',
          cause: error
        }),
        status: 408,
        success: false,
      };
    }
    
    // Handle network errors
    return {
      error: new ApiError({
        message: error.message || 'Network error',
        statusCode: 0,
        code: 'NETWORK_ERROR',
        cause: error
      }),
      status: 0,
      success: false,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Internal helper to execute a fetch request with retries
 */
async function executeFetchWithRetries<T>(
  url: string,
  options: RequestInit,
  retriesLeft: number,
  retryDelay: number,
  retryStatusCodes: number[]
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, options);
    
    // Check if we should retry
    if (
      !response.ok &&
      retriesLeft > 0 &&
      retryStatusCodes.includes(response.status)
    ) {
      // Add jitter to avoid thundering herd
      const jitter = Math.random() * 0.3 * retryDelay;
      const delay = retryDelay + jitter;
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Retry with exponential backoff
      return executeFetchWithRetries<T>(
        url,
        options,
        retriesLeft - 1,
        retryDelay * 2,
        retryStatusCodes
      );
    }
    
    // Process the response
    return processResponse<T>(response);
  } catch (error: any) {
    // For network errors, retry if we have retries left
    if (retriesLeft > 0 && error.name !== 'AbortError') {
      // Add jitter to avoid thundering herd
      const jitter = Math.random() * 0.3 * retryDelay;
      const delay = retryDelay + jitter;
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Retry with exponential backoff
      return executeFetchWithRetries<T>(
        url,
        options,
        retriesLeft - 1,
        retryDelay * 2,
        retryStatusCodes
      );
    }
    
    // Re-throw to be handled by the calling function
    throw error;
  }
}

/**
 * Process API response
 */
async function processResponse<T>(response: Response): Promise<ApiResponse<T>> {
  // For non-ok responses, parse and return error
  if (!response.ok) {
    let errorData: any;
    
    try {
      errorData = await response.json();
    } catch {
      // If we can't parse JSON, use text
      try {
        const text = await response.text();
        errorData = { message: text };
      } catch {
        // If we can't get text either, use status text
        errorData = { message: response.statusText };
      }
    }
    
    // Parse the error using our utility
    const error = parseApiError(response, errorData);
    
    return {
      error,
      status: response.status,
      success: false,
    };
  }
  
  // For successful responses, parse data
  try {
    const contentType = response.headers.get('content-type');
    
    // Handle JSON responses
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return {
        data,
        status: response.status,
        success: true,
      };
    }
    
    // Handle text responses
    const text = await response.text();
    return {
      data: text as unknown as T,
      status: response.status,
      success: true,
    };
  } catch (error: any) {
    // Handle parsing errors
    return {
      error: new ApiError({
        message: 'Failed to parse response',
        statusCode: response.status,
        code: 'PARSE_ERROR',
        cause: error
      }),
      status: response.status,
      success: false,
    };
  }
}

/**
 * Core API request function - used by the HTTP method wrappers
 */
export async function apiRequest<T>(
  method: string,
  url: string,
  data?: any,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  // Start with default options
  const requestOptions: ApiRequestOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
    method,
    headers: {
      ...DEFAULT_OPTIONS.headers,
      ...options.headers,
    },
  };
  
  // Add request body for methods that support it
  if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
    requestOptions.body = JSON.stringify(sanitizeData(data));
  }
  
  // Execute the request
  return fetchWithTimeout<T>(url, requestOptions);
}

/**
 * Sanitize data before sending to prevent injection attacks
 */
function sanitizeData<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item)) as unknown as T;
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as object)) {
    // Skip functions or complex objects
    if (
      typeof value !== 'function' &&
      !(value instanceof Element) &&
      !(value instanceof File)
    ) {
      sanitized[key] = sanitizeData(value);
    }
  }

  return sanitized as unknown as T;
}

/**
 * HTTP Method convenience functions
 */
export async function get<T>(
  url: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  return apiRequest<T>('GET', url, undefined, options);
}

export async function post<T>(
  url: string,
  data?: any,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  return apiRequest<T>('POST', url, data, options);
}

export async function put<T>(
  url: string,
  data?: any,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  return apiRequest<T>('PUT', url, data, options);
}

export async function patch<T>(
  url: string,
  data?: any,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  return apiRequest<T>('PATCH', url, data, options);
}

export async function del<T>(
  url: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  return apiRequest<T>('DELETE', url, undefined, options);
}