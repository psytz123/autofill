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
  ({ on401: unauthorizedBehavior, timeout = 30000, retries = 1, signal }) =>
  async ({ queryKey, signal: querySignal }) => {
    // Create a new abort controller that combines the signal from QueryClient
    // and the signal provided in getQueryFn (if any)
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
      const endpoint = queryKey[0] as string;
      
      // Use standard fetch with better error handling
      const res = await fetch(endpoint, {
        credentials: "include",
        signal: abortController.signal,
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        }
      });
      
      // Clear timeout since request completed
      clearTimeout(timeoutId);
      
      // Handle 401 according to specified behavior
      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }
      
      // Handle error with retry logic
      if (!res.ok && retries > 0) {
        console.log(`Query request to ${endpoint} failed with status ${res.status}, retrying... (${retries} attempts left)`);
        
        // Wait a bit before retrying (with exponential backoff)
        const backoffMs = Math.min(1000 * 2 ** (2 - retries), 10000);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        
        return getQueryFn({ 
          on401: unauthorizedBehavior, 
          timeout, 
          retries: retries - 1,
          signal
        })({ queryKey, signal: querySignal } as any);
      }
      
      await throwIfResNotOk(res);
      
      // Parse response as JSON
      const data = await res.json();
      return data;
    } catch (error: any) {
      // Clear timeout to prevent memory leaks
      clearTimeout(timeoutId);
      
      // If aborted, rethrow as is
      if (error.name === 'AbortError') {
        throw error;
      }
      
      // For network errors, retry if retries > 0
      if (error instanceof TypeError && error.message.includes('network') && retries > 0) {
        console.log(`Network error for ${queryKey[0]}, retrying... (${retries} attempts left)`);
        
        const backoffMs = Math.min(1000 * 2 ** (2 - retries), 10000);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        
        return getQueryFn({ 
          on401: unauthorizedBehavior, 
          timeout, 
          retries: retries - 1,
          signal
        })({ queryKey, signal: querySignal } as any);
      }
      
      // Add better debugging information to error
      if (process.env.NODE_ENV !== 'production') {
        console.error(`Query error for ${queryKey[0]}:`, error);
      }
      
      throw error;
    } finally {
      // Clean up event listeners
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
  // Use the enhanced API from base-api.ts
  const { baseApi } = await import('@/api/base-api');
  
  try {
    const response = await baseApi.apiRequest(method, url, data, options);
    
    if (response.error) {
      throw response.error;
    }
    
    // Create a mock response for compatibility
    const mockResponse = new Response(JSON.stringify(response.data), {
      status: response.status,
      statusText: '',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return mockResponse;
  } catch (error) {
    // Create an error response
    const errorResponse = new Response(JSON.stringify({ message: error instanceof Error ? error.message : String(error) }), {
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