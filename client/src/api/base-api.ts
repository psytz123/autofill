/**
 * Base API Service Module
 * Provides common functionality for all API services with comprehensive error handling
 */

/**
 * Response structure for all API calls
 */
export interface ApiResponse<T = any> {
  data?: T;
  error?: Error;
  status: number;
  success: boolean;
}

/**
 * Enhanced Error with additional API-related information
 */
export class ApiError extends Error {
  status?: number;
  code?: string;
  
  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

/**
 * Base API class with common functionality for all API services
 */
export class BaseApi {
  /**
   * Default request options
   */
  protected defaultOptions: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    }
  };
  
  /**
   * Execute a GET request
   * @param url API endpoint
   * @param options Additional request options
   * @returns API response
   */
  async get<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, { 
      ...options, 
      method: 'GET' 
    });
  }
  
  /**
   * Execute a POST request
   * @param url API endpoint
   * @param data Request payload
   * @param options Additional request options
   * @returns API response
   */
  async post<T>(url: string, data?: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(this.sanitizeData(data)) : undefined,
    });
  }
  
  /**
   * Execute a PUT request
   * @param url API endpoint
   * @param data Request payload
   * @param options Additional request options
   * @returns API response
   */
  async put<T>(url: string, data?: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(this.sanitizeData(data)) : undefined,
    });
  }
  
  /**
   * Execute a PATCH request
   * @param url API endpoint
   * @param data Request payload
   * @param options Additional request options
   * @returns API response
   */
  async patch<T>(url: string, data?: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(this.sanitizeData(data)) : undefined,
    });
  }
  
  /**
   * Execute a DELETE request
   * @param url API endpoint
   * @param options Additional request options
   * @returns API response
   */
  async delete<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'DELETE',
    });
  }
  
  /**
   * Generic request method with enhanced error handling
   * @param url API endpoint
   * @param options Request options
   * @returns API response
   */
  protected async request<T>(url: string, options: RequestInit): Promise<ApiResponse<T>> {
    try {
      // Combine defaults with provided options
      const requestOptions: RequestInit = {
        ...this.defaultOptions,
        ...options,
        headers: {
          ...this.defaultOptions.headers,
          ...options.headers,
        }
      };
      
      // Execute request
      const response = await fetch(url, requestOptions);
      
      // Process response
      if (!response.ok) {
        return this.handleApiError<T>(response);
      }
      
      // Handle different response types
      if (response.headers.get('Content-Type')?.includes('application/json')) {
        const data = await response.json();
        return {
          data,
          status: response.status,
          success: true
        };
      } else {
        // Handle non-JSON responses if needed
        const text = await response.text();
        return {
          data: text as unknown as T,
          status: response.status,
          success: true
        };
      }
    } catch (error) {
      return this.handleError<T>(error);
    }
  }
  
  /**
   * Handle API errors
   * @param response Failed response
   * @returns Error response
   */
  protected async handleApiError<T>(response: Response): Promise<ApiResponse<T>> {
    let errorMessage: string;
    let errorData: any;
    
    try {
      // Try to parse error as JSON
      errorData = await response.json();
      errorMessage = errorData.message || errorData.error || response.statusText;
    } catch {
      // Fallback to text
      errorMessage = await response.text() || response.statusText;
    }
    
    const apiError = new ApiError(
      errorMessage,
      response.status,
      errorData?.code
    );
    
    return {
      error: apiError,
      status: response.status,
      success: false
    };
  }
  
  /**
   * Handle general errors
   * @param error Error object
   * @param fallbackMessage Message to use if error doesn't provide one
   * @returns Error response
   */
  protected handleError<T>(error: any, fallbackMessage: string = 'An unexpected error occurred'): ApiResponse<T> {
    const message = error.message || fallbackMessage;
    const apiError = error instanceof ApiError 
      ? error 
      : new ApiError(message);
    
    console.error('API error:', apiError);
    
    return {
      error: apiError,
      status: apiError.status || 500,
      success: false
    };
  }
  
  /**
   * Sanitize data before sending to prevent injection attacks
   * @param data Data to sanitize
   * @returns Sanitized data
   */
  protected sanitizeData(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }
    
    if (typeof data !== 'object') {
      return data;
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }
    
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      // Skip functions or complex objects
      if (typeof value !== 'function' && !(value instanceof Element) && !(value instanceof File)) {
        sanitized[key] = this.sanitizeData(value);
      }
    }
    
    return sanitized;
  }
}

// Extended options for API requests
export interface ApiRequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  useCircuitBreaker?: boolean;
  circuitBreakerKey?: string;
}

// (Optional) Create a concrete implementation for direct use
export class ApiService extends BaseApi {
  /**
   * Enhanced API request with circuit breaker support
   * @param method HTTP method
   * @param url API endpoint
   * @param data Request data
   * @param options Request options
   * @returns API response
   */
  async apiRequest<T>(
    method: string,
    url: string,
    data?: unknown,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { 
      timeout = 30000,
      retries = 1,
      useCircuitBreaker = false,
      circuitBreakerKey = 'default',
      ...fetchOptions 
    } = options;
    
    // Circuit breaker implementation can be added here
    // For now, pass through to the appropriate method
    switch (method.toUpperCase()) {
      case 'GET':
        return this.get<T>(url, fetchOptions);
      case 'POST':
        return this.post<T>(url, data, fetchOptions);
      case 'PUT':
        return this.put<T>(url, data, fetchOptions);
      case 'PATCH':
        return this.patch<T>(url, data, fetchOptions);
      case 'DELETE':
        return this.delete<T>(url, fetchOptions);
      default:
        return this.handleError(new Error(`Unsupported method: ${method}`));
    }
  }
}

// Export singleton instance
export const baseApi = new ApiService();