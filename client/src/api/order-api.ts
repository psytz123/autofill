/**
 * Order API service
 * Handles all API calls related to orders
 */

import { Order, InsertOrder } from "@shared/schema";
import { BaseApiService, ApiResponse, ApiRequestOptions } from "./base-api";

export class OrderApiService extends BaseApiService {
  constructor() {
    super('/api');
  }

  /**
   * Get all orders for the current user
   */
  async getOrders(options?: ApiRequestOptions): Promise<ApiResponse<Order[]>> {
    return this.get<Order[]>('/orders', options);
  }

  /**
   * Get recent orders for the current user (limited count)
   */
  async getRecentOrders(options?: ApiRequestOptions): Promise<ApiResponse<Order[]>> {
    return this.get<Order[]>('/recent-orders', options);
  }

  /**
   * Get a specific order by ID
   */
  async getOrder(id: number, options?: ApiRequestOptions): Promise<ApiResponse<Order>> {
    return this.get<Order>(`/orders/${id}`, options);
  }

  /**
   * Create a new order
   */
  async createOrder(order: Omit<InsertOrder, "status">, options?: ApiRequestOptions): Promise<ApiResponse<Order>> {
    return this.post<Order>('/orders', order, options);
  }

  /**
   * Update an order's status
   */
  async updateOrderStatus(id: number, status: string, options?: ApiRequestOptions): Promise<ApiResponse<Order>> {
    return this.patch<Order>(`/orders/${id}/status`, { status }, options);
  }

  /**
   * Cancel an order
   */
  async cancelOrder(id: number, options?: ApiRequestOptions): Promise<ApiResponse<Order>> {
    return this.patch<Order>(`/orders/${id}/cancel`, {}, options);
  }

  /**
   * Get order tracking information
   */
  async getOrderTracking(id: number, options?: ApiRequestOptions): Promise<ApiResponse<any>> {
    return this.get<any>(`/orders/${id}/tracking`, options);
  }

  /**
   * Get delivery estimate for an order
   * @param location Delivery location coordinates
   */
  async getDeliveryEstimate(location: { lat: number; lng: number }, options?: ApiRequestOptions): Promise<ApiResponse<{ 
    estimatedTime: number; 
    distance: number;
  }>> {
    return this.get<{ estimatedTime: number; distance: number; }>(`/delivery-estimate`, {
      ...options,
      headers: {
        ...(options?.headers || {}),
        'Content-Type': 'application/json'
      }
    });
  }
}

// Singleton instance
export const orderApi = new OrderApiService();