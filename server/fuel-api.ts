import { FuelType } from "@shared/schema";
import { log } from "./vite";

// API response interfaces
interface FuelPriceResponse {
  success: boolean;
  result: FuelPriceResult[];
}

interface FuelPriceResult {
  name: string;
  gasoline: string;
  midGrade: string;
  premium: string;
  diesel: string;
}

// Cache for storing prices to reduce API calls
interface PriceCache {
  prices: Record<FuelType, number>;
  lastUpdated: number;
  stateCode: string;
  rateLimited?: boolean;
  rateLimitExpiry?: number; // When to try API again after rate limit
}

// Updated default prices (April 2025)
const DEFAULT_PRICES = {
  [FuelType.REGULAR_UNLEADED]: 3.75,
  [FuelType.PREMIUM_UNLEADED]: 4.35,
  [FuelType.DIESEL]: 4.10
};

// Cache expires after 24 hours (in milliseconds)
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // Once per day

// Rate limit backoff in ms (15 minutes)
// If we hit rate limits, don't try again for this amount of time
const RATE_LIMIT_BACKOFF = 15 * 60 * 1000;

// In-memory cache
let priceCache: PriceCache = {
  prices: { ...DEFAULT_PRICES },
  lastUpdated: 0,
  stateCode: "US"
};

/**
 * Retry a function multiple times with exponential backoff
 * @param fn Function to retry
 * @param retries Number of retries
 * @param delay Initial delay in ms
 */
async function retry<T>(fn: () => Promise<T>, retries: number, delay: number): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries <= 0) {
      throw error;
    }
    
    const errorMessage = error.message || String(error);
    log(`Retrying after error: ${errorMessage}. Attempts left: ${retries}`, "fuel-api");
    
    // Wait for the delay before retrying
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Retry with exponential backoff (double the delay each time)
    return retry(fn, retries - 1, delay * 2);
  }
}

/**
 * Enhanced fuel price fetching with retries, validation, and robust error handling
 * @param stateCode The US state code to get prices for (e.g., 'FL')
 * @returns Object with price per gallon for each fuel type
 */
export async function getFuelPrices(stateCode = "FL"): Promise<Record<FuelType, number>> {
  // Validate state code to prevent injection
  const stateCodePattern = /^[A-Z]{2}$/;
  if (!stateCodePattern.test(stateCode)) {
    log(`Invalid state code: ${stateCode}, using default state`, "fuel-api");
    stateCode = "FL";
  }

  // Use cached pricing if:
  // 1. It's not expired and for the same state OR
  // 2. We're currently rate limited
  const now = Date.now();
  
  // Check if we're currently rate limited
  if (priceCache.rateLimited && priceCache.rateLimitExpiry && now < priceCache.rateLimitExpiry) {
    log(`API currently rate limited, using cached prices until ${new Date(priceCache.rateLimitExpiry).toLocaleTimeString()}`, "fuel-api");
    return priceCache.prices;
  }
  
  // Check for valid cache
  if (
    priceCache.lastUpdated > 0 && 
    now - priceCache.lastUpdated < CACHE_EXPIRY && 
    priceCache.stateCode === stateCode
  ) {
    log(`Using cached fuel prices from ${new Date(priceCache.lastUpdated).toLocaleTimeString()}`, "fuel-api");
    return priceCache.prices;
  }

  try {
    // Validate API key
    if (!process.env.COLLECTAPI_KEY) {
      log("Missing COLLECTAPI_KEY environment variable", "fuel-api");
      throw new Error("API key not configured");
    }

    log(`Fetching fuel prices for ${stateCode} from CollectAPI`, "fuel-api");
    
    // Use retry pattern for resilience against transient failures
    const data = await retry(async () => {
      // Set timeout for request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        const response = await fetch(`https://api.collectapi.com/gasPrice/stateUsaPrice?state=${stateCode}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `apikey ${process.env.COLLECTAPI_KEY}`
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const responseText = await response.text();
          log(`API returned status ${response.status}: ${responseText}`, "fuel-api");
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        return data;
      } catch (error: any) {
        clearTimeout(timeoutId);
        
        // Handle timeout explicitly
        if (error.name === 'AbortError') {
          throw new Error('API request timed out');
        }
        
        throw error;
      }
    }, 3, 1000); // Try up to 3 times with 1s initial delay
    
    // Detailed validation of API response
    if (!data) {
      log("API returned null or undefined response", "fuel-api");
      throw new Error("Invalid API response");
    }
    
    // Validate success flag
    if (data.success !== true) {
      log(`API returned failure status: ${JSON.stringify(data)}`, "fuel-api");
      throw new Error("API returned failure status");
    }
    
    // Validate result array
    if (!data.result || !Array.isArray(data.result) || data.result.length === 0) {
      log("API returned empty or invalid result array", "fuel-api");
      throw new Error("Invalid result format");
    }
    
    // Get average prices with validation
    const prices = calculateAveragePrices(data.result);
    
    // Validate calculated prices before caching
    const hasValidPrices = Object.values(prices).every(price => 
      typeof price === 'number' && 
      !isNaN(price) && 
      price > 0 && 
      price < 10 // Sanity check - fuel likely won't be >$10/gallon
    );
    
    if (!hasValidPrices) {
      log(`Calculated invalid prices: ${JSON.stringify(prices)}`, "fuel-api");
      throw new Error("Calculated invalid fuel prices");
    }
    
    // Update cache with validated prices
    priceCache = {
      prices,
      lastUpdated: now,
      stateCode
    };

    log(`Successfully updated fuel prices: ${JSON.stringify(prices)}`, "fuel-api");
    return prices;
  } catch (error: any) {
    log(`Error fetching fuel prices: ${error.message || error}`, "fuel-api");
    
    // Handle rate limiting specially
    if (error.message && error.message.includes('429')) {
      log("Rate limit detected, backing off for a while", "fuel-api");
      
      // Update cache with rate limit info
      priceCache = {
        ...priceCache,
        rateLimited: true,
        rateLimitExpiry: Date.now() + RATE_LIMIT_BACKOFF
      };
      
      log(`Rate limit set, will not try again until ${new Date(priceCache.rateLimitExpiry!).toLocaleTimeString()}`, "fuel-api");
    }
    
    // If we have cached data, return it even if expired
    if (priceCache.lastUpdated > 0) {
      log("Using existing cached prices", "fuel-api");
      return priceCache.prices;
    }
    
    // Otherwise return default prices
    log("Using default fuel prices", "fuel-api");
    return DEFAULT_PRICES;
  }
}

