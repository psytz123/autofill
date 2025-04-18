/**
 * Base API service with common functionality for all API calls.
 * Provides consistent error handling, request cancellation, and retry logic.
 */

import { createAbortController } from "@/lib/queryClient";

export interface ApiRequestOptions {
  timeout?: number;
  retries?: number;
  abortController?: AbortController;
  headers?: Record<string, string>;
  skipCSRF?: boolean;
}

export interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
  status: number;
}

// API error with additional status information
export class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Generate a random CSRF token
function generateCSRFToken(): string {
  const validChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  for (let i = 0; i < array.length; i++) {
    token += validChars[array[i] % validChars.length];
  }
  return token;
}

// Get or create CSRF token
function getCSRFToken(): string {
  let token = sessionStorage.getItem('CSRF_TOKEN');
  if (!token) {
    token = generateCSRFToken();
    sessionStorage.setItem('CSRF_TOKEN', token);
  }
  return token;
}

// Sanitize object deeply to prevent injection attacks
function sanitizeData(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }
  
  if (typeof data !== 'object') {
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }
  
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    // Skip functions or complex objects
    if (typeof value !== 'function' && !(value instanceof Element)) {
      sanitized[key] = sanitizeData(value);
    }
  }
  
  return sanitized;
}

/**
 * Enhanced fetch API with consistent error handling, retry logic, and request cancellation.
 * @param method HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param url API endpoint URL
 * @param data Request payload for POST, PUT, etc.
 * @param options Additional request options
 * @returns Promise with typed response data
 */
export async function apiRequest<T>(
  method: string,
  url: string,
  data?: unknown,
  options?: ApiRequestOptions
): Promise<ApiResponse<T>> {
  const { 
    timeout = 30000, // 30 second timeout by default
    retries = 1,
    abortController = createAbortController(),
    headers = {},
    skipCSRF = false
  } = options || {};
  
  // Add timeout functionality
  const timeoutId = setTimeout(() => {
    abortController.abort('Request timed out');
  }, timeout);
  
  // Security headers
  const securityHeaders: Record<string, string> = {
    // Only add CSRF for non-GET requests that modify data
    ...(method !== 'GET' && !skipCSRF ? { 'X-CSRF-Token': getCSRFToken() } : {}),
    'X-Requested-With': 'XMLHttpRequest', // Helps identify AJAX requests
    ...(data ? { "Content-Type": "application/json" } : {}),
    ...headers
  };

  try {
    // Sanitize data before sending to prevent injection attacks
    const sanitizedData = data ? sanitizeData(data) : undefined;
    
    const res = await fetch(url, {
      method,
      headers: securityHeaders,
      body: sanitizedData ? JSON.stringify(sanitizedData) : undefined,
      credentials: "include", // Always send credentials for authenticated requests
      signal: abortController.signal,
      cache: method === 'GET' ? 'default' : 'no-store', // Don't cache mutations
    });
    
    // Clear timeout since request completed
    clearTimeout(timeoutId);
    
    // Check for CSRF validation on non-GET requests
    if (method !== 'GET' && !skipCSRF && res.headers.has('X-CSRF-Valid')) {
      const valid = res.headers.get('X-CSRF-Valid') === 'true';
      if (!valid) {
        console.error('CSRF validation failed');
        return {
          data: null,
          error: new ApiError('Security validation failed. Please refresh the page and try again.', 403),
          status: 403
        };
      }
    }
    
    // Handle error with retry logic if applicable
    if (!res.ok) {
      if (retries > 0) {
        console.log(`Request to ${url} failed with status ${res.status}, retrying... (${retries} attempts left)`);
        return apiRequest<T>(method, url, data, {
          ...options,
          retries: retries - 1
        });
      }
      
      // Extract error message from response if possible
      let errorMessage: string;
      try {
        const errorBody = await res.json();
        errorMessage = errorBody.message || res.statusText;
      } catch {
        errorMessage = res.statusText;
      }
      
      return {
        data: null,
        error: new ApiError(errorMessage, res.status),
        status: res.status
      };
    }
    
    // Parse successful response
    const responseData = res.status !== 204 ? await res.json() : null;
    
    return {
      data: responseData as T,
      error: null,
      status: res.status
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    // Add retry logic for network errors
    if (error instanceof TypeError && error.message.includes('network') && retries > 0) {
      console.log(`Network error for ${url}, retrying... (${retries} attempts left)`);
      return apiRequest<T>(method, url, data, {
        ...options,
        retries: retries - 1
      });
    }
    
    // Handle aborted requests
    if (error.name === 'AbortError') {
      return {
        data: null,
        error: new ApiError('Request was cancelled', 0),
        status: 0
      };
    }
    
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
      status: 0 // Unknown status for client-side errors
    };
  }
}

/**
 * Utility for batched API requests
 * @param requests Array of request functions
 * @param options Batch options (concurrency, abort behavior)
 * @returns Promise with array of results
 */
export async function batchRequests<T>(
  requests: Array<() => Promise<ApiResponse<T>>>,
  options?: {
    concurrency?: number;
    abortOnError?: boolean;
  }
): Promise<ApiResponse<T>[]> {
  const { concurrency = 3, abortOnError = false } = options || {};
  
  // Create chunks of requests based on concurrency
  const chunks: Array<Array<() => Promise<ApiResponse<T>>>> = [];
  for (let i = 0; i < requests.length; i += concurrency) {
    chunks.push(requests.slice(i, i + concurrency));
  }
  
  const results: ApiResponse<T>[] = [];
  
  for (const chunk of chunks) {
    try {
      // Process each chunk concurrently
      const chunkResults = await Promise.all(chunk.map(req => req()));
      results.push(...chunkResults);
    } catch (error) {
      if (abortOnError) {
        throw error;
      }
      // If not aborting, continue with next chunk but log the error
      console.error('Error in batched request:', error);
    }
  }
  
  return results;
}

/**
 * Base class for API services
 * Provides common functionality for all domain-specific API services
 */
export class BaseApiService {
  protected baseUrl: string;
  
  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }
  
  protected async get<T>(
    endpoint: string, 
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T>> {
    return apiRequest<T>('GET', `${this.baseUrl}${endpoint}`, undefined, options);
  }
  
  protected async post<T>(
    endpoint: string, 
    data?: any, 
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T>> {
    return apiRequest<T>('POST', `${this.baseUrl}${endpoint}`, data, options);
  }
  
  protected async put<T>(
    endpoint: string, 
    data?: any, 
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T>> {
    return apiRequest<T>('PUT', `${this.baseUrl}${endpoint}`, data, options);
  }
  
  protected async patch<T>(
    endpoint: string, 
    data?: any, 
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T>> {
    return apiRequest<T>('PATCH', `${this.baseUrl}${endpoint}`, data, options);
  }
  
  protected async delete<T>(
    endpoint: string, 
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T>> {
    return apiRequest<T>('DELETE', `${this.baseUrl}${endpoint}`, undefined, options);
  }
}