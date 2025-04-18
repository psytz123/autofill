import { queryClient, QUERY_CATEGORIES } from "./queryClient";

/**
 * Prefetch critical data for the application to improve perceived performance
 * @param isAuthenticated Boolean indicating if user is authenticated
 */
export async function prefetchCriticalData(isAuthenticated: boolean = false) {
  // Only fetch user-specific data if authenticated
  if (isAuthenticated) {
    // Prefetch user details
    queryClient.prefetchQuery({
      queryKey: ['/api/user'],
      staleTime: QUERY_CATEGORIES.USER.staleTime
    });
    
    // Prefetch vehicles list (needed on dashboard)
    queryClient.prefetchQuery({
      queryKey: ['/api/vehicles'],
      staleTime: QUERY_CATEGORIES.VEHICLES.staleTime
    });
    
    // Prefetch recent orders (needed on dashboard)
    queryClient.prefetchQuery({
      queryKey: ['/api/orders/recent'],
      staleTime: QUERY_CATEGORIES.RECENT_ORDERS.staleTime
    });
  }
  
  // Prefetch fuel prices (needed for all users)
  queryClient.prefetchQuery({
    queryKey: ['fuelPrices'],
    staleTime: QUERY_CATEGORIES.FUEL_PRICES.staleTime
  });
}

/**
 * Prefetch data specifically needed for the orders page
 */
export function prefetchOrdersData() {
  queryClient.prefetchQuery({
    queryKey: ['/api/orders'],
    staleTime: QUERY_CATEGORIES.ORDERS.staleTime
  });
}

/**
 * Prefetch data specifically needed for vehicle management
 */
export function prefetchVehiclesData() {
  queryClient.prefetchQuery({
    queryKey: ['/api/vehicles'],
    staleTime: QUERY_CATEGORIES.VEHICLES.staleTime
  });
}

/**
 * Prefetch data needed for payment methods management
 */
export function prefetchPaymentMethodsData() {
  queryClient.prefetchQuery({
    queryKey: ['/api/payment-methods'],
    staleTime: QUERY_CATEGORIES.PAYMENT_METHODS.staleTime
  });
}

/**
 * Prefetch saved locations data
 */
export function prefetchLocationsData() {
  queryClient.prefetchQuery({
    queryKey: ['/api/locations'],
    staleTime: QUERY_CATEGORIES.LOCATIONS.staleTime
  });
}

/**
 * Call this function when hovering over a link or button to prefetch data for the upcoming page
 * @param route The route that the user might navigate to
 */
export function prefetchRouteData(route: string) {
  // Determine which data to prefetch based on the route
  switch (route) {
    case '/orders':
      prefetchOrdersData();
      break;
    case '/vehicles':
      prefetchVehiclesData();
      break;
    case '/payment-methods':
      prefetchPaymentMethodsData();
      break;
    case '/order':
      // For new orders, we need vehicles, locations, and payment methods
      prefetchVehiclesData();
      prefetchLocationsData();
      prefetchPaymentMethodsData();
      break;
    case '/subscription':
      // For subscription page, prefetch payment methods and user subscription status
      prefetchPaymentMethodsData();
      queryClient.prefetchQuery({
        queryKey: ['/api/subscription/status'],
        staleTime: QUERY_CATEGORIES.DEFAULT.staleTime
      });
      break;
    default:
      // For unknown routes, don't prefetch anything
      break;
  }
}