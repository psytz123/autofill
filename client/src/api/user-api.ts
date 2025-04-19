/**
 * User API Service
 * Handles all user-related API requests
 */

import { User, InsertUser } from '@shared/schema';
import { ApiService, ApiResponse, ApiRequestOptions } from './base-api';

/**
 * API response type for authentication operations
 */
interface AuthResponse {
  user: User;
  token?: string;
}

/**
 * Login credentials type
 */
interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * API service for user operations
 */
class UserApi extends ApiService {
  /**
   * Get current logged in user
   * @returns Current user
   */
  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      return await this.get('/api/user');
    } catch (error) {
      return this.handleError(error, 'Failed to fetch user profile');
    }
  }
  
  /**
   * Login user
   * @param credentials User credentials
   * @returns Logged in user
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    try {
      return await this.post('/api/login', credentials);
    } catch (error) {
      return this.handleError(error, 'Login failed');
    }
  }
  
  /**
   * Register new user
   * @param userData User registration data
   * @returns Registered user
   */
  async register(userData: InsertUser): Promise<ApiResponse<AuthResponse>> {
    try {
      return await this.post('/api/register', userData);
    } catch (error) {
      return this.handleError(error, 'Registration failed');
    }
  }
  
  /**
   * Logout user
   * @returns Success response
   */
  async logout(): Promise<ApiResponse<{ success: boolean }>> {
    try {
      return await this.post('/api/logout');
    } catch (error) {
      return this.handleError(error, 'Logout failed');
    }
  }
  
  /**
   * Update user profile
   * @param userId User ID
   * @param userData Updated user data
   * @returns Updated user
   */
  async updateProfile(userId: number, userData: Partial<User>): Promise<ApiResponse<User>> {
    try {
      return await this.patch(`/api/users/${userId}`, userData);
    } catch (error) {
      return this.handleError(error, 'Failed to update profile');
    }
  }
  
  /**
   * Request password reset
   * @param email User email
   * @returns Success response
   */
  async requestPasswordReset(email: string): Promise<ApiResponse<{ success: boolean }>> {
    try {
      return await this.post('/api/password-reset-request', { email });
    } catch (error) {
      return this.handleError(error, 'Failed to request password reset');
    }
  }
  
  /**
   * Reset password with token
   * @param token Reset token
   * @param newPassword New password
   * @returns Success response
   */
  async resetPassword(token: string, newPassword: string): Promise<ApiResponse<{ success: boolean }>> {
    try {
      return await this.post('/api/password-reset', { token, newPassword });
    } catch (error) {
      return this.handleError(error, 'Failed to reset password');
    }
  }
  
  /**
   * Delete user account
   * @param userId User ID
   * @param confirmation Confirmation phrase
   * @returns Success response
   */
  async deleteAccount(userId: number, confirmation: string): Promise<ApiResponse<{ success: boolean }>> {
    try {
      return await this.delete(`/api/users/${userId}`, { 
        body: JSON.stringify({ confirmation }) 
      });
    } catch (error) {
      return this.handleError(error, 'Failed to delete account');
    }
  }
}

// Export as singleton
export const userApi = new UserApi();