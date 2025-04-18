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
}

// Default prices if API fails (fallback)
const DEFAULT_PRICES = {
  [FuelType.REGULAR_UNLEADED]: 3.49,
  [FuelType.PREMIUM_UNLEADED]: 3.99,
  [FuelType.DIESEL]: 3.79
};

// Cache expires after 1 hour (in milliseconds)
const CACHE_EXPIRY = 60 * 60 * 1000; 

// In-memory cache
let priceCache: PriceCache = {
  prices: { ...DEFAULT_PRICES },
  lastUpdated: 0,
  stateCode: "US"
};

/**
 * Fetch current fuel prices from CollectAPI
 * @param stateCode The US state code to get prices for (e.g., 'FL')
 * @returns Object with price per gallon for each fuel type
 */
export async function getFuelPrices(stateCode = "FL"): Promise<Record<FuelType, number>> {
  // Use cached pricing if it's not expired and for the same state
  const now = Date.now();
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
      throw new Error("Missing COLLECTAPI_KEY environment variable");
    }

    log(`Fetching fuel prices for ${stateCode} from CollectAPI`, "fuel-api");
    
    const response = await fetch(`https://api.collectapi.com/gasPrice/stateUsaPrice?state=${stateCode}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `apikey ${process.env.COLLECTAPI_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    // Log the actual response for debugging
    log(`API Response: ${JSON.stringify(data)}`, "fuel-api");
    
    // Handle different response formats or errors
    if (!data.success) {
      throw new Error("API returned failure status");
    }
    
    // Use default prices if the API doesn't return expected format
    if (!data.result || !Array.isArray(data.result) || data.result.length === 0) {
      log("API returned unexpected format or empty result", "fuel-api");
      return DEFAULT_PRICES;
    }

    // Get average prices, handling the specific API response format
    const prices = calculateAveragePrices(data.result);
    
    // Update cache
    priceCache = {
      prices,
      lastUpdated: now,
      stateCode
    };

    log(`Successfully updated fuel prices: ${JSON.stringify(prices)}`, "fuel-api");
    return prices;
  } catch (error) {
    log(`Error fetching fuel prices: ${error}`, "fuel-api");
    
    // If we have cached data, return it even if expired
    if (priceCache.lastUpdated > 0) {
      log("Using expired cached prices", "fuel-api");
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
function calculateAveragePrices(results: FuelPriceResult[]): Record<FuelType, number> {
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
    // Parse regular gasoline price
    const regularPrice = parseFloat(result.gasoline.replace('$', ''));
    if (!isNaN(regularPrice)) {
      totals[FuelType.REGULAR_UNLEADED] += regularPrice;
      counts[FuelType.REGULAR_UNLEADED]++;
    }
    
    // Parse premium gasoline price
    const premiumPrice = parseFloat(result.premium.replace('$', ''));
    if (!isNaN(premiumPrice)) {
      totals[FuelType.PREMIUM_UNLEADED] += premiumPrice;
      counts[FuelType.PREMIUM_UNLEADED]++;
    }
    
    // Parse diesel price
    const dieselPrice = parseFloat(result.diesel.replace('$', ''));
    if (!isNaN(dieselPrice)) {
      totals[FuelType.DIESEL] += dieselPrice;
      counts[FuelType.DIESEL]++;
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