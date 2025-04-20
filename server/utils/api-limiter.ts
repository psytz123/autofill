import { log } from "../vite";
import { RateLimitError } from "./error-handler";

/**
 * Tracks request rates and applies throttling with dynamic adjustment
 */
interface RateLimit {
  /**
   * Maximum number of requests allowed in the specified window
   */
  maxRequests: number;
  
  /**
   * Time window in milliseconds
   */
  windowMs: number;
  
  /**
   * Current count of requests in the window
   */
  currentCount: number;
  
  /**
   * Timestamp when the current window started
   */
  windowStart: number;
  
  /**
   * Adjusts the max requests based on error rates
   */
  dynamicAdjustment: number;
  
  /**
   * Consecutive failure count to track service health
   */
  consecutiveFailures: number;
  
  /**
   * If true, this endpoint is being rate limited
   */
  rateLimited: boolean;
  
  /**
   * Timestamp when rate limiting expires
   */
  rateLimitExpiry: number;
}

/**
 * Rate limiting and throttling manager for API calls
 * Provides adaptive rate limiting based on response feedback
 */
export class ApiLimiter {
  private limits: Map<string, RateLimit> = new Map();
  
  /**
   * Create a new rate limiter for a specific API endpoint
   * 
   * @param endpoint Identifier for the API endpoint 
   * @param maxRequests Maximum requests allowed in the time window
   * @param windowMs Time window in milliseconds
   */
  register(endpoint: string, maxRequests: number, windowMs: number = 60000): void {
    this.limits.set(endpoint, {
      maxRequests,
      windowMs,
      currentCount: 0,
      windowStart: Date.now(),
      dynamicAdjustment: 0,
      consecutiveFailures: 0,
      rateLimited: false,
      rateLimitExpiry: 0
    });
    
    log(`Registered rate limit for ${endpoint}: ${maxRequests} requests per ${windowMs}ms`, "api-limiter");
  }
  
  /**
   * Check if a request can be made to the specified endpoint
   * 
   * @param endpoint Identifier for the API endpoint
   * @returns True if the request can proceed, false if it should be throttled
   * @throws RateLimitError if the endpoint is currently rate limited
   */
  checkLimit(endpoint: string): boolean {
    // Get rate limit info for this endpoint
    const limit = this.limits.get(endpoint);
    
    // If no limit is registered, allow the request
    if (!limit) {
      return true;
    }
    
    const now = Date.now();
    
    // Check if currently rate limited
    if (limit.rateLimited && now < limit.rateLimitExpiry) {
      const remainingSeconds = Math.ceil((limit.rateLimitExpiry - now) / 1000);
      throw new RateLimitError(
        `Rate limit exceeded for ${endpoint}. Try again in ${remainingSeconds} seconds.`,
        remainingSeconds
      );
    }
    
    // Reset window if needed
    if (now - limit.windowStart > limit.windowMs) {
      limit.windowStart = now;
      limit.currentCount = 0;
    }
    
    // Calculate effective request limit with dynamic adjustment
    const effectiveLimit = Math.max(1, limit.maxRequests - limit.dynamicAdjustment);
    
    // Check if limit exceeded
    if (limit.currentCount >= effectiveLimit) {
      return false;
    }
    
    // Increment counter and allow request
    limit.currentCount++;
    return true;
  }
  
  /**
   * Record a successful API call
   * 
   * @param endpoint Identifier for the API endpoint
   */
  recordSuccess(endpoint: string): void {
    const limit = this.limits.get(endpoint);
    if (!limit) return;
    
    // Reset consecutive failures on success
    if (limit.consecutiveFailures > 0) {
      limit.consecutiveFailures = 0;
      
      // Gradually restore dynamic adjustment if it was reduced
      if (limit.dynamicAdjustment > 0) {
        limit.dynamicAdjustment = Math.max(0, limit.dynamicAdjustment - 1);
      }
    }
  }
  
  /**
   * Record a failed API call, with special handling for rate limiting errors
   * 
   * @param endpoint Identifier for the API endpoint
   * @param isRateLimitError Whether the failure was due to a rate limit response
   * @param retryAfter Optional retry-after time in seconds
   */
  recordFailure(endpoint: string, isRateLimitError: boolean = false, retryAfter?: number): void {
    const limit = this.limits.get(endpoint);
    if (!limit) return;
    
    // Increment consecutive failures
    limit.consecutiveFailures++;
    
    const now = Date.now();
    
    // Handle rate limit errors specifically
    if (isRateLimitError) {
      // Calculate backoff time based on consecutive failures and retry-after
      let backoffMs: number;
      
      if (retryAfter) {
        // Use server-provided retry-after value if available
        backoffMs = retryAfter * 1000;
      } else {
        // Calculate exponential backoff with jitter
        const baseBackoff = 60000 * Math.pow(2, Math.min(limit.consecutiveFailures - 1, 4));
        const jitter = Math.random() * 0.3 * baseBackoff;
        backoffMs = baseBackoff + jitter;
      }
      
      // Set rate limited state
      limit.rateLimited = true;
      limit.rateLimitExpiry = now + backoffMs;
      
      const backoffMinutes = Math.ceil(backoffMs / 60000);
      log(`Rate limited ${endpoint} for ${backoffMinutes} minutes due to ${limit.consecutiveFailures} consecutive failures`, "api-limiter");
    }
    
    // Apply dynamic adjustment to reduce request rate
    limit.dynamicAdjustment = Math.min(
      limit.maxRequests - 1, // Leave at least 1 request allowed
      limit.dynamicAdjustment + Math.ceil(limit.consecutiveFailures / 2)
    );
    
    // Log the adjustment
    log(`Adjusted rate limit for ${endpoint}: now ${limit.maxRequests - limit.dynamicAdjustment} requests per window (down by ${limit.dynamicAdjustment})`, "api-limiter");
  }
  
  /**
   * Get current status of rate limits for monitoring and debugging
   */
  getStatus(): Record<string, any> {
    const status: Record<string, any> = {};
    
    for (const [endpoint, limit] of this.limits.entries()) {
      const now = Date.now();
      const windowRemaining = Math.max(0, limit.windowMs - (now - limit.windowStart));
      const effectiveLimit = Math.max(1, limit.maxRequests - limit.dynamicAdjustment);
      
      status[endpoint] = {
        maxRequests: limit.maxRequests,
        effectiveLimit,
        currentCount: limit.currentCount,
        remainingRequests: Math.max(0, effectiveLimit - limit.currentCount),
        windowResetIn: Math.ceil(windowRemaining / 1000),
        rateLimited: limit.rateLimited,
        consecutiveFailures: limit.consecutiveFailures
      };
      
      if (limit.rateLimited && now < limit.rateLimitExpiry) {
        status[endpoint].rateLimitRemainingSeconds = Math.ceil((limit.rateLimitExpiry - now) / 1000);
      }
    }
    
    return status;
  }
  
  /**
   * Manually clear rate limit for an endpoint (for testing/admin use)
   */
  clearRateLimit(endpoint: string): void {
    const limit = this.limits.get(endpoint);
    if (!limit) return;
    
    limit.rateLimited = false;
    limit.rateLimitExpiry = 0;
    limit.consecutiveFailures = 0;
    limit.dynamicAdjustment = 0;
    limit.currentCount = 0;
    limit.windowStart = Date.now();
    
    log(`Manually cleared rate limit for ${endpoint}`, "api-limiter");
  }
}

// Create default instance for app-wide use
export const globalApiLimiter = new ApiLimiter();