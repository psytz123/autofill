import { FuelType } from "@shared/schema";
import { log } from "./vite";
import { randomInt } from "crypto";

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

/**
 * Enhanced cache interface with improved rate limiting and timestamp tracking
 */
interface PriceCache {
  prices: Record<FuelType, number>;
  lastUpdated: number;
  stateCode: string;
  rateLimited: boolean;
  rateLimitExpiry: number; // When to try API again after rate limit
  requestCount: number; // Track API request volume
  lastRequestTime: number; // Last time we made a request
  consecutiveFailures: number; // Track consecutive API failures
}

// Current default prices - April 2025
const DEFAULT_PRICES: Record<FuelType, number> = {
  [FuelType.REGULAR_UNLEADED]: 3.75,
  [FuelType.PREMIUM_UNLEADED]: 4.35,
  [FuelType.DIESEL]: 4.1,
};

// Cache duration configuration
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const CACHE_STALE_WARNING = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

// Rate limiting configuration
const RATE_LIMIT_BACKOFF_MIN = 15 * 60 * 1000; // 15 minutes minimum backoff
const RATE_LIMIT_BACKOFF_MAX = 4 * 60 * 60 * 1000; // 4 hours maximum backoff
const RATE_LIMIT_EXTENDED_FACTOR = 2; // Double the backoff time on consecutive rate limits
const MAX_REQUESTS_PER_MINUTE = 3; // Reduced from 5 to be more conservative
const REQUEST_THROTTLE_WINDOW = 60 * 1000; // 1 minute window for throttling

// Initialize cache with default values
let priceCache: PriceCache = {
  prices: { ...DEFAULT_PRICES },
  lastUpdated: 0,
  stateCode: "US",
  rateLimited: false,
  rateLimitExpiry: 0,
  requestCount: 0,
  lastRequestTime: 0,
  consecutiveFailures: 0
};

/**
 * Generates a random delay with jitter for more effective backoff
 * @param baseDelayMs Base delay in milliseconds
 * @param jitterFactor Amount of randomness (0-1)
 * @returns Delay time in milliseconds with jitter applied
 */
function getDelayWithJitter(baseDelayMs: number, jitterFactor = 0.3): number {
  const jitterAmount = baseDelayMs * jitterFactor;
  return baseDelayMs + randomInt(-Math.floor(jitterAmount), Math.floor(jitterAmount));
}

/**
 * Retry a function multiple times with exponential backoff and jitter
 * @param fn Function to retry
 * @param retries Number of retries
 * @param initialDelay Initial delay in ms
 */
async function retry<T>(
  fn: () => Promise<T>,
  retries: number,
  initialDelay: number,
): Promise<T> {
  let currentDelay = initialDelay;
  let attempt = 0;

  while (true) {
    try {
      attempt++;
      return await fn();
    } catch (error: any) {
      if (attempt > retries) {
        throw error; // We've exhausted our retries
      }

      const errorMessage = error.message || String(error);
      log(
        `Retrying after error: ${errorMessage}. Attempt ${attempt} of ${retries + 1}`,
        "fuel-api",
      );

      // Add jitter to avoid thundering herd problem when multiple instances retry at once
      const delayWithJitter = getDelayWithJitter(currentDelay);
      log(`Waiting ${Math.round(delayWithJitter / 1000)} seconds before next attempt`, "fuel-api");
      
      // Wait for the delay before retrying
      await new Promise((resolve) => setTimeout(resolve, delayWithJitter));

      // Increase delay for next attempt with a max cap to prevent excessive waits
      currentDelay = Math.min(currentDelay * 2, 30000); // Max 30 seconds between retries
    }
  }
}

/**
 * Determine if we should throttle requests to avoid rate limiting
 * Smart throttling based on recent API behavior
 * @returns boolean indicating if we should skip making API request
 */
