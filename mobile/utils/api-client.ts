/**
 * Mobile API Client
 * Implements the shared API client functionality for mobile apps
 */

import {
  ApiRequestOptions,
  ApiResponse,
  apiRequest as sharedApiRequest,
  createRequestHeaders
} from '../../shared/utils/api-client';
import { PerformanceTimer } from '../../shared/utils/analytics';

// Base URL for API requests - adjust for production/development
// For development with Expo, use the local machine's IP address instead of localhost
const API_BASE_URL = __DEV__ 
  ? 'http://192.168.1.100:5000/api' // Replace with your development machine's IP
  : 'https://autofill-app.replit.app/api';

// Flag to control debug logging
const DEBUG_ENABLED = __DEV__;

/**
 * Create request headers for mobile platform
 */
async function createMobileRequestHeaders(
  baseHeaders: HeadersInit = {}
): Promise<HeadersInit> {
  // Get base headers from shared utility
  const headers = await createRequestHeaders(baseHeaders, 'mobile');
  
  // Add mobile-specific headers if needed
  return {
    ...headers,
    'X-Client-Platform': 'mobile',
    'X-Client-Version': '1.0.0', // This should be dynamically fetched from app config
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
  
  // Create mobile-specific headers
  const headers = await createMobileRequestHeaders(options.headers);
  
  // Full URL for the request
  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  if (DEBUG_ENABLED) {
    console.log(`API Request: ${method} ${url}`);
    if (data) console.log('Request data:', data);
  }
  
  try {
    // Make the request using the shared utility
    const response = await sharedApiRequest<T>(method, url, data, {
      ...options,
      headers
    });
    
    // Track API response time
    const duration = timer.getElapsedTime();
    
    if (DEBUG_ENABLED) {
      console.log(`API Response (${duration.toFixed(2)}ms):`, response);
    }
    
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