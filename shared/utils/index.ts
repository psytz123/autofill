/**
 * Shared Utilities Index
 * 
 * This file exports all utilities from the shared package for easy imports.
 */

// Error handling exports
export * from './error-handling';

// Validation exports
export * from './validation';

// API client adaptable for web and mobile
export * from './api-client';

// Analytics types and events
export * from './analytics';

// Re-export other utility functions
export * from './common';

// Performance timer for benchmarking
export class PerformanceTimer {
  private startTime: number = 0;
  private endTime: number = 0;
  private running: boolean = false;

  /**
   * Start the timer
   * @returns This instance for chaining
   */
  start() {
    this.startTime = Date.now();
    this.running = true;
    return this;
  }

  /**
   * Stop the timer
   * @returns This instance for chaining
   */
  stop() {
    this.endTime = Date.now();
    this.running = false;
    return this;
  }

  /**
   * Reset the timer
   * @returns This instance for chaining
   */
  reset() {
    this.startTime = 0;
    this.endTime = 0;
    this.running = false;
    return this;
  }

  /**
   * Get the elapsed time in milliseconds
   * @returns Elapsed time or 0 if not started
   */
  getElapsedTime(): number {
    if (!this.startTime) {
      return 0;
    }
    
    if (this.running) {
      return Date.now() - this.startTime;
    }
    
    return this.endTime - this.startTime;
  }

  /**
   * Restart the timer (reset + start)
   * @returns This instance for chaining
   */
  restart() {
    return this.reset().start();
  }

  /**
   * Create a new timer that's already started
   * @returns A new started timer
   */
  static startNew(): PerformanceTimer {
    return new PerformanceTimer().start();
  }
}