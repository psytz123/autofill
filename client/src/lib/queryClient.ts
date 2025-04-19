import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getQueryOptionsForEndpoint, buildQueryKey } from "./query-cache-config";

// Add support for request cancellation
export const createAbortController = () => new AbortController();

// Interface for API query parameters
export interface ApiQueryOptions {
  on401: "returnNull" | "throw";
  timeout?: number;
  retries?: number;
  signal?: AbortSignal;
  category?: string;
}

/**
 * Helper function to check if a response is ok and throw appropriate errors
 */
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Try to parse error response as JSON first
    let errorText: string;
    
    try {
      const errorData = await res.json();
      errorText = errorData.message || errorData.error || res.statusText;
    } catch {
      // Fallback to text if not JSON
      errorText = await res.text() || res.statusText;
    }
    
    const error = new Error(`${res.status}: ${errorText}`);
    // Add status to error object for easier handling
    (error as any).status = res.status;
    throw error;
  }
}

/**
 * Enhanced query function with proper error handling
 * Supports cancellation, timeouts, retries and caching
 */
export const getQueryFn: <T>(options: ApiQueryOptions) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior, timeout = 30000, retries = 1, signal, category }) =>
  async ({ queryKey, signal: querySignal }) => {
    // Create a new abort controller
    const abortController = new AbortController();
    
    // If either signal aborts, abort our controller
    const handleAbort = () => abortController.abort();
    
    if (signal) {
      signal.addEventListener('abort', handleAbort);
    }
    
    if (querySignal) {
      querySignal.addEventListener('abort', handleAbort);
    }
    
    // Add timeout functionality
    const timeoutId = setTimeout(() => {
      abortController.abort('Request timed out');
    }, timeout);
    
    try {
      // Get the endpoint from the query key
      const endpoint = queryKey[0] as string;
      
      // Use the improved fetch implementation directly
      const response = await fetch(endpoint, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json',
        },
        signal: abortController.signal
      });
      
      // Clear timeout
      clearTimeout(timeoutId);
      
      // Handle 401 according to specified behavior for unauthorized responses
      if (response.status === 401) {
        if (unauthorizedBehavior === "returnNull") {
          return null;
        } else if (unauthorizedBehavior === "throw") {
          throw new Error('Unauthorized. Please log in to continue.');
        }
      }
      
      // Retry failed requests if we have retries left
      if (!response.ok && retries > 0) {
        console.log(`Query to ${endpoint} failed with status ${response.status}, retrying... (${retries} attempts left)`);
        
        // Wait with exponential backoff before retrying
        const backoffMs = Math.min(1000 * 2 ** (2 - retries), 10000);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        
        // Retry with one less retry attempt
        return getQueryFn({ 
          on401: unauthorizedBehavior, 
          timeout, 
          retries: retries - 1,
          signal,
          category
        })({ queryKey, signal: querySignal } as any);
      }
      
      // Handle unexpected errors
      if (!response.ok) {
        let errorMessage: string;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || response.statusText;
        } catch {
          errorMessage = await response.text() || response.statusText;
        }
        
        const error = new Error(`${response.status}: ${errorMessage}`);
        (error as any).status = response.status;
        throw error;
      }
      
      // Parse successful response
      if (response.headers.get('Content-Type')?.includes('application/json')) {
        return await response.json();
      } else {
        // Handle non-JSON responses
        const text = await response.text();
        try {
          // Try to parse it as JSON anyway
          return JSON.parse(text);
        } catch {
          // If it's not JSON, return as is
          return text as any;
        }
      }
    } catch (error: any) {
      // Clear timeout to prevent memory leaks
      clearTimeout(timeoutId);
      
      // For special error types, customize handling
      if (error.name === 'AbortError') {
        const abortError = new Error('Request was cancelled');
        abortError.name = 'AbortError';
        (abortError as any).status = 0;
        throw abortError;
      }
      
      // For network errors, retry if we have retries left
      if (error instanceof TypeError && 
          error.message.includes('network') && 
          retries > 0) {
        console.log(`Network error for ${queryKey[0]}, retrying... (${retries} attempts left)`);
        
        const backoffMs = Math.min(1000 * 2 ** (2 - retries), 10000);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        
        return getQueryFn({ 
          on401: unauthorizedBehavior, 
          timeout, 
          retries: retries - 1,
          signal,
          category
        })({ queryKey, signal: querySignal } as any);
      }
      
      // Better logging in development
      if (process.env.NODE_ENV !== 'production') {
        console.error(`Query error for ${queryKey[0]} (${category || 'unknown category'}):`, error);
      }
      
      throw error;
    } finally {
      // Clean up event listeners to prevent memory leaks
      if (signal) {
        signal.removeEventListener('abort', handleAbort);
      }
      
      if (querySignal) {
        querySignal.removeEventListener('abort', handleAbort);
      }
    }
  };

