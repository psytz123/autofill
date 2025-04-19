/**
 * Orders API Service
 * Handles all order-related API requests
 */

import { Order, InsertOrder, OrderStatus, FuelType } from '@shared/schema';
import { ApiService, ApiResponse, ApiRequestOptions } from './base-api';

/**
 * Order tracking update
 */
interface OrderTrackingUpdate {
  orderId: number;
  status: OrderStatus;
  driverLocation?: {
    lat: number;
    lng: number;
  };
  estimatedTimeOfArrival?: number; // timestamp
  message?: string;
}

/**
 * API service for order operations
 */
class OrdersApi extends ApiService {
  /**
   * Get all orders for current user
   * @returns List of user orders
   */
  async getOrders(): Promise<ApiResponse<Order[]>> {
    try {
      return await this.get('/api/orders');
    } catch (error) {
      return this.handleError(error, 'Failed to fetch orders');
    }
  }
  
  /**
   * Get recent orders for current user
   * @param limit Maximum number of orders to return
   * @returns List of recent orders
   */
  async getRecentOrders(limit: number = 5): Promise<ApiResponse<Order[]>> {
    try {
      return await this.get(`/api/recent-orders?limit=${limit}`);
    } catch (error) {
      return this.handleError(error, 'Failed to fetch recent orders');
    }
  }
  
  /**
   * Get a specific order by ID
   * @param orderId Order ID
   * @returns Order details
   */
  async getOrder(orderId: number): Promise<ApiResponse<Order>> {
    try {
      return await this.get(`/api/orders/${orderId}`);
    } catch (error) {
      return this.handleError(error, 'Failed to fetch order details');
    }
  }
  
  /**
   * Create a new order
   * @param order Order details
   * @returns Created order
   */
  async createOrder(order: InsertOrder): Promise<ApiResponse<Order>> {
    try {
      return await this.post('/api/orders', order);
    } catch (error) {
      return this.handleError(error, 'Failed to create order');
    }
  }
  
  /**
   * Cancel an order
   * @param orderId Order ID
   * @param reason Optional cancellation reason
   * @returns Updated order with cancelled status
   */
  async cancelOrder(orderId: number, reason?: string): Promise<ApiResponse<Order>> {
    try {
      return await this.post(`/api/orders/${orderId}/cancel`, { reason });
    } catch (error) {
      return this.handleError(error, 'Failed to cancel order');
    }
  }
  
  /**
   * Rate an order and provide feedback
   * @param orderId Order ID
   * @param rating Rating value (1-5)
   * @param feedback Optional feedback message
   * @returns Success response
   */
  async rateOrder(orderId: number, rating: number, feedback?: string): Promise<ApiResponse<{ success: boolean }>> {
    try {
      return await this.post(`/api/orders/${orderId}/rate`, { rating, feedback });
    } catch (error) {
      return this.handleError(error, 'Failed to submit rating');
    }
  }
  
  /**
   * Get current fuel prices by location
   * @param lat Latitude of location
   * @param lng Longitude of location
   * @returns Fuel price information for all types
   */
  async getFuelPrices(lat?: number, lng?: number): Promise<ApiResponse<Record<FuelType, number>>> {
    try {
      const query = lat && lng ? `?lat=${lat}&lng=${lng}` : '';
      return await this.get(`/api/fuel-prices${query}`);
    } catch (error) {
      return this.handleError(error, 'Failed to fetch fuel prices');
    }
  }
  
  /**
   * Get tracking information for an order
   * @param orderId Order ID
   * @returns Order tracking details
   */
  async getOrderTracking(orderId: number): Promise<ApiResponse<OrderTrackingUpdate>> {
    try {
      return await this.get(`/api/orders/${orderId}/tracking`);
    } catch (error) {
      return this.handleError(error, 'Failed to fetch tracking information');
    }
  }
  
  /**
   * Get order history with filtering options
   * @param options Filter and pagination options
   * @returns Filtered order history
   */
  async getOrderHistory(options: {
    startDate?: string;
    endDate?: string;
    status?: OrderStatus;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{
    orders: Order[];
    total: number;
    hasMore: boolean;
  }>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (options.startDate) queryParams.append('startDate', options.startDate);
      if (options.endDate) queryParams.append('endDate', options.endDate);
      if (options.status) queryParams.append('status', options.status);
      if (options.limit) queryParams.append('limit', options.limit.toString());
      if (options.offset) queryParams.append('offset', options.offset.toString());
      
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return await this.get(`/api/order-history${query}`);
    } catch (error) {
      return this.handleError(error, 'Failed to fetch order history');
    }
  }
}

// Export as singleton
export const ordersApi = new OrdersApi();