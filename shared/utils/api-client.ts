/**
 * API Client
 * 
 * This module provides a robust API client with retry, timeout, and error handling.
 */

import {
  ApiError,
  NetworkError,
  TimeoutError,
  RateLimitError,
  parseApiErrorResponse,
  isRetryableError,
} from './error-handling';

/**
 * API client configuration
 */
export interface ApiClientConfig {
  /**
   * Base URL for API requests
   */
  baseUrl?: string;
  
  /**
   * Default headers to include with every request
   */
  defaultHeaders?: Record<string, string>;
  
  /**
   * Default timeout in milliseconds
   */
  timeout?: number;
  
  /**
   * Whether to include credentials
   */
  includeCredentials?: boolean;
  
  /**
   * Authentication token
   */
  authToken?: string;
  
  /**
   * Authentication header name
   */
  authHeaderName?: string;
  
  /**
   * Retry configuration
   */
  retry?: {
    /**
     * Maximum number of retry attempts
     */
    maxRetries: number;
    
    /**
     * Base delay between retries in milliseconds
     */
    baseDelay: number;
    
    /**
     * Maximum delay between retries in milliseconds
     */
    maxDelay?: number;
    
    /**
     * Whether to use exponential backoff
     */
    useExponentialBackoff?: boolean;
    
    /**
     * Whether to use jitter
     */
    useJitter?: boolean;
  };
  
  /**
   * Request transform
   */
  requestTransform?: (request: Request) => Request | Promise<Request>;
  
  /**
   * Response transform
   */
  responseTransform?: (response: Response) => Response | Promise<Response>;
  
  /**
   * Error handler
   */
  errorHandler?: (error: Error) => void;
  
  /**
   * On unauthorized callback (401)
   */
  onUnauthorized?: () => void;
  
  /**
   * API version
   */
  apiVersion?: string;
  
  /**
   * Cache policy
   */
  cachePolicy?: 'default' | 'no-store' | 'reload' | 'no-cache' | 'force-cache' | 'only-if-cached';
}

/**
 * Request options
 */
export interface RequestOptions extends Omit<RequestInit, 'body'> {
  /**
   * Request body
   */
  body?: any;
  
  /**
   * Query parameters
   */
  params?: Record<string, any>;
  
  /**
   * Request timeout in milliseconds
   */
  timeout?: number;
  
  /**
   * Whether to retry the request on failure
   */
  retry?: boolean;
  
  /**
   * Maximum number of retry attempts
   */
  maxRetries?: number;
  
  /**
   * Parse response as specified type
   */
  parseAs?: 'json' | 'text' | 'blob' | 'arrayBuffer' | 'formData' | 'none';
  
  /**
   * Additional headers
   */
  headers?: Record<string, string>;
  
  /**
   * On 401 behavior
   */
  on401?: 'throw' | 'returnNull' | 'refresh';
  
  /**
   * Cache policy
   */
  cache?: 'default' | 'no-store' | 'reload' | 'no-cache' | 'force-cache' | 'only-if-cached';
}

/**
 * API client class
 */
export class ApiClient {
  private config: ApiClientConfig;
  
  /**
   * Create a new API client
   * @param config API client configuration
   */
  constructor(config: ApiClientConfig = {}) {
    this.config = {
      baseUrl: '',
      defaultHeaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 30000,
      includeCredentials: false,
      authHeaderName: 'Authorization',
      retry: {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        useExponentialBackoff: true,
        useJitter: true,
      },
      cachePolicy: 'default',
      ...config,
    };
  }
  
