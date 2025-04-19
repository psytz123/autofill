/**
 * Query Cache Configuration
 * Centralizes caching strategies for different data types
 * Provides optimized settings for React Query
 */

// Time durations in milliseconds
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Cache configuration for different query categories
 * - staleTime: How long data is considered fresh
 * - gcTime: How long to keep unused data in cache
 */
export const QUERY_CATEGORIES = {
  // User data changes infrequently
  USER: {
    staleTime: 5 * MINUTE,
    gcTime: HOUR,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 2,
  },
  
  // Order data can change more often
  ORDERS: {
    staleTime: MINUTE,
    gcTime: 10 * MINUTE,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 2,
  },
  
  // Recent orders (for dashboard) need to be up to date
  RECENT_ORDERS: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * MINUTE,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 2,
  },
  
  // Vehicle data changes infrequently
  VEHICLES: {
    staleTime: 10 * MINUTE,
    gcTime: HOUR,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 1,
  },
  
  // Locations change rarely
  LOCATIONS: {
    staleTime: 30 * MINUTE,
    gcTime: DAY,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 1,
  },
  
  // Fuel prices need to update occasionally
  FUEL_PRICES: {
    staleTime: 15 * MINUTE,
    gcTime: HOUR,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 3,
  },
  
  // Home dashboard data
  DASHBOARD: {
    staleTime: MINUTE,
    gcTime: 5 * MINUTE,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 2,
  },
  
  // Payment methods change rarely
  PAYMENT_METHODS: {
    staleTime: HOUR,
    gcTime: DAY,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 1,
  },
  
  // Subscription plans change rarely
  SUBSCRIPTION_PLANS: {
    staleTime: DAY,
    gcTime: 7 * DAY,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  },
  
  // Admin data needs to be fresh
  ADMIN: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * MINUTE,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 2,
  },
  
  // Default settings for other data
  DEFAULT: {
    staleTime: 2 * MINUTE,
    gcTime: 30 * MINUTE,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 1,
  }
};

/**
 * Map API endpoints to their appropriate query category for automatic configuration
 */
export const ENDPOINT_CATEGORY_MAP: Record<string, keyof typeof QUERY_CATEGORIES> = {
  '/api/user': 'USER',
  '/api/register': 'USER',
  '/api/login': 'USER',
  
  '/api/orders': 'ORDERS',
  '/api/recent-orders': 'RECENT_ORDERS',
  
  '/api/vehicles': 'VEHICLES',
  
  '/api/locations': 'LOCATIONS',
  '/api/service-coverage': 'LOCATIONS',
  
  '/api/fuel-prices': 'FUEL_PRICES',
  
  '/api/payment-methods': 'PAYMENT_METHODS',
  '/api/subscription-plans': 'SUBSCRIPTION_PLANS',
  '/api/subscription': 'SUBSCRIPTION_PLANS',
  
  // Admin endpoints
  '/api/admin/dashboard': 'ADMIN',
  '/api/admin/orders': 'ADMIN',
  '/api/admin/customers': 'ADMIN',
  '/api/admin/drivers': 'ADMIN',
};

/**
 * Get query options for a specific endpoint
 * @param endpoint API endpoint
 * @returns Query options for React Query
 */
export function getQueryOptionsForEndpoint(endpoint: string) {
  // Find the matching category, defaulting to DEFAULT if none found
  const getCategory = (): keyof typeof QUERY_CATEGORIES => {
    // First try exact match
    if (endpoint in ENDPOINT_CATEGORY_MAP) {
      return ENDPOINT_CATEGORY_MAP[endpoint];
    }
    
    // Then try prefix match (for parameterized endpoints)
    for (const [key, value] of Object.entries(ENDPOINT_CATEGORY_MAP)) {
      if (endpoint.startsWith(key)) {
        return value;
      }
    }
    
    // Default fallback
    return 'DEFAULT';
  };
  
  const category = getCategory();
  return QUERY_CATEGORIES[category];
}

/**
 * Construct a query key with proper structure
 * Makes cache invalidation more reliable by keeping related items together
 * 
 * @example
 * // Returns ['/api/orders']
 * buildQueryKey('/api/orders')
 * 
 * @example
 * // Returns ['/api/orders', '123']
 * buildQueryKey('/api/orders', '123')
 * 
 * @example
 * // Returns ['/api/orders', { status: 'completed' }]
 * buildQueryKey('/api/orders', { status: 'completed' })
 */
export function buildQueryKey(endpoint: string, params?: string | number | Record<string, any>) {
  if (!params) {
    return [endpoint];
  }
  
  return [endpoint, params];
}