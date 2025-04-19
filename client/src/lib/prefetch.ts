import { queryClient } from './queryClient';
import { QUERY_CATEGORIES } from './query-cache-config';

/**
 * Prefetch data for a specific route
 * Maps routes to prefetch functions for data-dependent pages
 */
export function prefetchRouteData(route: string): void {
  const prefetchMap: Record<string, () => void> = {
    '/': prefetchHomeData,
    '/order': prefetchOrderData,
    '/orders': prefetchOrdersData,
    '/vehicles': prefetchVehiclesData,
    '/account': prefetchAccountData,
    '/payment-methods': prefetchPaymentMethodsData,
    '/subscription': prefetchSubscriptionData,
  };

  const prefetchFn = prefetchMap[route];
  if (prefetchFn) {
    prefetchFn();
  }
}

/**
 * Prefetch critical data when the application loads
 * This improves perceived performance for the most commonly accessed data
 */
export function prefetchCriticalData(isAuthenticated: boolean): void {
  if (!isAuthenticated) return;

  // Stagger prefetches to avoid network contention
  setTimeout(() => prefetchHomeData(), 300);
  setTimeout(() => prefetchVehiclesData(), 800);
  setTimeout(() => prefetchOrdersData(), 1300);
}

/**
 * Helper to add prefetch options based on query category
 */
function getOptionsForCategory(category: keyof typeof QUERY_CATEGORIES) {
  return {
    staleTime: QUERY_CATEGORIES[category].staleTime,
    cacheTime: QUERY_CATEGORIES[category].gcTime
  };
}

/**
 * Prefetch functions for specific routes
 * Each function prefetches data needed for that route
 */
function prefetchHomeData(): void {
  queryClient.prefetchQuery({
    queryKey: ['/api/fuel-prices'],
    queryFn: () => fetch('/api/fuel-prices').then(res => res.json()),
    ...getOptionsForCategory('FUEL_PRICES')
  });

  queryClient.prefetchQuery({
    queryKey: ['/api/vehicles'],
    queryFn: () => fetch('/api/vehicles').then(res => res.json()),
    ...getOptionsForCategory('VEHICLES')
  });

  queryClient.prefetchQuery({
    queryKey: ['/api/recent-orders'],
    queryFn: () => fetch('/api/recent-orders').then(res => res.json()),
    ...getOptionsForCategory('ORDERS')
  });
}

function prefetchOrderData(): void {
  queryClient.prefetchQuery({
    queryKey: ['/api/vehicles'],
    queryFn: () => fetch('/api/vehicles').then(res => res.json()),
    ...getOptionsForCategory('VEHICLES')
  });

  queryClient.prefetchQuery({
    queryKey: ['/api/fuel-prices'],
    queryFn: () => fetch('/api/fuel-prices').then(res => res.json()),
    ...getOptionsForCategory('FUEL_PRICES')
  });

  queryClient.prefetchQuery({
    queryKey: ['/api/locations'],
    queryFn: () => fetch('/api/locations').then(res => res.json()),
    ...getOptionsForCategory('LOCATIONS')
  });
}

function prefetchOrdersData(): void {
  queryClient.prefetchQuery({
    queryKey: ['/api/orders'],
    queryFn: () => fetch('/api/orders').then(res => res.json()),
    ...getOptionsForCategory('ORDERS')
  });
}

function prefetchVehiclesData(): void {
  queryClient.prefetchQuery({
    queryKey: ['/api/vehicles'],
    queryFn: () => fetch('/api/vehicles').then(res => res.json()),
    ...getOptionsForCategory('VEHICLES')
  });
}

function prefetchAccountData(): void {
  queryClient.prefetchQuery({
    queryKey: ['/api/user'],
    queryFn: () => fetch('/api/user').then(res => res.json()),
    ...getOptionsForCategory('USER')
  });
}

function prefetchPaymentMethodsData(): void {
  queryClient.prefetchQuery({
    queryKey: ['/api/payment-methods'],
    queryFn: () => fetch('/api/payment-methods').then(res => res.json()),
    ...getOptionsForCategory('PAYMENT_METHODS')
  });
}

function prefetchSubscriptionData(): void {
  queryClient.prefetchQuery({
    queryKey: ['/api/subscription-plans'],
    queryFn: () => fetch('/api/subscription-plans').then(res => res.json()),
    ...getOptionsForCategory('DEFAULT')
  });
}