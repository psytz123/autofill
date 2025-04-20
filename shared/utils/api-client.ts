/**
 * Shared API Client Utilities
 * Common API interaction patterns for both web and mobile platforms
 */

import {
  ApiError,
  NetworkError,
  TimeoutError,
  RateLimitError,
  parseApiErrorResponse,
  normalizeError,
  isRetryableError
} from './error-handling';
import { PerformanceTimer } from './analytics';

/**
 * API request options
 */
export interface ApiRequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  baseURL?: string;
  retryDelay?: number | ((attempt: number, error: Error) => number);
  validateStatus?: (status: number) => boolean;
  onUploadProgress?: (progressEvent: { loaded: number; total: number }) => void;
  onDownloadProgress?: (progressEvent: { loaded: number; total: number }) => void;
}

/**
 * Default API client configuration
 */
const DEFAULT_CONFIG: ApiRequestOptions = {
  timeout: 30000, // 30 seconds
  retries: 2,
  retryDelay: (attempt) => Math.min(2 ** attempt * 1000, 30000), // Exponential backoff with 30s max
  validateStatus: (status) => status >= 200 && status < 300,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

/**
 * Calculate retry delay with jitter to avoid thundering herd
 */
function calculateRetryDelay(
  attempt: number, 
  error: Error, 
  delayFn: ApiRequestOptions['retryDelay']
): number {
  // If RateLimitError with retryAfter, use that
  if (error instanceof RateLimitError && error.retryAfter) {
    return error.retryAfter * 1000;
  }
  
  // Calculate delay based on retryDelay function or value
  let delay: number;
  if (typeof delayFn === 'function') {
    delay = delayFn(attempt, error);
  } else if (typeof delayFn === 'number') {
    delay = delayFn;
  } else {
    // Default exponential backoff
    delay = Math.min(2 ** attempt * 1000, 30000);
  }
  
  // Add jitter to avoid thundering herd effect
  // Random value between 75% and 100% of the calculated delay
  return delay * (0.75 + Math.random() * 0.25);
}

/**
 * Base API client for making HTTP requests
 */
export class ApiClient {
  protected baseURL: string;
  protected defaultOptions: ApiRequestOptions;
  
  constructor(baseURL: string = '', defaultOptions: Partial<ApiRequestOptions> = {}) {
    this.baseURL = baseURL;
    this.defaultOptions = {
      ...DEFAULT_CONFIG,
      ...defaultOptions,
    };
  }
  
  /**
   * Make an API request with retries and error handling
   */
  async request<T = any>(
    url: string,
    options: Partial<ApiRequestOptions> = {}
  ): Promise<T> {
    const mergedOptions = this.mergeOptions(options);
    const fullUrl = this.resolveUrl(url, mergedOptions.baseURL);
    const { timeout, retries, retryDelay, validateStatus, ...fetchOptions } = mergedOptions;
    
    let attempt = 0;
    let lastError: Error | null = null;
    
    // Start performance timer
    const timer = new PerformanceTimer();
    
    while (attempt <= retries!) {
      try {
        // Add timeout using AbortController
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        // Include abort signal in fetch options
        const fetchOptionsWithSignal = {
          ...fetchOptions,
          signal: controller.signal,
        };
        
        // Make request
        const response = await fetch(fullUrl, fetchOptionsWithSignal);
        
        // Clear timeout
        clearTimeout(timeoutId);
        
        // Check if response status is valid
        if (!validateStatus!(response.status)) {
          let errorData;
          try {
            const contentType = response.headers.get('Content-Type') || '';
            if (contentType.includes('application/json')) {
              errorData = await response.json();
            } else {
              errorData = { message: await response.text() };
            }
          } catch (e) {
            errorData = { message: response.statusText };
          }
          
          // Create error instance based on status
          const error = parseApiErrorResponse(response, errorData);
          
          // For retryable errors, try again
          if (error.retryable && attempt < retries!) {
            lastError = error;
            attempt++;
            
            // Calculate delay with jitter
            const delay = calculateRetryDelay(attempt, error, retryDelay);
            console.log(`[api] Retrying after error: ${error.message}. Attempt ${attempt} of ${retries}`);
            console.log(`[api] Waiting ${Math.round(delay / 1000)} seconds before next attempt`);
            
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          throw error;
        }
        
        // Parse response based on content type
        const contentType = response.headers.get('Content-Type') || '';
        let data: T;
        
        if (contentType.includes('application/json')) {
          data = await response.json();
        } else if (contentType.includes('text/')) {
          data = await response.text() as unknown as T;
        } else {
          data = await response.blob() as unknown as T;
        }
        
        return data;
      } catch (error: any) {
        // Handle AbortController timeout
        if (error.name === 'AbortError') {
          const timeoutError = new TimeoutError(`Request timed out after ${timeout}ms`);
          
          if (attempt < retries!) {
            lastError = timeoutError;
            attempt++;
            
            // Calculate delay with jitter
            const delay = calculateRetryDelay(attempt, timeoutError, retryDelay);
            console.log(`[api] Retrying after error: ${timeoutError.message}. Attempt ${attempt} of ${retries}`);
            console.log(`[api] Waiting ${Math.round(delay / 1000)} seconds before next attempt`);
            
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          throw timeoutError;
        }
        
        // Handle network errors
        if (error instanceof TypeError && error.message.includes('NetworkError')) {
          const networkError = new NetworkError(error.message);
          
          if (attempt < retries!) {
            lastError = networkError;
            attempt++;
            
            // Calculate delay with jitter
            const delay = calculateRetryDelay(attempt, networkError, retryDelay);
            console.log(`[api] Retrying after error: ${networkError.message}. Attempt ${attempt} of ${retries}`);
            console.log(`[api] Waiting ${Math.round(delay / 1000)} seconds before next attempt`);
            
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          throw networkError;
        }
        
        // Handle other errors, attempt retry if it's retryable
        const normalizedError = normalizeError(error);
        
        if (isRetryableError(normalizedError) && attempt < retries!) {
          lastError = normalizedError;
          attempt++;
          
          // Calculate delay with jitter
          const delay = calculateRetryDelay(attempt, normalizedError, retryDelay);
          console.log(`[api] Retrying after error: ${normalizedError.message}. Attempt ${attempt} of ${retries}`);
          console.log(`[api] Waiting ${Math.round(delay / 1000)} seconds before next attempt`);
          
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        throw normalizedError;
      }
    }
    
    // If all retries failed, throw the last error
    throw lastError || new Error('Request failed after multiple retries');
  }
  
  /**
   * GET request
   */
  async get<T = any>(url: string, options: Partial<ApiRequestOptions> = {}): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'GET',
    });
  }
  
  /**
   * POST request
   */
  async post<T = any>(
    url: string,
    data?: any,
    options: Partial<ApiRequestOptions> = {}
  ): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
  
  /**
   * PUT request
   */
  async put<T = any>(
    url: string,
    data?: any,
    options: Partial<ApiRequestOptions> = {}
  ): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
  
  /**
   * PATCH request
   */
  async patch<T = any>(
    url: string,
    data?: any,
    options: Partial<ApiRequestOptions> = {}
  ): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
  
  /**
   * DELETE request
   */
  async delete<T = any>(url: string, options: Partial<ApiRequestOptions> = {}): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'DELETE',
    });
  }
  
  /**
   * Merge default options with request-specific options
   */
  protected mergeOptions(options: Partial<ApiRequestOptions>): ApiRequestOptions {
    // Merge headers separately to ensure they are combined correctly
    const headers = {
      ...this.defaultOptions.headers,
      ...options.headers,
    };
    
    return {
      ...this.defaultOptions,
      ...options,
      headers,
    };
  }
  
  /**
   * Resolve a URL against the base URL
   */
  protected resolveUrl(url: string, baseURL?: string): string {
    // If URL is already absolute, return it
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // Remove trailing slash from baseURL if present
    const base = (baseURL || this.baseURL || '').endsWith('/')
      ? (baseURL || this.baseURL || '').slice(0, -1)
      : (baseURL || this.baseURL || '');
    
    // Add leading slash to URL if not present
    const path = url.startsWith('/') ? url : `/${url}`;
    
    return `${base}${path}`;
  }
}

// Create singleton instance for global use
let defaultApiClient: ApiClient | null = null;

/**
 * Get the default API client instance
 */
export function getApiClient(baseURL: string = '', options: Partial<ApiRequestOptions> = {}): ApiClient {
  if (!defaultApiClient) {
    defaultApiClient = new ApiClient(baseURL, options);
  }
  return defaultApiClient;
}

/**
 * Reset the default API client (useful for testing)
 */
export function resetApiClient(): void {
  defaultApiClient = null;
}