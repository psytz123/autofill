/**
 * Vehicle API Service
 * Handles all vehicle-related API requests
 */

import { Vehicle, InsertVehicle } from '@shared/schema';
import { ApiService, ApiResponse, ApiRequestOptions } from './base-api';

/**
 * API service for vehicle operations
 */
class VehicleApi extends ApiService {
  /**
   * Get all vehicles for the current user
   * @returns List of user vehicles
   */
  async getVehicles(): Promise<ApiResponse<Vehicle[]>> {
    try {
      return await this.get('/api/vehicles');
    } catch (error) {
      return this.handleError(error, 'Failed to fetch vehicles');
    }
  }
  
  /**
   * Get a specific vehicle by ID
   * @param vehicleId Vehicle ID
   * @returns Vehicle details
   */
  async getVehicle(vehicleId: number): Promise<ApiResponse<Vehicle>> {
    try {
      return await this.get(`/api/vehicles/${vehicleId}`);
    } catch (error) {
      return this.handleError(error, 'Failed to fetch vehicle details');
    }
  }
  
  /**
   * Add a new vehicle
   * @param vehicle Vehicle details
   * @returns Created vehicle
   */
  async addVehicle(vehicle: InsertVehicle): Promise<ApiResponse<Vehicle>> {
    try {
      return await this.post('/api/vehicles', vehicle);
    } catch (error) {
      return this.handleError(error, 'Failed to add vehicle');
    }
  }
  
  /**
   * Update vehicle information
   * @param vehicleId Vehicle ID
   * @param data Updated vehicle data
   * @returns Updated vehicle
   */
  async updateVehicle(vehicleId: number, data: Partial<Vehicle>): Promise<ApiResponse<Vehicle>> {
    try {
      return await this.patch(`/api/vehicles/${vehicleId}`, data);
    } catch (error) {
      return this.handleError(error, 'Failed to update vehicle');
    }
  }
  
  /**
   * Delete a vehicle
   * @param vehicleId Vehicle ID
   * @returns Success response
   */
  async deleteVehicle(vehicleId: number): Promise<ApiResponse<{ success: boolean }>> {
    try {
      return await this.delete(`/api/vehicles/${vehicleId}`);
    } catch (error) {
      return this.handleError(error, 'Failed to delete vehicle');
    }
  }
  
  /**
   * Set a vehicle as the default for fuel orders
   * @param vehicleId Vehicle ID
   * @returns Updated vehicle
   */
  async setDefaultVehicle(vehicleId: number): Promise<ApiResponse<Vehicle>> {
    try {
      return await this.post(`/api/vehicles/${vehicleId}/set-default`);
    } catch (error) {
      return this.handleError(error, 'Failed to set default vehicle');
    }
  }
  
  /**
   * Get vehicle fuel consumption statistics
   * @param vehicleId Vehicle ID
   * @param period Time period ('week', 'month', 'year')
   * @returns Fuel consumption statistics
   */
  async getVehicleStats(vehicleId: number, period: 'week' | 'month' | 'year' = 'month'): Promise<ApiResponse<{
    totalGallons: number;
    totalCost: number;
    fuelEfficiency?: number;
    fillUps: number;
    costPerGallon: number;
  }>> {
    try {
      return await this.get(`/api/vehicles/${vehicleId}/stats?period=${period}`);
    } catch (error) {
      return this.handleError(error, 'Failed to fetch vehicle statistics');
    }
  }
}

// Export as singleton
export const vehicleApi = new VehicleApi();