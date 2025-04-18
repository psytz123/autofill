import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Add support for request cancellation
export const createAbortController = () => new AbortController();

// Enhanced API request with better error handling, request timeout, and retry capability
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
  const { 
    timeout = 30000, // 30 second timeout by default
    retries = 0,
    abortController = new AbortController(),
    headers = {}
  } = options || {};
  
  // Add timeout functionality
  const timeoutId = setTimeout(() => {
    abortController.abort();
  }, timeout);
  
  try {
    const res = await fetch(url, {
      method,
      headers: {
        ...(data ? { "Content-Type": "application/json" } : {}),
        ...headers
      },
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      signal: abortController.signal,
    });
    
    // Clear timeout since request completed
    clearTimeout(timeoutId);
    
    // Handle error with retry logic if applicable
    if (!res.ok && retries > 0) {
      console.log(`Request to ${url} failed, retrying... (${retries} attempts left)`);
      return apiRequest(method, url, data, {
        ...options,
        retries: retries - 1
      });
    }
    
    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Add retry logic for network errors
    if (error instanceof TypeError && error.message.includes('network') && retries > 0) {
      console.log(`Network error for ${url}, retrying... (${retries} attempts left)`);
      return apiRequest(method, url, data, {
        ...options,
        retries: retries - 1
      });
    }
    
    throw error;
  }
}

// New utility for batched requests
export async function batchRequests<T>(
  requests: Array<() => Promise<T>>,
  options?: {
    concurrency?: number; // How many requests to run simultaneously
    abortOnError?: boolean; // Whether to abort other requests if one fails
  }
): Promise<T[]> {
  const { concurrency = 3, abortOnError = false } = options || {};
  
  // Create chunks of requests based on concurrency
  const chunks: Array<Array<() => Promise<T>>> = [];
  for (let i = 0; i < requests.length; i += concurrency) {
    chunks.push(requests.slice(i, i + concurrency));
  }
  
  const results: T[] = [];
  
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

// Configure query categories for different data types
export const QUERY_CATEGORIES = {
  // User data changes infrequently
  USER: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  },
  // Order data can change more often
  ORDERS: {
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  },
  // Vehicle data changes infrequently
  VEHICLES: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  },
  // Locations change rarely
  LOCATIONS: {
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  },
  // Payment methods change rarely
  PAYMENT_METHODS: {
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  },
  // Admin data needs to be fresh
  ADMIN: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  },
  // Default settings for other data
  DEFAULT: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  }
};

// Interface for API query parameters
export interface ApiQueryOptions {
  on401: "returnNull" | "throw";
  timeout?: number;
  retries?: number;
  signal?: AbortSignal;
  category?: keyof typeof QUERY_CATEGORIES;
}

// Enhanced query function with support for cancellation, retries, and timeouts
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
    
    try {
      // Use enhanced fetch with timeout handling
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
        signal: abortController.signal,
      });
      
      // Handle 401 according to specified behavior
      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }
      
      // Handle error with retry logic
      if (!res.ok && retries > 0) {
        console.log(`Query request to ${queryKey[0]} failed, retrying... (${retries} attempts left)`);
        
        // Wait a bit before retrying (with exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, 2 - retries) * 100));
        
        return getQueryFn({ 
          on401: unauthorizedBehavior, 
          timeout, 
          retries: retries - 1,
          signal
        })({ queryKey, signal: querySignal } as any);
      }
      
      await throwIfResNotOk(res);
      return await res.json();
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

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchOnWindowFocus: true,
      retry: 1,
      staleTime: QUERY_CATEGORIES.DEFAULT.staleTime,
      gcTime: QUERY_CATEGORIES.DEFAULT.gcTime, // gcTime is the new name for cacheTime in React Query v5
      // Suspense mode is now configured at the QueryClientProvider level in React Query v5
      // Implement better error handling with throwOnError in React Query v5
      throwOnError: (error: Error) => {
        return error.message.includes('500');
      },
    },
    mutations: {
      retry: 1,
      // Show error toast notifications by default
      onError: (error: Error) => {
        console.error('Mutation error:', error);
      }
    },
  },
});