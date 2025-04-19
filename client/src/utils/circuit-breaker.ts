/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures by temporarily disabling operations that are likely to fail
 * Implements exponential backoff for retries and health monitoring
 */

interface CircuitBreakerOptions {
  failureThreshold: number;        // Number of failures before opening the circuit
  resetTimeout: number;            // Time in ms to wait before allowing a single request through
  monitorInterval?: number;        // Time in ms to wait between health checks
  onStateChange?: (state: CircuitBreakerState, context: any) => void; // Callback for state changes
  onSuccess?: (context: any) => void;  // Callback for successful operations 
  onFailure?: (error: Error, context: any) => void; // Callback for failed operations
}

export enum CircuitBreakerState {
  CLOSED = 'CLOSED',      // Normal operation, requests are allowed through
  OPEN = 'OPEN',          // Circuit is open, requests are blocked
  HALF_OPEN = 'HALF_OPEN' // Testing if the system has recovered
}

/**
 * Circuit Breaker implementation
 * Prevents cascading failures by temporarily disabling operations that are likely to fail
 */
export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount: number = 0;
  private lastError: Error | null = null;
  private nextAttemptTime: number = 0;
  private readonly failureThreshold: number;
  private readonly resetTimeout: number;
  private readonly monitorInterval: number;
  private monitorTimeoutId: NodeJS.Timeout | null = null;
  private readonly onStateChange?: (state: CircuitBreakerState, context: any) => void;
  private readonly onSuccess?: (context: any) => void;
  private readonly onFailure?: (error: Error, context: any) => void;
  private context: any = {};
  
  constructor(options: CircuitBreakerOptions) {
    this.failureThreshold = options.failureThreshold;
    this.resetTimeout = options.resetTimeout;
    this.monitorInterval = options.monitorInterval || this.resetTimeout;
    this.onStateChange = options.onStateChange;
    this.onSuccess = options.onSuccess;
    this.onFailure = options.onFailure;
  }
  
  /**
   * Gets the current state of the circuit breaker
   */
  getState(): CircuitBreakerState {
    return this.state;
  }
  
  /**
   * Gets the last error that occurred
   */
  getLastError(): Error | null {
    return this.lastError;
  }
  
  /**
   * Gets the time until the next retry attempt
   */
  getTimeUntilNextAttempt(): number {
    if (this.state !== CircuitBreakerState.OPEN) {
      return 0;
    }
    
    const now = Date.now();
    return Math.max(0, this.nextAttemptTime - now);
  }
  
  /**
   * Updates the context object for callbacks
   * @param newContext New context object to merge with existing context
   */
  updateContext(newContext: any): void {
    this.context = {
      ...this.context,
      ...newContext
    };
  }
  
  /**
   * Resets the circuit breaker to the closed state
   */
  reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.lastError = null;
    this.nextAttemptTime = 0;
    if (this.onStateChange) {
      this.onStateChange(this.state, this.context);
    }
  }
  
  /**
   * Executes a function with circuit breaker protection
   * @param fn Function to execute
   * @returns Promise with the result of the function
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // If circuit is open, check if it's time to try again
    if (this.state === CircuitBreakerState.OPEN) {
      const now = Date.now();
      if (now < this.nextAttemptTime) {
        throw new Error(`Circuit breaker is open, retry after ${new Date(this.nextAttemptTime).toLocaleTimeString()}`);
      }
      
      // Move to half-open state for a test request
      this.transitionToState(CircuitBreakerState.HALF_OPEN);
    }
    
    try {
      // Execute the function
      const result = await fn();
      
      // Handle success
      this.handleSuccess();
      
      return result;
    } catch (error: any) {
      // Handle failure
      this.handleFailure(error);
      
      throw error;
    }
  }
  
  /**
   * Manually trips the circuit breaker (useful for testing or manual intervention)
   * @param error Optional error to record
   */
  trip(error?: Error): void {
    this.lastError = error || new Error("Circuit manually tripped");
    this.transitionToState(CircuitBreakerState.OPEN);
    this.nextAttemptTime = Date.now() + this.resetTimeout;
  }
  
  /**
   * Handles a successful operation
   */
  private handleSuccess(): void {
    // If in half-open state, reset circuit
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.transitionToState(CircuitBreakerState.CLOSED);
    }
    
    // Reset failure count in closed state
    if (this.state === CircuitBreakerState.CLOSED) {
      this.failureCount = 0;
    }
    
    // Call success callback
    if (this.onSuccess) {
      this.onSuccess(this.context);
    }
  }
  
  /**
   * Handles a failed operation
   * @param error Error that occurred
   */
  private handleFailure(error: Error): void {
    this.lastError = error;
    
    // In half-open state, any failure moves back to open
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.transitionToState(CircuitBreakerState.OPEN);
      // Apply exponential backoff for retry time
      const backoff = Math.min(this.resetTimeout * Math.pow(2, this.failureCount), 30 * 60 * 1000); // Max 30 minutes
      this.nextAttemptTime = Date.now() + backoff;
      // Start health check timer
      this.startMonitoring();
    } else if (this.state === CircuitBreakerState.CLOSED) {
      this.failureCount++;
      
      // If threshold reached, trip the circuit
      if (this.failureCount >= this.failureThreshold) {
        this.transitionToState(CircuitBreakerState.OPEN);
        this.nextAttemptTime = Date.now() + this.resetTimeout;
        // Start health check timer
        this.startMonitoring();
      }
    }
    
    // Call failure callback
    if (this.onFailure) {
      this.onFailure(error, this.context);
    }
  }
  
  /**
   * Transitions the circuit breaker to a new state
   * @param newState New state to transition to
   */
  private transitionToState(newState: CircuitBreakerState): void {
    if (this.state === newState) {
      return;
    }
    
    this.state = newState;
    
    // If moving to closed state, stop monitoring
    if (newState === CircuitBreakerState.CLOSED) {
      this.stopMonitoring();
    }
    
    // Notify of state change
    if (this.onStateChange) {
      this.onStateChange(this.state, this.context);
    }
  }
  
  /**
   * Starts the health check monitoring
   */
  private startMonitoring(): void {
    // Clear any existing monitoring
    this.stopMonitoring();
    
    // Set up new monitoring
    this.monitorTimeoutId = setTimeout(() => {
      // Only transition if still in OPEN state (could have been manually reset)
      if (this.state === CircuitBreakerState.OPEN) {
        this.transitionToState(CircuitBreakerState.HALF_OPEN);
      }
    }, this.monitorInterval);
  }
  
  /**
   * Stops the health check monitoring
   */
  private stopMonitoring(): void {
    if (this.monitorTimeoutId) {
      clearTimeout(this.monitorTimeoutId);
      this.monitorTimeoutId = null;
    }
  }
}

/**
 * Create a circuit breaker instance with default settings
 * @param name Name of the circuit breaker (for logging)
 * @param options Circuit breaker options
 * @returns Circuit breaker instance
 */
export function createCircuitBreaker(name: string, options: Partial<CircuitBreakerOptions> = {}): CircuitBreaker {
  // Default settings
  const defaultOptions: CircuitBreakerOptions = {
    failureThreshold: 3,
    resetTimeout: 60 * 1000, // 1 minute
    monitorInterval: 60 * 1000, // 1 minute
    onStateChange: (state, context) => {
      console.log(`[CircuitBreaker:${name}] State changed to ${state}`, context);
    },
    onFailure: (error, context) => {
      console.error(`[CircuitBreaker:${name}] Failure:`, error.message, context);
    }
  };
  
  return new CircuitBreaker({
    ...defaultOptions,
    ...options
  });
}