/**
 * API Services Registry
 * Centralizes access to all API services
 */

// Re-export all API services
export { baseApi } from './base-api';
export { userApi } from './user-api';
export { vehicleApi } from './vehicle-api';
export { locationApi } from './location-api';
export { paymentApi } from './payment-api';
export { ordersApi } from './orders-api';

// Export common types
export { ApiResponse, ApiError, ApiRequestOptions } from './base-api';

/**
 * API Services singleton with access to all API features
 */
const api = {
  // Base API functionality
  base: async () => (await import('./base-api')).baseApi,
  
  // User operations
  user: async () => (await import('./user-api')).userApi,
  
  // Vehicle operations
  vehicle: async () => (await import('./vehicle-api')).vehicleApi,
  
  // Location operations
  location: async () => (await import('./location-api')).locationApi,
  
  // Payment operations
  payment: async () => (await import('./payment-api')).paymentApi,
  
  // Order operations
  orders: async () => (await import('./orders-api')).ordersApi,
};

export default api;