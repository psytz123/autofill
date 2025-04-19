/**
 * Enhanced Query Hooks
 * Provides improved React Query hooks that integrate with our API service layer
 * offering better TypeScript integration, error handling, and caching
 */

import { 
  useQuery as useReactQuery, 
  UseQueryOptions, 
  UseQueryResult,
  QueryKey
} from "@tanstack/react-query";
import { getEndpointQueryOptions, buildQueryKey } from "@/lib/queryClient";
import { ApiResponse } from "@/api/base-api";
import api from "@/api";

// Helper types
type QueryFn<TData> = () => Promise<ApiResponse<TData>>;

// Custom query key type to ensure proper typing
export type AppQueryKey = QueryKey;

interface UseQueryHookOptions<TData, TError> extends 
  Omit<UseQueryOptions<TData, TError, TData, QueryKey>, 'queryKey' | 'queryFn'> {
  // Whether to enable the query (if false, query will not run)
  enabled?: boolean;
  
  // Whether to skip the cache and always refetch
  forceRefresh?: boolean;
  
  // How to handle 401 unauthorized responses
  on401?: "returnNull" | "throw";
  
  // Custom error handler
  onError?: (error: TError) => void;
  
  // Request timeout in milliseconds
  timeout?: number;
  
  // Number of retry attempts for failed requests
  retries?: number;
  
  // Whether to show loading indicators
  showLoading?: boolean;
  
  // Cache-related options
  staleTime?: number;
  gcTime?: number;
}

/**
 * Enhanced useQuery hook with consistent patterns
 * @param queryFn Function that returns a promise with the data
 * @param queryKey Key for caching and invalidating the query
 * @param options Additional options for the query
 * @returns Query result with additional fields for easier access
 */
export function useQuery<TData, TError = Error>(
  queryFn: QueryFn<TData>,
  queryKey: string | readonly unknown[],
  options: UseQueryHookOptions<TData, TError> = {}
) {
  // Normalize the query key to always be an array
  const normalizedQueryKey = Array.isArray(queryKey) ? queryKey : [queryKey];
  
  // Get endpoint-specific options if the first item is a string (API endpoint)
  const endpointOptions = typeof normalizedQueryKey[0] === 'string'
    ? getEndpointQueryOptions(normalizedQueryKey[0] as string)
    : {};
  
  // Enhanced query function that extracts data from ApiResponse
  const wrappedQueryFn = async (): Promise<TData> => {
    const response = await queryFn();
    
    if (response.error) {
      throw response.error;
    }
    
    return response.data!;
  };
  
  // Extract typed options from endpointOptions
  const {
    staleTime = 60000,
    gcTime = 300000,
    retry = 1,
    refetchOnWindowFocus = true,
    refetchOnMount = true,
    refetchOnReconnect = true,
  } = endpointOptions as {
    staleTime?: number;
    gcTime?: number;
    retry?: number;
    refetchOnWindowFocus?: boolean;
    refetchOnMount?: boolean | 'always';
    refetchOnReconnect?: boolean;
  };
  
  // Create options by merging defaults with provided options
  const queryOptions: UseQueryOptions<TData, TError, TData, QueryKey> = {
    queryKey: normalizedQueryKey as QueryKey,
    queryFn: wrappedQueryFn,
    enabled: options.enabled !== false, // Default to enabled
    refetchOnWindowFocus: options.refetchOnWindowFocus ?? refetchOnWindowFocus,
    refetchOnMount: options.refetchOnMount ?? refetchOnMount,
    refetchOnReconnect: options.refetchOnReconnect ?? refetchOnReconnect,
    retry: options.retries ?? retry,
    staleTime: options.forceRefresh ? 0 : (options.staleTime ?? staleTime),
    gcTime: options.gcTime ?? gcTime,
    ...options
  };
  
  // Use the underlying React Query hook
  const query = useReactQuery<TData, TError, TData, any>(queryOptions);
  
  // Return enhanced result with convenience fields
  return {
    ...query,
    data: query.data || null,
    isLoading: query.isLoading,
    isEmpty: !query.data || (Array.isArray(query.data) && query.data.length === 0),
  };
}

/**
 * Simplified hook for fetching data from API services
 * @param apiMethod Method reference from an API service (e.g., api.user.getCurrentUser)
 * @param params Parameters for the API method
 * @param queryKey Key for caching and invalidating the query
 * @param options Additional options for the query
 * @returns Query result
 */
export function useApiQuery<TData, TParams = void, TError = Error>(
  apiMethod: (params: TParams, options?: any) => Promise<ApiResponse<TData>>,
  params: TParams,
  queryKey: string | readonly unknown[],
  options: UseQueryHookOptions<TData, TError> = {}
) {
  const queryFn = () => apiMethod(params, {
    timeout: options.timeout,
    retries: options.retries,
  });
  
  return useQuery<TData, TError>(queryFn, queryKey, options);
}