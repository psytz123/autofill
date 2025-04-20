/**
 * Shared Navigation Utilities
 * Common functionality for navigation across web and mobile platforms
 */

// Define all available routes in the application to ensure consistency
export enum AppRoutes {
  // Authentication
  LOGIN = 'login',
  REGISTER = 'register',
  FORGOT_PASSWORD = 'forgot-password',
  
  // Main screens
  HOME = 'home',
  ORDER = 'order',
  ORDERS = 'orders',
  ORDER_DETAILS = 'order-details',
  
  // Vehicle management
  VEHICLES = 'vehicles',
  VEHICLE_DETAILS = 'vehicle-details',
  ADD_VEHICLE = 'add-vehicle',
  EDIT_VEHICLE = 'edit-vehicle',
  
  // Location management
  LOCATIONS = 'locations',
  LOCATION_SELECTION = 'location-selection',
  ADD_LOCATION = 'add-location',
  EDIT_LOCATION = 'edit-location',
  
  // Account management
  ACCOUNT = 'account',
  PROFILE = 'profile',
  PAYMENT_METHODS = 'payment-methods',
  SUBSCRIPTION = 'subscription',
  SUPPORT = 'support',
  SETTINGS = 'settings',
  
  // Admin routes
  ADMIN_DASHBOARD = 'admin-dashboard',
  ADMIN_ORDERS = 'admin-orders',
  ADMIN_DRIVERS = 'admin-drivers',
  ADMIN_CUSTOMERS = 'admin-customers',
  ADMIN_ANALYTICS = 'admin-analytics',
  ADMIN_PROFILE = 'admin-profile'
}

// Define the parameters for routes that require them
export interface RouteParams {
  [AppRoutes.ORDER]: { selectedLocationId?: number };
  [AppRoutes.ORDER_DETAILS]: { orderId: number };
  [AppRoutes.VEHICLE_DETAILS]: { vehicleId: number };
  [AppRoutes.EDIT_VEHICLE]: { vehicleId: number };
  [AppRoutes.LOCATION_SELECTION]: { returnTo: AppRoutes };
  [AppRoutes.EDIT_LOCATION]: { locationId: number };
  [AppRoutes.ADMIN_ORDERS]: { status?: string };
  [AppRoutes.ADMIN_CUSTOMERS]: { id?: number };
}

// Default route params as an empty object for routes that don't require params
export type DefaultRouteParams = Record<string, never>;

/**
 * Helper types for route parameters
 */
export type RouteParamsFor<T extends AppRoutes> = 
  T extends keyof RouteParams ? RouteParams[T] : DefaultRouteParams;

/**
 * Maps routes to URL paths (for web) or screen names (for mobile)
 */
export interface RouteMappings {
  web: Record<AppRoutes, string>;
  mobile: Record<AppRoutes, string>;
}

