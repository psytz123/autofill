/**
 * Fuel API Service
 * Handles fetching and caching fuel prices
 */

import { FuelType } from '@shared/schema';
import { BaseApi, ApiResponse } from './base-api';

/**
 * API service for fuel price operations
 */
class FuelApi extends BaseApi {
  /**
   * Get current fuel prices for a specific state
   * @param stateCode Two-letter US state code (e.g., 'FL')
   * @param forceRefresh Whether to bypass server-side cache
   * @returns Current fuel prices by fuel type
   */
  async getFuelPrices(
    stateCode: string = 'FL',
    forceRefresh: boolean = false
  ): Promise<ApiResponse<Record<FuelType, number>>> {
    try {
      const url = `/api/fuel-prices?state=${stateCode}${forceRefresh ? '&refresh=true' : ''}`;
      return await this.get(url);
    } catch (error) {
      return this.handleError(error, 'Failed to fetch fuel prices');
    }
  }
  
  /**
   * Get the price of a specific fuel type
   * @param fuelType The type of fuel
   * @param stateCode Two-letter US state code (e.g., 'FL')
   * @returns Current price for the specified fuel type
   */
  async getFuelPrice(
    fuelType: FuelType, 
    stateCode: string = 'FL'
  ): Promise<ApiResponse<number>> {
    try {
      const url = `/api/fuel-price/${fuelType}?state=${stateCode}`;
      return await this.get(url);
    } catch (error) {
      return this.handleError(error, `Failed to fetch price for ${fuelType} fuel`);
    }
  }
  
  /**
   * Calculate the cost for a specific amount of fuel
   * @param amount Amount in gallons
   * @param fuelType Type of fuel
   * @param stateCode Two-letter US state code (e.g., 'FL')
   * @returns Calculated cost
   */
  async calculateFuelCost(
    amount: number,
    fuelType: FuelType,
    stateCode: string = 'FL'
  ): Promise<ApiResponse<{ 
    cost: number; 
    pricePerGallon: number;
  }>> {
    try {
      const url = `/api/fuel-cost-calculation`;
      return await this.post(url, { amount, fuelType, stateCode });
    } catch (error) {
      return this.handleError(error, 'Failed to calculate fuel cost');
    }
  }
  
  /**
   * Check if the CollectAPI fuel service is operational
   * @returns Status of the fuel API service
   */
  async checkServiceStatus(): Promise<ApiResponse<{ 
    operational: boolean; 
    lastUpdated: string;
    message?: string;
  }>> {
    try {
      return await this.get('/api/fuel-service-status');
    } catch (error) {
      return this.handleError(error, 'Failed to check fuel service status');
    }
  }
}

// Export as singleton
export const fuelApi = new FuelApi();