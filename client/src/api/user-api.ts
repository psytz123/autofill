/**
 * User API service
 * Handles all API calls related to user authentication and profile
 */

import { User, InsertUser } from "@shared/schema";
import { BaseApiService, ApiResponse, ApiRequestOptions } from "./base-api";

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
  email: string;
}

export class UserApiService extends BaseApiService {
  constructor() {
    super('/api');
  }

  /**
   * Get the current authenticated user
   */
  async getCurrentUser(options?: ApiRequestOptions): Promise<ApiResponse<User>> {
    return this.get<User>('/user', options);
  }

  /**
   * Login with username and password
   */
  async login(credentials: LoginCredentials, options?: ApiRequestOptions): Promise<ApiResponse<User>> {
    return this.post<User>('/login', credentials, options);
  }

  /**
   * Register a new user
   */
  async register(userData: RegisterData, options?: ApiRequestOptions): Promise<ApiResponse<User>> {
    return this.post<User>('/register', userData, options);
  }

  /**
   * Logout the current user
   */
  async logout(options?: ApiRequestOptions): Promise<ApiResponse<void>> {
    return this.post<void>('/logout', {}, options);
  }

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<User>, options?: ApiRequestOptions): Promise<ApiResponse<User>> {
    return this.patch<User>('/user', data, options);
  }

  /**
   * Change user password
   */
  async changePassword(data: { currentPassword: string; newPassword: string }, options?: ApiRequestOptions): Promise<ApiResponse<{ success: boolean }>> {
    return this.post<{ success: boolean }>('/user/change-password', data, options);
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPushNotifications(subscription: PushSubscription, options?: ApiRequestOptions): Promise<ApiResponse<{ success: boolean }>> {
    return this.post<{ success: boolean }>('/push-subscription', subscription, options);
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribeFromPushNotifications(endpoint: string, options?: ApiRequestOptions): Promise<ApiResponse<{ success: boolean }>> {
    return this.delete<{ success: boolean }>(`/push-subscription?endpoint=${encodeURIComponent(endpoint)}`, options);
  }
}

// Singleton instance
export const userApi = new UserApiService();