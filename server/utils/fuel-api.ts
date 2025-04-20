import { FuelType } from "@shared/schema";
import { log } from "../vite";
import { apiCache, longTermCache } from "./cache-manager";
import { globalApiLimiter } from "./api-limiter";
import { fetchWithRetry, RateLimitError } from "./error-handler";

// API Endpoint identifier for rate limiting
const FUEL_API_ENDPOINT = "fuel-prices-api";

/**
 * API response interfaces with comprehensive TypeScript definitions
 */
interface FuelPriceResponse {
  success: boolean;
  result: FuelPriceResult[];
  code?: number;
  message?: string;
}

interface FuelPriceResult {
  name: string;
  gasoline: string;
  midGrade: string;
  premium: string;
  diesel: string;
}

// Current default prices - April 2025
const DEFAULT_PRICES: Record<FuelType, number> = {
  [FuelType.REGULAR_UNLEADED]: 3.75,
  [FuelType.PREMIUM_UNLEADED]: 4.35,
  [FuelType.DIESEL]: 4.1,
};

// Initialize API rate limiter with conservative limits
// 5 requests per minute
globalApiLimiter.register(FUEL_API_ENDPOINT, 5, 60 * 1000);

/**
 * Enhanced fuel price fetching with advanced caching, rate limiting protection,
 * and comprehensive error handling
 * 
 * @param stateCode The US state code to get prices for (e.g., 'FL')
 * @param forceRefresh If true, bypass cache and force a fresh API call (use sparingly)
 * @returns Object with price per gallon for each fuel type
 */
