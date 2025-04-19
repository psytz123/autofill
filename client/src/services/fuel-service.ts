/**
 * Enhanced Fuel Service
 * Integrates circuit breaker pattern with improved caching and fallback strategies
 */

import { FuelType } from '@shared/schema';
import { fuelApi } from '@/api/fuel-api';
import { CircuitBreaker, CircuitBreakerState, createCircuitBreaker } from '@/utils/circuit-breaker';

// Constants
const CACHE_KEY = 'fuel_prices_cache';
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
const DEFAULT_STATE = 'FL';

// Fuel price cache structure
interface FuelPriceCache {
  prices: Record<FuelType, number>;
  timestamp: number;
  stateCode: string;
}

/**
 * Fuel Service with circuit breaker and advanced caching
 */
export class FuelService {
  private circuitBreaker: CircuitBreaker;
  private cache: FuelPriceCache | null = null;
  
  constructor() {
    // Create circuit breaker with specific settings for fuel price API
    this.circuitBreaker = createCircuitBreaker('fuel-api', {
      failureThreshold: 3,
      resetTimeout: 5 * 60 * 1000, // 5 minutes initial backoff
      monitorInterval: 15 * 60 * 1000, // Check every 15 minutes
      onStateChange: (state, context) => {
        if (state === CircuitBreakerState.OPEN) {
          console.log(`Fuel API circuit breaker opened. Using cached data until ${new Date(context.nextAttemptTime).toLocaleTimeString()}`);
        } else if (state === CircuitBreakerState.CLOSED) {
          console.log('Fuel API circuit breaker closed. Normal operation resumed.');
        }
      }
    });
    
    // Try to load cache from localStorage
    this.loadCacheFromStorage();
  }
  
  /**
   * Get fuel prices with circuit breaker protection and caching
   * @param stateCode US state code (e.g., 'FL')
   * @param forceRefresh Whether to bypass the cache
   * @returns Fuel prices by type
   */
  async getFuelPrices(
    stateCode: string = DEFAULT_STATE,
    forceRefresh: boolean = false
  ): Promise<Record<FuelType, number>> {
    // Check cache first unless force refresh requested
    if (!forceRefresh && this.isValidCache(stateCode)) {
      return this.cache!.prices;
    }
    
    try {
      // Update circuit breaker context with request details
      this.circuitBreaker.updateContext({
        stateCode,
        timestamp: Date.now(),
        nextAttemptTime: Date.now() + this.circuitBreaker.getTimeUntilNextAttempt()
      });
      
      // Execute with circuit breaker protection
      const result = await this.circuitBreaker.execute(async () => {
        const response = await fuelApi.getFuelPrices(stateCode, forceRefresh);
        
        if (response.error) {
          throw response.error;
        }
        
        return response.data!;
      });
      
      // Update cache with fresh data
      this.updateCache(stateCode, result);
      
      return result;
    } catch (error) {
      console.error('Error fetching fuel prices:', error);
      
      // Return cached data if available (even if expired)
      if (this.cache && this.cache.stateCode === stateCode) {
        console.log('Using cached fuel prices due to error');
        return this.cache.prices;
      }
      
      // Last resort fallback to default prices
      console.log('Using default fuel prices due to error and no cache');
      return this.getDefaultPrices();
    }
  }
  
  /**
   * Calculate cost for a specific amount and type of fuel
   * @param amount Amount of fuel in gallons
   * @param fuelType Type of fuel
   * @returns Calculated cost
   */
  async calculateFuelCost(amount: number, fuelType: FuelType): Promise<number> {
    const prices = await this.getFuelPrices();
    return amount * prices[fuelType];
  }
  
  /**
   * Get fuel price for a specific type
   * @param fuelType Type of fuel
   * @returns Price per gallon
   */
  async getFuelPrice(fuelType: FuelType): Promise<number> {
    const prices = await this.getFuelPrices();
    return prices[fuelType];
  }
  
  /**
   * Reset the circuit breaker (for testing or after known issues are fixed)
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker.reset();
  }
  
  /**
   * Check if the circuit breaker is tripped
   */
  isCircuitBreakerOpen(): boolean {
    return this.circuitBreaker.getState() === CircuitBreakerState.OPEN;
  }
  
  /**
   * Get the time until the circuit breaker will try again
   */
  getRetryAfterTime(): number {
    return this.circuitBreaker.getTimeUntilNextAttempt();
  }
  
  /**
   * Clear the price cache
   */
  clearCache(): void {
    this.cache = null;
    localStorage.removeItem(CACHE_KEY);
  }
  
  /**
   * Get default fuel prices when API is unavailable
   * These values are regularly updated based on national averages
   */
  private getDefaultPrices(): Record<FuelType, number> {
    return {
      [FuelType.REGULAR_UNLEADED]: 3.75,
      [FuelType.PREMIUM_UNLEADED]: 4.35,
      [FuelType.DIESEL]: 4.15
    };
  }
  
  /**
   * Check if the cache is valid for the given state
   */
  private isValidCache(stateCode: string): boolean {
    if (!this.cache) return false;
    
    const now = Date.now();
    const isExpired = now - this.cache.timestamp > CACHE_DURATION;
    const isSameState = this.cache.stateCode === stateCode;
    
    return !isExpired && isSameState;
  }
  
  /**
   * Update the price cache with new data
   */
  private updateCache(stateCode: string, prices: Record<FuelType, number>): void {
    this.cache = {
      prices,
      timestamp: Date.now(),
      stateCode
    };
    
    // Persist to localStorage for faster access on subsequent page loads
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(this.cache));
    } catch (error) {
      console.warn('Failed to save fuel prices to localStorage:', error);
    }
  }
  
  /**
   * Load cache from localStorage if available
   */
  private loadCacheFromStorage(): void {
    try {
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        this.cache = JSON.parse(cachedData) as FuelPriceCache;
      }
    } catch (error) {
      console.warn('Failed to load fuel prices from localStorage:', error);
      // If loading fails, just continue with null cache
      this.cache = null;
    }
  }
}

// Export as singleton
export const fuelService = new FuelService();