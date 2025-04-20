/**
 * Web API Client
 * Implements the shared API client functionality for web browsers
 */

import {
  ApiRequestOptions,
  ApiResponse,
  apiRequest as sharedApiRequest,
  createRequestHeaders
} from '@shared/utils/api-client';
import { addCsrfHeader } from './csrfToken';
import { PerformanceTimer } from '@shared/utils/analytics';

// Base URL for API requests
const API_BASE_URL = '/api';

/**
 * Create request headers with CSRF token for web platform
 */
async function createWebRequestHeaders(
  baseHeaders: HeadersInit = {}
): Promise<HeadersInit> {
  // Get base headers from shared utility
  const headers = await createRequestHeaders(baseHeaders, 'web');
  
  // Add CSRF token
  const csrfHeaders = await addCsrfHeader();
  
  return {
    ...headers,
    ...csrfHeaders
  };
}

/**
 * Execute a fetch request with enhanced features
 */
export async function apiRequest<T>(
  method: string,
  endpoint: string,
  data?: any,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  // Start timing the request
  const timer = new PerformanceTimer();
  
  // Create web-specific headers
  const headers = await createWebRequestHeaders(options.headers);
  
  // Full URL for the request
  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  try {
    // Make the request using the shared utility
    const response = await sharedApiRequest<T>(method, url, data, {
      ...options,
      headers
    });
    
    // Track API response time
    const duration = timer.getElapsedTime();
    
    // Log performance data (this could be sent to an analytics service)
    console.debug(`API ${method} ${endpoint} completed in ${duration.toFixed(2)}ms`);
    
    return response;
  } catch (error) {
    console.error(`API request failed: ${method} ${endpoint}`, error);
    throw error;
  }
}

/**
 * HTTP method wrappers
 */
export async function get<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  return apiRequest<T>('GET', endpoint, undefined, options);
}

export async function post<T>(
  endpoint: string,
  data?: any,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  return apiRequest<T>('POST', endpoint, data, options);
}

export async function put<T>(
  endpoint: string,
  data?: any,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  return apiRequest<T>('PUT', endpoint, data, options);
}

export async function patch<T>(
  endpoint: string,
  data?: any,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  return apiRequest<T>('PATCH', endpoint, data, options);
}

export async function del<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  return apiRequest<T>('DELETE', endpoint, undefined, options);
}