/**
 * Make API request with proper error handling
 * @param method HTTP method
 * @param url API endpoint
 * @param data Request data
 * @param options Request options
 * @returns Response object
 */
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: {
    timeout?: number;
    retries?: number;
    abortController?: AbortController;
    headers?: Record<string, string>;
  }
): Promise<Response> {
  console.log(`API Request: ${method} ${url}`, data ? { data } : '');
  
  // Get CSRF token
  let headers: HeadersInit = {
    'X-Requested-With': 'XMLHttpRequest',
    'Content-Type': 'application/json',
  };
      
  // Add CSRF token if needed for non-GET requests
  try {
    if (method !== 'GET') {
      const { getCsrfToken } = await import('./csrfToken');
      const token = getCsrfToken();
      headers['X-CSRF-Token'] = token;
      console.log('Using CSRF token:', token.substring(0, 5) + '...');
    }
  } catch (error) {
    console.warn('Failed to get CSRF token:', error);
  }
  
  // Add any custom headers
  if (options?.headers) {
    headers = { ...headers, ...options.headers };
  }
  
  // Set up timeout
  const timeoutMs = options?.timeout || 30000;
  const controller = options?.abortController || new AbortController();
  const timeoutId = setTimeout(() => controller.abort('Request timed out'), timeoutMs);
  
  try {
    console.log(`Sending ${method} request to ${url} with headers:`, headers);
    
    // Execute the request
    const response = await fetch(url, {
      method,
      headers,
      credentials: 'include',
      body: data ? JSON.stringify(data) : undefined,
      signal: controller.signal
    });
    
    // Clear timeout
    clearTimeout(timeoutId);
    
    // Log response details
    console.log(`Response from ${url}:`, {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries([...response.headers.entries()]),
      ok: response.ok
    });
    
    // Clone the response to avoid consuming it
    const clonedResponse = response.clone();
    
    // Log response body for debugging if it's JSON
    try {
      if (clonedResponse.headers.get('Content-Type')?.includes('application/json')) {
        const responseData = await clonedResponse.json();
        console.log(`Response data from ${url}:`, responseData);
      }
    } catch (error) {
      console.warn(`Could not parse response from ${url} as JSON:`, error);
    }
    
    // Return the original response
    return response;
  } catch (error) {
    // Clear timeout
    clearTimeout(timeoutId);
    
    console.error(`Request to ${url} failed:`, error);
    
    // Retry logic
    if (options?.retries && options.retries > 0) {
      console.log(`Request to ${url} failed, retrying... (${options.retries} attempts left)`);
      
      // Wait before retrying with exponential backoff
      const backoffMs = Math.min(1000 * 2 ** (3 - options.retries), 10000);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
      
      // Recursive retry with one less retry attempt
      return apiRequest(method, url, data, {
        ...options,
        retries: options.retries - 1
      });
    }
    
    // Create an error response if all retries failed
    const errorResponse = new Response(JSON.stringify({ 
      message: error instanceof Error ? error.message : String(error) 
    }), {
      status: (error as any).status || 500,
      statusText: error instanceof Error ? error.message : String(error),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    throw errorResponse;
  }
}

/**
 * Retrieve query options based on endpoint for consistent configuration
 * @param endpoint API endpoint
 * @returns Query options for React Query
 */
export function getEndpointQueryOptions(endpoint: string) {
  return getQueryOptionsForEndpoint(endpoint);
}

/**
 * Optimistic update helper for mutations
 * @param queryClient QueryClient instance
 * @param queryKey Query key to update
 * @param updateFn Function that updates the cached data
 */
export function optimisticUpdate<T>(
  queryKey: unknown[],
  updateFn: (oldData: T | undefined) => T
) {
  queryClient.setQueryData(queryKey, (oldData: T | undefined) => {
    return updateFn(oldData);
  });
}

// Configure the query client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchOnWindowFocus: true,
      retry: 1,
      staleTime: 60 * 1000, // 1 minute by default
      gcTime: 5 * 60 * 1000, // 5 minutes
      // Implement better error handling with throwOnError in React Query v5
      throwOnError: (error: Error) => {
        return (error as any).status >= 500;
      },
    },
    mutations: {
      retry: 1,
      // Show error toast notifications by default
      onError: (error: Error) => {
        // Only import when needed
        import('@/hooks/use-toast').then(({ useToast }) => {
          const { toast } = useToast();
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        });
        
        console.error('Mutation error:', error);
      }
    },
  },
});

// Re-export the buildQueryKey function for convenience
export { buildQueryKey };