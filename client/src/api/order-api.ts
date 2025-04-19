/**
 * Order API Service
 * Handles all order-related API requests
 */

import { Order, OrderStatus, InsertOrder } from '@shared/schema';
import { ApiService, ApiResponse, ApiRequestOptions } from './base-api';

/**
 * API service for order operations
 */
class OrderApi extends ApiService {
  /**
   * Get all orders for the current user
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
   * Get recent orders for the current user
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
   * Update order status
   * @param orderId Order ID
   * @param status New status
   * @returns Updated order
   */
  async updateOrderStatus(orderId: number, status: OrderStatus): Promise<ApiResponse<Order>> {
    try {
      return await this.patch(`/api/orders/${orderId}/status`, { status });
    } catch (error) {
      return this.handleError(error, 'Failed to update order status');
    }
  }
  
  /**
   * Cancel an order
   * @param orderId Order ID
   * @param reason Cancellation reason
   * @returns Updated order
   */
  async cancelOrder(orderId: number, reason: string): Promise<ApiResponse<Order>> {
    try {
      return await this.patch(`/api/orders/${orderId}/cancel`, { reason });
    } catch (error) {
      return this.handleError(error, 'Failed to cancel order');
    }
  }
  
  /**
   * Get order tracking information
   * @param orderId Order ID
   * @returns Tracking information
   */
  async getOrderTracking(orderId: number): Promise<ApiResponse<{
    orderId: number;
    status: OrderStatus;
    driverLocation?: { lat: number; lng: number };
    estimatedArrival?: string;
    distance?: number;
    driverName?: string;
    driverPhone?: string;
  }>> {
    try {
      return await this.get(`/api/orders/${orderId}/tracking`);
    } catch (error) {
      return this.handleError(error, 'Failed to fetch tracking information');
    }
  }
}

// Export as singleton
export const orderApi = new OrderApi();