export async function getFuelPrices(
  stateCode = "FL",
  forceRefresh = false,
): Promise<Record<FuelType, number>> {
  // Validate state code to prevent injection
  const stateCodePattern = /^[A-Z]{2}$/;
  if (!stateCodePattern.test(stateCode)) {
    log(`Invalid state code: ${stateCode}, using default state`, "fuel-api");
    stateCode = "FL";
  }
  
  // Create a cache key based on state code
  const cacheKey = `fuel-prices-${stateCode}`;
  
  try {
    // Skip cache if force refresh requested
    if (!forceRefresh) {
      // Try short-term cache first
      const cachedPrices = apiCache.get<Record<FuelType, number>>(cacheKey);
      if (cachedPrices) {
        log(`Using cached fuel prices for ${stateCode}`, "fuel-api");
        return cachedPrices;
      }
      
      // Try long-term cache as fallback (might be stale, but better than nothing)
      const stalePrices = longTermCache.get<Record<FuelType, number>>(cacheKey);
      if (stalePrices) {
        log(`Using stale cached fuel prices for ${stateCode}`, "fuel-api");
        return stalePrices;
      }
    }
    
    // Validate API key
    if (!process.env.COLLECTAPI_KEY) {
      log("Missing COLLECTAPI_KEY environment variable", "fuel-api");
      throw new Error("API key not configured");
    }
    
    // Check if we should throttle requests to avoid rate limiting
    if (!globalApiLimiter.checkLimit(FUEL_API_ENDPOINT)) {
      log("Throttling API requests to avoid rate limiting", "fuel-api");
      
      // Use default prices if no cache is available
      return DEFAULT_PRICES;
    }
    
    log(`Fetching fuel prices for ${stateCode} from CollectAPI`, "fuel-api");
    
    const data = await fetchWithRetry<FuelPriceResponse>(
      `https://api.collectapi.com/gasPrice/stateUsaPrice?state=${stateCode}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `apikey ${process.env.COLLECTAPI_KEY}`,
          // Add cache control headers to prevent caching issues
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      },
      2, // 2 retries
      1500, // 1.5 second initial delay
    );
    
    // Record successful API call
    globalApiLimiter.recordSuccess(FUEL_API_ENDPOINT);
    
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
    
    // Calculate average prices
    const prices = calculateAveragePrices(data.result);
    
    // Validate calculated prices before caching
    const hasValidPrices = Object.values(prices).every(
      (price) => typeof price === "number" && !isNaN(price) && price > 0 && price < 10,
    );
    
    if (!hasValidPrices) {
      log(`Calculated invalid prices: ${JSON.stringify(prices)}`, "fuel-api");
      throw new Error("Calculated invalid fuel prices");
    }
    
    // Store in both cache levels
    apiCache.set(cacheKey, prices, { ttl: 15 * 60 * 1000 }); // 15 minutes
    longTermCache.set(cacheKey, prices, { ttl: 24 * 60 * 60 * 1000 }); // 24 hours
    
    log(`Successfully updated fuel prices: ${JSON.stringify(prices)}`, "fuel-api");
    return prices;
  } catch (error) {
    // Handle rate limit errors
    if (error instanceof RateLimitError) {
      log(`Rate limit detected: ${error.message}`, "fuel-api");
      globalApiLimiter.recordFailure(FUEL_API_ENDPOINT, true, error.retryAfter);
    } 
    // Handle other errors
    else {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log(`Error fetching fuel prices: ${errorMessage}`, "fuel-api");
      
      // Check if it's a 429 rate limit error
      const isRateLimitError = errorMessage.includes("429");
      globalApiLimiter.recordFailure(FUEL_API_ENDPOINT, isRateLimitError);
    }
    
    // Try to use stale cache as fallback
    const staleCache = longTermCache.get<Record<FuelType, number>>(cacheKey);
    if (staleCache) {
      log("Using stale cached prices after error", "fuel-api");
      return staleCache;
    }
    
    // Last resort - use default prices
    log("Using default fuel prices - no cache available", "fuel-api");
    return DEFAULT_PRICES;
  }
}

/**
 * Calculate average prices across multiple cities
 * @param results Array of price results from the API
 * @returns Record of fuel types and their average prices
 */
function calculateAveragePrices(
  results: FuelPriceResult[],
): Record<FuelType, number> {
  const totals: Record<FuelType, number> = {
    [FuelType.REGULAR_UNLEADED]: 0,
    [FuelType.PREMIUM_UNLEADED]: 0,
    [FuelType.DIESEL]: 0,
  };

  const counts: Record<FuelType, number> = {
    [FuelType.REGULAR_UNLEADED]: 0,
    [FuelType.PREMIUM_UNLEADED]: 0,
    [FuelType.DIESEL]: 0,
  };

  // Sum up all prices
  for (const result of results) {
    // Check if this is a valid result object with price data
    if (!result || typeof result !== "object") continue;

    // Parse regular gasoline price
    if (result.gasoline && typeof result.gasoline === "string") {
      const regularPrice = parseFloat(result.gasoline.replace("$", ""));
      if (!isNaN(regularPrice)) {
        totals[FuelType.REGULAR_UNLEADED] += regularPrice;
        counts[FuelType.REGULAR_UNLEADED]++;
      }
    }

    // Parse premium gasoline price
    if (result.premium && typeof result.premium === "string") {
      const premiumPrice = parseFloat(result.premium.replace("$", ""));
      if (!isNaN(premiumPrice)) {
        totals[FuelType.PREMIUM_UNLEADED] += premiumPrice;
        counts[FuelType.PREMIUM_UNLEADED]++;
      }
    }

    // Parse diesel price
    if (result.diesel && typeof result.diesel === "string") {
      const dieselPrice = parseFloat(result.diesel.replace("$", ""));
      if (!isNaN(dieselPrice)) {
        totals[FuelType.DIESEL] += dieselPrice;
        counts[FuelType.DIESEL]++;
      }
    }
  }

  // Calculate averages
  const prices = {
    [FuelType.REGULAR_UNLEADED]:
      counts[FuelType.REGULAR_UNLEADED] > 0
        ? totals[FuelType.REGULAR_UNLEADED] / counts[FuelType.REGULAR_UNLEADED]
        : DEFAULT_PRICES[FuelType.REGULAR_UNLEADED],

    [FuelType.PREMIUM_UNLEADED]:
      counts[FuelType.PREMIUM_UNLEADED] > 0
        ? totals[FuelType.PREMIUM_UNLEADED] / counts[FuelType.PREMIUM_UNLEADED]
        : DEFAULT_PRICES[FuelType.PREMIUM_UNLEADED],

    [FuelType.DIESEL]:
      counts[FuelType.DIESEL] > 0
        ? totals[FuelType.DIESEL] / counts[FuelType.DIESEL]
        : DEFAULT_PRICES[FuelType.DIESEL],
  };

  return prices;
}