function shouldThrottleRequest(): boolean {
  const now = Date.now();

  // If we've had consecutive failures, be more conservative
  const dynamicMaxRequests = Math.max(
    1, // Minimum 1 request allowed
    MAX_REQUESTS_PER_MINUTE - Math.min(2, priceCache.consecutiveFailures) // Reduce by up to 2 based on failures
  );

  // If this is the first request or it's been more than our throttle window, reset the counter
  if (
    priceCache.lastRequestTime === 0 ||
    now - priceCache.lastRequestTime > REQUEST_THROTTLE_WINDOW
  ) {
    priceCache.requestCount = 1;
    priceCache.lastRequestTime = now;
    return false;
  }

  // If we've made too many requests in the throttle window, apply throttling
  if (priceCache.requestCount >= dynamicMaxRequests) {
    log(
      `Throttling API request (${priceCache.requestCount} requests in the last minute, max ${dynamicMaxRequests})`,
      "fuel-api",
    );
    return true;
  }

  // Otherwise, increment the counter and allow the request
  priceCache.requestCount++;
  priceCache.lastRequestTime = now;
  return false;
}

/**
 * Calculate appropriate backoff time based on failure history
 * Implements progressive backoff with increasing severity
 */
function calculateBackoffTime(): number {
  // Base backoff increases with consecutive failures
  const backoffMultiplier = Math.min(
    Math.pow(RATE_LIMIT_EXTENDED_FACTOR, priceCache.consecutiveFailures),
    RATE_LIMIT_BACKOFF_MAX / RATE_LIMIT_BACKOFF_MIN // Cap the multiplier
  );
  
  // Calculate backoff time with some randomness
  const baseBackoff = RATE_LIMIT_BACKOFF_MIN * backoffMultiplier;
  const maxBackoff = Math.min(baseBackoff, RATE_LIMIT_BACKOFF_MAX);
  const backoffWithJitter = getDelayWithJitter(maxBackoff, 0.2); // 20% jitter
  
  return backoffWithJitter;
}