/**
 * Calculate average prices across multiple cities
 */
function calculateAveragePrices(results: any[]): Record<FuelType, number> {
  let totals = {
    [FuelType.REGULAR_UNLEADED]: 0,
    [FuelType.PREMIUM_UNLEADED]: 0,
    [FuelType.DIESEL]: 0
  };
  
  let counts = {
    [FuelType.REGULAR_UNLEADED]: 0,
    [FuelType.PREMIUM_UNLEADED]: 0,
    [FuelType.DIESEL]: 0
  };

  // Sum up all prices
  for (const result of results) {
    // Check if this is a valid result object with price data
    if (!result || typeof result !== 'object') continue;
    
    // Parse regular gasoline price
    if (result.gasoline && typeof result.gasoline === 'string') {
      const regularPrice = parseFloat(result.gasoline.replace('$', ''));
      if (!isNaN(regularPrice)) {
        totals[FuelType.REGULAR_UNLEADED] += regularPrice;
        counts[FuelType.REGULAR_UNLEADED]++;
      }
    }
    
    // Parse premium gasoline price
    if (result.premium && typeof result.premium === 'string') {
      const premiumPrice = parseFloat(result.premium.replace('$', ''));
      if (!isNaN(premiumPrice)) {
        totals[FuelType.PREMIUM_UNLEADED] += premiumPrice;
        counts[FuelType.PREMIUM_UNLEADED]++;
      }
    }
    
    // Parse diesel price
    if (result.diesel && typeof result.diesel === 'string') {
      const dieselPrice = parseFloat(result.diesel.replace('$', ''));
      if (!isNaN(dieselPrice)) {
        totals[FuelType.DIESEL] += dieselPrice;
        counts[FuelType.DIESEL]++;
      }
    }
  }

  // Calculate averages
  const prices = {
    [FuelType.REGULAR_UNLEADED]: counts[FuelType.REGULAR_UNLEADED] > 0 
      ? totals[FuelType.REGULAR_UNLEADED] / counts[FuelType.REGULAR_UNLEADED] 
      : DEFAULT_PRICES[FuelType.REGULAR_UNLEADED],
      
    [FuelType.PREMIUM_UNLEADED]: counts[FuelType.PREMIUM_UNLEADED] > 0 
      ? totals[FuelType.PREMIUM_UNLEADED] / counts[FuelType.PREMIUM_UNLEADED] 
      : DEFAULT_PRICES[FuelType.PREMIUM_UNLEADED],
      
    [FuelType.DIESEL]: counts[FuelType.DIESEL] > 0 
      ? totals[FuelType.DIESEL] / counts[FuelType.DIESEL] 
      : DEFAULT_PRICES[FuelType.DIESEL]
  };

  return prices;
}