// Define the mappings between route names and actual URLs/screen names
export const ROUTE_MAPPINGS: RouteMappings = {
  web: {
    // Auth routes
    [AppRoutes.LOGIN]: '/auth',
    [AppRoutes.REGISTER]: '/auth?tab=register',
    [AppRoutes.FORGOT_PASSWORD]: '/auth/forgot-password',
    
    // Main routes
    [AppRoutes.HOME]: '/',
    [AppRoutes.ORDER]: '/order',
    [AppRoutes.ORDERS]: '/orders',
    [AppRoutes.ORDER_DETAILS]: '/orders/:orderId',
    
    // Vehicle routes
    [AppRoutes.VEHICLES]: '/vehicles',
    [AppRoutes.VEHICLE_DETAILS]: '/vehicles/:vehicleId',
    [AppRoutes.ADD_VEHICLE]: '/vehicles/add',
    [AppRoutes.EDIT_VEHICLE]: '/vehicles/:vehicleId/edit',
    
    // Location routes
    [AppRoutes.LOCATIONS]: '/locations',
    [AppRoutes.LOCATION_SELECTION]: '/location-selection',
    [AppRoutes.ADD_LOCATION]: '/locations/add',
    [AppRoutes.EDIT_LOCATION]: '/locations/:locationId/edit',
    
    // Account routes
    [AppRoutes.ACCOUNT]: '/account',
    [AppRoutes.PROFILE]: '/account/profile',
    [AppRoutes.PAYMENT_METHODS]: '/payment-methods',
    [AppRoutes.SUBSCRIPTION]: '/subscription',
    [AppRoutes.SUPPORT]: '/support',
    [AppRoutes.SETTINGS]: '/settings',
    
    // Admin routes
    [AppRoutes.ADMIN_DASHBOARD]: '/admin/dashboard',
    [AppRoutes.ADMIN_ORDERS]: '/admin/orders',
    [AppRoutes.ADMIN_DRIVERS]: '/admin/drivers',
    [AppRoutes.ADMIN_CUSTOMERS]: '/admin/customers',
    [AppRoutes.ADMIN_ANALYTICS]: '/admin/analytics',
    [AppRoutes.ADMIN_PROFILE]: '/admin/profile'
  },
  mobile: {
    // Auth routes
    [AppRoutes.LOGIN]: 'Login',
    [AppRoutes.REGISTER]: 'Register',
    [AppRoutes.FORGOT_PASSWORD]: 'ForgotPassword',
    
    // Main routes
    [AppRoutes.HOME]: 'Home',
    [AppRoutes.ORDER]: 'Order',
    [AppRoutes.ORDERS]: 'Orders',
    [AppRoutes.ORDER_DETAILS]: 'OrderDetails',
    
    // Vehicle routes
    [AppRoutes.VEHICLES]: 'Vehicles',
    [AppRoutes.VEHICLE_DETAILS]: 'VehicleDetails',
    [AppRoutes.ADD_VEHICLE]: 'AddVehicle',
    [AppRoutes.EDIT_VEHICLE]: 'EditVehicle',
    
    // Location routes
    [AppRoutes.LOCATIONS]: 'Locations',
    [AppRoutes.LOCATION_SELECTION]: 'LocationSelection',
    [AppRoutes.ADD_LOCATION]: 'AddLocation',
    [AppRoutes.EDIT_LOCATION]: 'EditLocation',
    
    // Account routes
    [AppRoutes.ACCOUNT]: 'Account',
    [AppRoutes.PROFILE]: 'Profile',
    [AppRoutes.PAYMENT_METHODS]: 'PaymentMethods',
    [AppRoutes.SUBSCRIPTION]: 'Subscription',
    [AppRoutes.SUPPORT]: 'Support',
    [AppRoutes.SETTINGS]: 'Settings',
    
    // Admin routes (likely not used in mobile app)
    [AppRoutes.ADMIN_DASHBOARD]: 'AdminDashboard',
    [AppRoutes.ADMIN_ORDERS]: 'AdminOrders',
    [AppRoutes.ADMIN_DRIVERS]: 'AdminDrivers',
    [AppRoutes.ADMIN_CUSTOMERS]: 'AdminCustomers',
    [AppRoutes.ADMIN_ANALYTICS]: 'AdminAnalytics',
    [AppRoutes.ADMIN_PROFILE]: 'AdminProfile'
  }
};

/**
 * Creates a platform-specific route URL or name with parameters
 * @param route The route to generate
 * @param params The parameters for the route
 * @param platform The platform to generate the route for
 * @returns A URL path (web) or screen name (mobile)
 */
export function createRoute<T extends AppRoutes>(
  route: T,
  params?: RouteParamsFor<T>,
  platform: 'web' | 'mobile' = 'web'
): string {
  // Get the base route pattern for the platform
  const baseRoute = ROUTE_MAPPINGS[platform][route];
  
  // If there are no params or it's a mobile route, return the base route
  // Mobile navigation typically handles parameters as navigation props
  if (!params || platform === 'mobile') {
    return baseRoute;
  }
  
  // For web platforms, replace path parameters with actual values
  let result = baseRoute;
  
  // Replace path parameters using the format :paramName
  Object.entries(params).forEach(([key, value]) => {
    const paramPlaceholder = `:${key}`;
    if (result.includes(paramPlaceholder)) {
      result = result.replace(paramPlaceholder, String(value));
    }
  });
  
  // Add query parameters for non-path parameters
  const queryParams: Record<string, string> = {};
  Object.entries(params).forEach(([key, value]) => {
    if (!baseRoute.includes(`:${key}`)) {
      queryParams[key] = String(value);
    }
  });
  
  // Append query string if we have query parameters
  const queryString = Object.entries(queryParams)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
    
  if (queryString) {
    result += (result.includes('?') ? '&' : '?') + queryString;
  }
  
  return result;
}

/**
 * Type-safe navigation functions for each platform
 * These will be implemented by platform-specific code
 */
export interface NavigationService {
  navigate<T extends AppRoutes>(
    route: T,
    params?: RouteParamsFor<T>
  ): void;
  
  goBack(): void;
  
  replace<T extends AppRoutes>(
    route: T,
    params?: RouteParamsFor<T>
  ): void;
  
  reset<T extends AppRoutes>(
    route: T,
    params?: RouteParamsFor<T>
  ): void;
}