/**
 * Enhanced fuel price fetching with retries, rate limiting protection, and comprehensive caching
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

  const now = Date.now();

  // Check if we're currently rate limited
  if (priceCache.rateLimited && now < priceCache.rateLimitExpiry) {
    const minutesRemaining = Math.ceil((priceCache.rateLimitExpiry - now) / (60 * 1000));
    log(
      `API currently rate limited, using cached prices. Rate limit expires in ${minutesRemaining} minutes`,
      "fuel-api",
    );
    return priceCache.prices;
  }

  // Check for valid cache unless force refresh is requested
  if (
    !forceRefresh &&
    priceCache.lastUpdated > 0 &&
    now - priceCache.lastUpdated < CACHE_EXPIRY &&
    priceCache.stateCode === stateCode
  ) {
    // Log different message if cache is getting stale
    if (now - priceCache.lastUpdated > CACHE_STALE_WARNING) {
      const hoursOld = Math.round((now - priceCache.lastUpdated) / 3600000);
      log(
        `Using stale cached fuel prices (${hoursOld} hours old)`,
        "fuel-api",
      );
    } else {
      const minutesOld = Math.round((now - priceCache.lastUpdated) / 60000);
      log(
        `Using cached fuel prices (${minutesOld} minutes old)`,
        "fuel-api",
      );
    }
    return priceCache.prices;
  }

  // Check request throttling to avoid unnecessary rate limit errors
  if (shouldThrottleRequest()) {
    log("Throttling API requests to avoid rate limiting", "fuel-api");
    return priceCache.lastUpdated > 0 ? priceCache.prices : DEFAULT_PRICES;
  }

  try {
    // Validate API key
    if (!process.env.COLLECTAPI_KEY) {
      log("Missing COLLECTAPI_KEY environment variable", "fuel-api");
      throw new Error("API key not configured");
    }

    log(`Fetching fuel prices for ${stateCode} from CollectAPI`, "fuel-api");

    // Use retry pattern for resilience against transient failures
    const data = await retry<FuelPriceResponse>(
      async () => {
        // Set timeout for request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout (reduced from 10s)

        try {
          const response = await fetch(
            `https://api.collectapi.com/gasPrice/stateUsaPrice?state=${stateCode}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `apikey ${process.env.COLLECTAPI_KEY}`,
                // Add cache control headers to prevent caching issues
                "Cache-Control": "no-cache",
                "Pragma": "no-cache"
              },
              signal: controller.signal,
            },
          );

          clearTimeout(timeoutId);

          if (!response.ok) {
            const responseText = await response.text();
            log(
              `API returned status ${response.status}: ${responseText}`,
              "fuel-api",
            );
            throw new Error(
              `API request failed with status ${response.status}`,
            );
          }

          const data = await response.json();
          return data as FuelPriceResponse;
        } catch (error: any) {
          clearTimeout(timeoutId);

          // Handle timeout explicitly
          if (error.name === "AbortError") {
            throw new Error("API request timed out");
          }

          throw error;
        }
      },
      2, // Reduced from 3 to 2 retries to avoid excessive API load
      1500, // Increased initial delay from 1000ms to 1500ms
    );

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
    if (
      !data.result ||
      !Array.isArray(data.result) ||
      data.result.length === 0
    ) {
      log("API returned empty or invalid result array", "fuel-api");
      throw new Error("Invalid result format");
    }

    // Get average prices with validation
    const prices = calculateAveragePrices(data.result);

    // Validate calculated prices before caching
    const hasValidPrices = Object.values(prices).every(
      (price) =>
        typeof price === "number" && !isNaN(price) && price > 0 && price < 10, // Sanity check - fuel likely won't be >$10/gallon
    );

    if (!hasValidPrices) {
      log(`Calculated invalid prices: ${JSON.stringify(prices)}`, "fuel-api");
      throw new Error("Calculated invalid fuel prices");
    }

    // Reset consecutive failures on success
    priceCache.consecutiveFailures = 0;

    // Update cache with validated prices while preserving request tracking
    priceCache = {
      ...priceCache,
      prices,
      lastUpdated: now,
      stateCode,
      rateLimited: false,
      rateLimitExpiry: 0,
      // Keep the existing requestCount and lastRequestTime
      requestCount: priceCache.requestCount,
      lastRequestTime: priceCache.lastRequestTime,
      consecutiveFailures: 0, // Reset failures on success
    };

    log(
      `Successfully updated fuel prices: ${JSON.stringify(prices)}`,
      "fuel-api",
    );
    return prices;
  } catch (error: any) {
    log(`Error fetching fuel prices: ${error.message || error}`, "fuel-api");

    // Increment consecutive failures counter
    priceCache.consecutiveFailures += 1;
    
    // Log consecutive failure count
    log(`Consecutive API failures: ${priceCache.consecutiveFailures}`, "fuel-api");

    // Determine if this is a rate limiting error (status 429)
    const isRateLimitError = error.message && error.message.includes("429");

    if (isRateLimitError) {
      log("Rate limit detected, implementing smart backoff strategy", "fuel-api");

      // Calculate appropriate backoff based on failure history
      const backoffTime = calculateBackoffTime();
      const backoffMinutes = Math.round(backoffTime / (60 * 1000));

      // Update cache with rate limit info, maintaining tracking fields
      priceCache = {
        ...priceCache,
        rateLimited: true,
        rateLimitExpiry: now + backoffTime,
        requestCount: priceCache.requestCount,
        lastRequestTime: priceCache.lastRequestTime,
        consecutiveFailures: priceCache.consecutiveFailures,
      };

      log(
        `Rate limit backoff set for ${backoffMinutes} minutes due to consecutive failures: ${priceCache.consecutiveFailures}`,
        "fuel-api",
      );
    }

    // If we have cached data, return it even if expired
    if (priceCache.lastUpdated > 0) {
      const cacheAgeMinutes = Math.round((now - priceCache.lastUpdated) / (60 * 1000));
      log(`Using existing cached prices (${cacheAgeMinutes} minutes old)`, "fuel-api");
      return priceCache.prices;
    }

    // Otherwise use default prices
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
