/**
 * Vehicle API service
 * Handles all API calls related to vehicles
 */

import { Vehicle, InsertVehicle } from "@shared/schema";
import { BaseApiService, ApiResponse, ApiRequestOptions } from "./base-api";

export class VehicleApiService extends BaseApiService {
  constructor() {
    super('/api');
  }

  /**
   * Get all vehicles for the current user
   */
  async getVehicles(options?: ApiRequestOptions): Promise<ApiResponse<Vehicle[]>> {
    return this.get<Vehicle[]>('/vehicles', options);
  }

  /**
   * Get a specific vehicle by ID
   */
  async getVehicle(id: number, options?: ApiRequestOptions): Promise<ApiResponse<Vehicle>> {
    return this.get<Vehicle>(`/vehicles/${id}`, options);
  }

  /**
   * Create a new vehicle
   */
  async createVehicle(vehicle: InsertVehicle, options?: ApiRequestOptions): Promise<ApiResponse<Vehicle>> {
    return this.post<Vehicle>('/vehicles', vehicle, options);
  }

  /**
   * Update an existing vehicle
   */
  async updateVehicle(id: number, vehicle: Partial<InsertVehicle>, options?: ApiRequestOptions): Promise<ApiResponse<Vehicle>> {
    return this.patch<Vehicle>(`/vehicles/${id}`, vehicle, options);
  }

  /**
   * Delete a vehicle
   */
  async deleteVehicle(id: number, options?: ApiRequestOptions): Promise<ApiResponse<void>> {
    return this.delete<void>(`/vehicles/${id}`, options);
  }

  /**
   * Set default vehicle for the user
   */
  async setDefaultVehicle(id: number, options?: ApiRequestOptions): Promise<ApiResponse<{ success: boolean }>> {
    return this.post<{ success: boolean }>(`/vehicles/${id}/default`, {}, options);
  }

  /**
   * Get vehicle fuel usage statistics
   */
  async getVehicleStats(id: number, options?: ApiRequestOptions): Promise<ApiResponse<{
    totalFuelAmount: number;
    averageCost: number;
    fillUps: number;
  }>> {
    return this.get<{
      totalFuelAmount: number;
      averageCost: number;
      fillUps: number;
    }>(`/vehicles/${id}/stats`, options);
  }
}

// Singleton instance
export const vehicleApi = new VehicleApiService();