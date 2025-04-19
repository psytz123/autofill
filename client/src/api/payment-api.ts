/**
 * Payment API Service
 * Handles all payment-related API requests
 */

import { PaymentMethod, SubscriptionPlan } from '@shared/schema';
import { ApiService, ApiResponse, ApiRequestOptions } from './base-api';

/**
 * Payment method request type
 */
interface AddPaymentMethodRequest {
  paymentMethodId: string;
  isDefault?: boolean;
  billingDetails?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
  };
}

/**
 * Subscription request type
 */
interface SubscriptionRequest {
  planId: string;
  paymentMethodId: string;
}

/**
 * API service for payment operations
 */
class PaymentApi extends ApiService {
  /**
   * Get all user payment methods
   * @returns List of payment methods
   */
  async getPaymentMethods(): Promise<ApiResponse<PaymentMethod[]>> {
    try {
      return await this.get('/api/payment-methods');
    } catch (error) {
      return this.handleError(error, 'Failed to fetch payment methods');
    }
  }
  
  /**
   * Get a specific payment method
   * @param paymentMethodId Payment method ID
   * @returns Payment method details
   */
  async getPaymentMethod(paymentMethodId: string): Promise<ApiResponse<PaymentMethod>> {
    try {
      return await this.get(`/api/payment-methods/${paymentMethodId}`);
    } catch (error) {
      return this.handleError(error, 'Failed to fetch payment method');
    }
  }
  
  /**
   * Add a new payment method
   * @param paymentMethod Payment method details
   * @returns Added payment method
   */
  async addPaymentMethod(paymentMethod: AddPaymentMethodRequest): Promise<ApiResponse<PaymentMethod>> {
    try {
      return await this.post('/api/payment-methods', paymentMethod);
    } catch (error) {
      return this.handleError(error, 'Failed to add payment method');
    }
  }
  
  /**
   * Delete a payment method
   * @param paymentMethodId Payment method ID
   * @returns Success response
   */
  async deletePaymentMethod(paymentMethodId: string): Promise<ApiResponse<{ success: boolean }>> {
    try {
      return await this.delete(`/api/payment-methods/${paymentMethodId}`);
    } catch (error) {
      return this.handleError(error, 'Failed to delete payment method');
    }
  }
  
  /**
   * Set a payment method as default
   * @param paymentMethodId Payment method ID
   * @returns Updated payment method
   */
  async setDefaultPaymentMethod(paymentMethodId: string): Promise<ApiResponse<PaymentMethod>> {
    try {
      return await this.post(`/api/payment-methods/${paymentMethodId}/set-default`);
    } catch (error) {
      return this.handleError(error, 'Failed to set default payment method');
    }
  }
  
  /**
   * Create a payment intent for one-time payment
   * @param amount Amount in dollars
   * @param paymentMethodId Optional payment method ID
   * @returns Payment intent client secret
   */
  async createPaymentIntent(amount: number, paymentMethodId?: string): Promise<ApiResponse<{
    clientSecret: string;
    amount: number;
    currency: string;
  }>> {
    try {
      return await this.post('/api/create-payment-intent', { amount, paymentMethodId });
    } catch (error) {
      return this.handleError(error, 'Failed to create payment intent');
    }
  }
  
  /**
   * Get available subscription plans
   * @returns List of subscription plans
   */
  async getSubscriptionPlans(): Promise<ApiResponse<SubscriptionPlan[]>> {
    try {
      return await this.get('/api/subscription-plans');
    } catch (error) {
      return this.handleError(error, 'Failed to fetch subscription plans');
    }
  }
  
  /**
   * Subscribe to a plan
   * @param subscription Subscription details
   * @returns Subscription details with status
   */
  async subscribe(subscription: SubscriptionRequest): Promise<ApiResponse<{
    subscriptionId: string;
    clientSecret: string;
    status: string;
  }>> {
    try {
      return await this.post('/api/subscribe', subscription);
    } catch (error) {
      return this.handleError(error, 'Failed to create subscription');
    }
  }
  
  /**
   * Get current subscription
   * @returns Current subscription
   */
  async getCurrentSubscription(): Promise<ApiResponse<{
    subscriptionId: string;
    planId: string;
    status: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  } | null>> {
    try {
      return await this.get('/api/subscription');
    } catch (error) {
      return this.handleError(error, 'Failed to fetch subscription');
    }
  }
  
  /**
   * Cancel subscription
   * @param atPeriodEnd Whether to cancel at the end of the billing period
   * @returns Updated subscription
   */
  async cancelSubscription(atPeriodEnd: boolean = true): Promise<ApiResponse<{
    subscriptionId: string;
    status: string;
    cancelAtPeriodEnd: boolean;
  }>> {
    try {
      return await this.post('/api/cancel-subscription', { atPeriodEnd });
    } catch (error) {
      return this.handleError(error, 'Failed to cancel subscription');
    }
  }
  
  /**
   * Get payment history
   * @param limit Number of items to return
   * @param offset Pagination offset
   * @returns Payment history
   */
  async getPaymentHistory(limit: number = 10, offset: number = 0): Promise<ApiResponse<{
    payments: Array<{
      id: string;
      amount: number;
      currency: string;
      status: string;
      created: string;
      paymentMethod: string;
      description: string;
    }>;
    hasMore: boolean;
    total: number;
  }>> {
    try {
      return await this.get(`/api/payment-history?limit=${limit}&offset=${offset}`);
    } catch (error) {
      return this.handleError(error, 'Failed to fetch payment history');
    }
  }
}

// Export as singleton
export const paymentApi = new PaymentApi();