  /**
   * Update client configuration
   * @param config Partial configuration to update
   */
  public updateConfig(config: Partial<ApiClientConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      retry: {
        ...this.config.retry,
        ...config.retry,
      },
      defaultHeaders: {
        ...this.config.defaultHeaders,
        ...config.defaultHeaders,
      },
    };
  }
  
  /**
   * Set authentication token
   * @param token Authentication token
   * @param headerName Optional custom header name
   */
  public setAuthToken(token: string, headerName?: string): void {
    this.config.authToken = token;
    if (headerName) {
      this.config.authHeaderName = headerName;
    }
  }
  
  /**
   * Clear authentication token
   */
  public clearAuthToken(): void {
    this.config.authToken = undefined;
  }
  
  /**
   * Make a request
   * @param url Request URL
   * @param options Request options
   * @returns Response data
   */
  public async request<T = any>(url: string, options: RequestOptions = {}): Promise<T> {
    const {
      method = 'GET',
      body,
      params,
      timeout = this.config.timeout,
      retry = true,
      maxRetries = this.config.retry?.maxRetries,
      parseAs = 'json',
      headers = {},
      on401 = 'throw',
      cache = this.config.cachePolicy,
      ...fetchOptions
    } = options;
    
    // Build the full URL with query parameters
    const fullUrl = this.buildUrl(url, params);
    
    // Create headers
    const requestHeaders = new Headers(this.buildHeaders(headers));
    
    // Create request init
    const requestInit: RequestInit = {
      method,
      headers: requestHeaders,
      credentials: this.config.includeCredentials ? 'include' : 'same-origin',
      cache,
      ...fetchOptions,
    };
    
    // Add body if not GET or HEAD
    if (method !== 'GET' && method !== 'HEAD' && body !== undefined) {
      requestInit.body = typeof body === 'string' ? body : JSON.stringify(body);
    }
    
    // Create request
    let request = new Request(fullUrl, requestInit);
    
    // Apply request transform if configured
    if (this.config.requestTransform) {
      request = await this.config.requestTransform(request);
    }
    
    // Make the request with retry logic
    let retryCount = 0;
    let lastError: Error | null = null;
    
    while (retryCount <= (retry ? maxRetries : 0)) {
      try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        // Add signal to request
        const requestWithSignal = new Request(request, {
          signal: controller.signal,
        });
        
        // Make the request
        let response: Response;
        try {
          response = await fetch(requestWithSignal);
        } catch (error: any) {
          // Clear timeout
          clearTimeout(timeoutId);
          
          // Handle network errors
          if (error.name === 'AbortError') {
            throw new TimeoutError(`Request timed out after ${timeout}ms`);
          }
          
          throw new NetworkError(`Network error: ${error.message}`, { cause: error });
        }
        
        // Clear timeout
        clearTimeout(timeoutId);
        
        // Apply response transform if configured
        if (this.config.responseTransform) {
          response = await this.config.responseTransform(response);
        }
        
        // Handle HTTP errors
        if (!response.ok) {
          // Parse error data
          let errorData: any;
          try {
            errorData = await response.clone().json();
          } catch {
            try {
              errorData = { message: await response.clone().text() };
            } catch {
              errorData = { message: response.statusText };
            }
          }
          
          // Handle specific status codes
          if (response.status === 401) {
            if (on401 === 'returnNull') {
              return null as unknown as T;
            } else if (on401 === 'refresh' && this.config.onUnauthorized) {
              this.config.onUnauthorized();
              return null as unknown as T;
            }
          }
          
          // Create appropriate error instance
          const error = parseApiErrorResponse(response, errorData);
          
          // Check if we should retry
          if (retry && isRetryableError(error) && retryCount < maxRetries) {
            lastError = error;
            retryCount++;
            
            // Calculate delay with exponential backoff and jitter
            const delay = this.calculateRetryDelay(retryCount);
            
            // Log retry attempt
            console.log(`[api] Retrying after error: ${error.message}. Attempt ${retryCount} of ${maxRetries}`);
            console.log(`[api] Waiting ${delay / 1000} seconds before next attempt`);
            
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          throw error;
        }
        
        // Parse response based on parseAs option
        if (parseAs === 'none') {
          return response as unknown as T;
        } else if (parseAs === 'json') {
          try {
            return await response.json() as T;
          } catch (error) {
            throw new ApiError('Failed to parse JSON response', 200, { cause: error });
          }
        } else if (parseAs === 'text') {
          return await response.text() as unknown as T;
        } else if (parseAs === 'blob') {
          return await response.blob() as unknown as T;
        } else if (parseAs === 'arrayBuffer') {
          return await response.arrayBuffer() as unknown as T;
        } else if (parseAs === 'formData') {
          return await response.formData() as unknown as T;
        }
        
        // Default to JSON
        return await response.json() as T;
      } catch (error: any) {
        // Save the error for possible retry
        lastError = error;
        
        // Check if we should retry
        if (retry && isRetryableError(error) && retryCount < maxRetries) {
          retryCount++;
          
          // Calculate delay with exponential backoff and jitter
          const delay = this.calculateRetryDelay(retryCount);
          
          // Log retry attempt
          console.log(`[api] Retrying after error: ${error.message}. Attempt ${retryCount} of ${maxRetries}`);
          console.log(`[api] Waiting ${delay / 1000} seconds before next attempt`);
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // Handle error with errorHandler if configured
        if (this.config.errorHandler) {
          this.config.errorHandler(error);
        }
        
        throw error;
      }
    }
    
    // This should never happen, but TypeScript needs it
    throw lastError || new Error('Unknown error during request');
  }
  
  /**
   * Make a GET request
   * @param url Request URL
   * @param options Request options
   * @returns Response data
   */
  public get<T = any>(url: string, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }
  
  /**
   * Make a POST request
   * @param url Request URL
   * @param body Request body
   * @param options Request options
   * @returns Response data
   */
  public post<T = any>(url: string, body?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(url, { ...options, method: 'POST', body });
  }
  
  /**
   * Make a PUT request
   * @param url Request URL
   * @param body Request body
   * @param options Request options
   * @returns Response data
   */
  public put<T = any>(url: string, body?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(url, { ...options, method: 'PUT', body });
  }
  
  /**
   * Make a PATCH request
   * @param url Request URL
   * @param body Request body
   * @param options Request options
   * @returns Response data
   */
  public patch<T = any>(url: string, body?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(url, { ...options, method: 'PATCH', body });
  }
  
  /**
   * Make a DELETE request
   * @param url Request URL
   * @param options Request options
   * @returns Response data
   */
  public delete<T = any>(url: string, options: Omit<RequestOptions, 'method'> = {}): Promise<T> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }
  
  /**
   * Build the full URL with query parameters
   * @param url Base URL
   * @param params Query parameters
   * @returns Full URL
   */
  private buildUrl(url: string, params?: Record<string, any>): string {
    // Start with the base URL or the provided URL
    let fullUrl = url.startsWith('http') ? url : `${this.config.baseUrl}${url}`;
    
    // Add API version if configured and not already in URL
    if (this.config.apiVersion && !fullUrl.includes('v=') && !fullUrl.includes('version=')) {
      const separator = fullUrl.includes('?') ? '&' : '?';
      fullUrl += `${separator}v=${this.config.apiVersion}`;
    }
    
    // Add query parameters
    if (params && Object.keys(params).length > 0) {
      const separator = fullUrl.includes('?') ? '&' : '?';
      const queryString = Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => {
          if (Array.isArray(value)) {
            return value
              .map(v => `${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`)
              .join('&');
          }
          return `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
        })
        .join('&');
      
      fullUrl += `${separator}${queryString}`;
    }
    
    return fullUrl;
  }
  
  /**
   * Build request headers
   * @param additionalHeaders Additional headers
   * @returns Headers object
   */
  private buildHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
    // Start with default headers
    const headers = { ...this.config.defaultHeaders };
    
    // Add auth token if available
    if (this.config.authToken) {
      headers[this.config.authHeaderName!] = `Bearer ${this.config.authToken}`;
    }
    
    // Add additional headers
    Object.entries(additionalHeaders).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        headers[key] = value;
      }
    });
    
    return headers;
  }
  
  /**
   * Calculate retry delay with exponential backoff and jitter
   * @param attempt Retry attempt number
   * @returns Delay in milliseconds
   */
  private calculateRetryDelay(attempt: number): number {
    const { baseDelay, maxDelay, useExponentialBackoff, useJitter } = this.config.retry!;
    
    // Calculate exponential backoff
    let delay = useExponentialBackoff
      ? Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay || Number.MAX_SAFE_INTEGER)
      : baseDelay;
    
    // Add jitter (±25%)
    if (useJitter) {
      const jitterFactor = 0.25;
      const jitterAmount = delay * jitterFactor;
      delay = delay - jitterAmount + Math.random() * jitterAmount * 2;
    }
    
    return delay;
  }
}

// Export a default instance
export const apiClient = new ApiClient({
  baseUrl: typeof window !== 'undefined' ? '' : 'http://localhost:5000', // Empty for browser, localhost for Node
});

// Export a factory function
export function createApiClient(config: ApiClientConfig): ApiClient {
  return new ApiClient(config);
}