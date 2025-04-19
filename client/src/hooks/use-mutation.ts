/**
 * Enhanced Mutation Hooks
 * Provides improved React Query mutation hooks that integrate with our API service layer
 * offering better TypeScript integration, error handling, and optimistic updates
 */

import { 
  useMutation as useReactMutation, 
  UseMutationOptions, 
  UseMutationResult, 
  MutationKey 
} from "@tanstack/react-query";
import { queryClient, optimisticUpdate } from "@/lib/queryClient";
import { ApiResponse } from "@/api/base-api";
import { useToast } from "./use-toast";
import api from "@/api";

// Helper types
type MutationFn<TData, TVariables> = (variables: TVariables) => Promise<ApiResponse<TData>>;
type OptimisticUpdateFn<TData, TVariables> = (variables: TVariables, oldData?: TData) => TData;
type InvalidateQueryFn<TVariables> = (variables: TVariables) => string | string[] | readonly unknown[][];

interface UseMutationHookOptions<TData, TVariables> extends 
  Omit<UseMutationOptions<TData, Error, TVariables, unknown>, 'mutationFn'> {
  // Function to call for the mutation
  mutationFn: MutationFn<TData, TVariables>;
  
  // Optional optimistic update function
  optimisticUpdate?: OptimisticUpdateFn<TData, TVariables>;
  
  // Query key(s) to invalidate after successful mutation
  invalidateQueries?: string | string[] | InvalidateQueryFn<TVariables>;
  
  // Success message to show (if not provided, no toast is shown)
  successMessage?: string | ((data: TData) => string);
  
  // Error message to show (if not provided, the error message from the API is used)
  errorMessage?: string | ((error: Error) => string);
  
  // Query key to optimistically update
  optimisticQueryKey?: string | readonly unknown[];
}

/**
 * Custom hook for data mutations with consistent error handling
 * @param options Mutation options
 * @returns Mutation result with easier access to data and loading state
 */
export function useMutation<TData, TVariables = unknown>(
  options: UseMutationHookOptions<TData, TVariables>
): UseMutationResult<TData, Error, TVariables, unknown> & {
  isSuccess: boolean;
  data: TData | null;
} {
  const { toast } = useToast();
  
  const {
    mutationFn,
    optimisticUpdate: optimisticUpdateFn,
    invalidateQueries,
    successMessage,
    errorMessage,
    optimisticQueryKey,
    ...mutationOptions
  } = options;
  
  // Create wrapped mutation function that extracts data from ApiResponse
  const wrappedMutationFn = async (variables: TVariables): Promise<TData> => {
    const response = await mutationFn(variables);
    
    if (response.error) {
      throw response.error;
    }
    
    return response.data!;
  };
  
  // Enhanced onSuccess handler
  const onSuccess = async (data: TData, variables: TVariables, context: unknown) => {
    // Call the original onSuccess if provided
    if (options.onSuccess) {
      await options.onSuccess(data, variables, context);
    }
    
    // Show success toast if requested
    if (successMessage) {
      const message = typeof successMessage === 'function'
        ? successMessage(data)
        : successMessage;
      
      toast({
        title: "Success",
        description: message,
        variant: "default",
      });
    }
    
    // Invalidate relevant queries
    if (invalidateQueries) {
      if (typeof invalidateQueries === 'function') {
        const queryKeys = invalidateQueries(variables);
        if (Array.isArray(queryKeys)) {
          const isNestedArray = Array.isArray(queryKeys[0]);
          if (isNestedArray) {
            await Promise.all((queryKeys as readonly unknown[][]).map(key => 
              queryClient.invalidateQueries({ queryKey: key })
            ));
          } else {
            await Promise.all((queryKeys as string[]).map(key => 
              queryClient.invalidateQueries({ queryKey: [key] })
            ));
          }
        } else {
          await queryClient.invalidateQueries({ queryKey: [queryKeys] });
        }
      } else if (Array.isArray(invalidateQueries)) {
        await Promise.all(invalidateQueries.map(queryKey => 
          queryClient.invalidateQueries({ queryKey: [queryKey] })
        ));
      } else {
        await queryClient.invalidateQueries({ queryKey: [invalidateQueries] });
      }
    }
  };
  
  // Enhanced onError handler
  const onError = (error: Error, variables: TVariables, context: unknown) => {
    // Call the original onError if provided
    if (options.onError) {
      options.onError(error, variables, context);
    }
    
    // Show error toast unless disabled
    if (errorMessage !== null) {
      const message = typeof errorMessage === 'function'
        ? errorMessage(error)
        : errorMessage || error.message;
      
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };
  
  // Enhanced onMutate handler for optimistic updates
  const onMutate = async (variables: TVariables) => {
    // Call the original onMutate if provided
    const originalContext = options.onMutate 
      ? await options.onMutate(variables)
      : undefined;
    
    // Skip optimistic update if not configured
    if (!optimisticUpdateFn || !optimisticQueryKey) {
      return originalContext;
    }
    
    // Prepare the query key
    const queryKey = Array.isArray(optimisticQueryKey) 
      ? optimisticQueryKey 
      : [optimisticQueryKey];
    
    // Cancel any outgoing refetches
    await queryClient.cancelQueries({ queryKey });
    
    // Snapshot the previous value
    const previousData = queryClient.getQueryData<TData>(queryKey);
    
    // Optimistically update to the new value
    queryClient.setQueryData<TData>(queryKey, old => {
      return optimisticUpdateFn(variables, old);
    });
    
    // Return a context object with the snapshotted value
    return {
      ...originalContext,
      previousData,
      queryKey,
    };
  };
  
  // Setup rollback for optimistic updates
  const onSettled = (
    data: TData | undefined,
    error: Error | null,
    variables: TVariables,
    context: any,
  ) => {
    // Call the original onSettled if provided
    if (options.onSettled) {
      options.onSettled(data, error, variables, context);
    }
    
    // If there was an error and we have previousData from optimistic update, roll back
    if (error && context?.previousData && context?.queryKey) {
      queryClient.setQueryData(context.queryKey, context.previousData);
    }
  };
  
  // Create the mutation with our enhanced handlers
  const mutation = useReactMutation({
    ...mutationOptions,
    mutationFn: wrappedMutationFn,
    onMutate,
    onSuccess,
    onError,
    onSettled,
  });
  
  // Add convenience fields
  return {
    ...mutation,
    isSuccess: mutation.isSuccess,
    data: mutation.data || null,
  };
}

/**
 * Simplified hook for creating a mutation that works with API services
 * @param apiMethod Method reference from an API service (e.g., api.user.login)
 * @param options Mutation options
 * @returns Mutation result
 */
export function useApiMutation<TData, TVariables>(
  apiMethod: (variables: TVariables, options?: any) => Promise<ApiResponse<TData>>,
  options: Omit<UseMutationHookOptions<TData, TVariables>, 'mutationFn'> = {}
) {
  return useMutation({
    ...options,
    mutationFn: apiMethod,
  });
}