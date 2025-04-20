/**
 * Shared Analytics Utilities
 * Common analytics functionality for both web and mobile platforms
 */

// Performance categories for metrics tracking
export enum PerformanceCategory {
  // Page load metrics
  FIRST_PAINT = 'first_paint',
  FIRST_CONTENTFUL_PAINT = 'first_contentful_paint',
  LARGEST_CONTENTFUL_PAINT = 'largest_contentful_paint',
  TIME_TO_INTERACTIVE = 'time_to_interactive',
  
  // User interaction metrics
  INTERACTION_TIME = 'interaction_time',
  INPUT_DELAY = 'input_delay',
  
  // API performance
  API_RESPONSE_TIME = 'api_response_time',
  API_ERROR_RATE = 'api_error_rate',
  
  // Resource performance
  RESOURCE_LOAD_TIME = 'resource_load_time',
  RESOURCE_SIZE = 'resource_size',
  
  // Application specific metrics
  MAP_LOAD_TIME = 'map_load_time',
  ORDER_COMPLETION_TIME = 'order_completion_time',
  PAYMENT_PROCESSING_TIME = 'payment_processing_time',
  
  // Performance health
  MEMORY_USAGE = 'memory_usage',
  JS_HEAP_SIZE = 'js_heap_size',
  LONG_TASKS = 'long_tasks',
  
  // User experience metrics
  LAYOUT_SHIFT = 'layout_shift',
}

// Event categories for user behavior tracking
export enum EventCategory {
  // Navigation events
  NAVIGATION = 'navigation',
  SCREEN_VIEW = 'screen_view',
  
  // User interactions
  BUTTON_CLICK = 'button_click',
  FORM_SUBMIT = 'form_submit',
  LINK_CLICK = 'link_click',
  
  // Feature usage
  LOCATION_SEARCH = 'location_search',
  VEHICLE_SELECT = 'vehicle_select',
  FUEL_TYPE_SELECT = 'fuel_type_select',
  
  // Business events
  ORDER_STARTED = 'order_started',
  ORDER_COMPLETED = 'order_completed',
  ORDER_CANCELLED = 'order_cancelled',
  PAYMENT_STARTED = 'payment_started',
  PAYMENT_COMPLETED = 'payment_completed',
  PAYMENT_FAILED = 'payment_failed',
  
  // User account
  USER_SIGNUP = 'user_signup',
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  PROFILE_UPDATE = 'profile_update',
  
  // Feature engagement
  NOTIFICATIONS_ENABLED = 'notifications_enabled',
  LOCATION_PERMISSION = 'location_permission',
  SAVED_LOCATION = 'saved_location',
}

// Interface for analytics events
export interface AnalyticsEvent {
  category: EventCategory;
  action: string;
  label?: string;
  value?: number;
  properties?: Record<string, any>;
  timestamp?: number;
}

// Interface for performance metrics
export interface PerformanceMetric {
  category: PerformanceCategory;
  name: string;
  value: number;
  unit?: 'ms' | 'bytes' | 'percent' | 'count';
  context?: Record<string, any>;
  timestamp?: number;
}

// Base analytics provider interface
export interface AnalyticsProvider {
  init(options?: Record<string, any>): Promise<void>;
  trackEvent(event: AnalyticsEvent): void;
  trackPerformance(metric: PerformanceMetric): void;
  setUserId(userId: string | null): void;
  setUserProperties(properties: Record<string, any>): void;
}

// Performance timer utility
export class PerformanceTimer {
  private startTime: number;
  private endTime: number | null = null;
  
  constructor() {
    // Use performance.now() if available, otherwise fallback to Date.now()
    this.startTime = typeof performance !== 'undefined' 
      ? performance.now() 
      : Date.now();
  }
  
  /**
   * Stop the timer
   */
  stop(): number {
    this.endTime = typeof performance !== 'undefined' 
      ? performance.now() 
      : Date.now();
      
    return this.getElapsedTime();
  }
  
  /**
   * Get the elapsed time in milliseconds
   */
  getElapsedTime(): number {
    const endTime = this.endTime || (typeof performance !== 'undefined' 
      ? performance.now() 
      : Date.now());
      
    return endTime - this.startTime;
  }
  
  /**
   * Reset the timer to start from now
   */
  reset(): void {
    this.startTime = typeof performance !== 'undefined' 
      ? performance.now() 
      : Date.now();
    this.endTime = null;
  }
}

// Singleton analytics manager
let analyticsInstance: AnalyticsManager | null = null;

// Analytics manager that can work with multiple providers
export class AnalyticsManager {
  private providers: AnalyticsProvider[] = [];
  private userId: string | null = null;
  private userProperties: Record<string, any> = {};
  private isEnabled: boolean = true;
  private samplingRate: number = 1.0; // 100% by default
  
  /**
   * Add an analytics provider
   */
  addProvider(provider: AnalyticsProvider): void {
    this.providers.push(provider);
  }
  
  /**
   * Initialize all registered providers
   */
  async init(options?: Record<string, any>): Promise<void> {
    for (const provider of this.providers) {
      try {
        await provider.init(options);
      } catch (error) {
        console.error(`Failed to initialize analytics provider:`, error);
      }
    }
    
    if (options?.samplingRate !== undefined) {
      this.samplingRate = options.samplingRate;
    }
    
    if (options?.enabled !== undefined) {
      this.isEnabled = options.enabled;
    }
  }
  
  /**
   * Track an analytics event
   */
  trackEvent(event: AnalyticsEvent): void {
    if (!this.isEnabled || Math.random() > this.samplingRate) {
      return;
    }
    
    const enhancedEvent = {
      ...event,
      timestamp: event.timestamp || Date.now()
    };
    
    for (const provider of this.providers) {
      try {
        provider.trackEvent(enhancedEvent);
      } catch (error) {
        console.error(`Failed to track event:`, error);
      }
    }
  }
  
  /**
   * Track a performance metric
   */
  trackPerformance(metric: PerformanceMetric): void {
    if (!this.isEnabled || Math.random() > this.samplingRate) {
      return;
    }
    
    const enhancedMetric = {
      ...metric,
      timestamp: metric.timestamp || Date.now()
    };
    
    for (const provider of this.providers) {
      try {
        provider.trackPerformance(enhancedMetric);
      } catch (error) {
        console.error(`Failed to track performance metric:`, error);
      }
    }
  }
  
  /**
   * Set the current user ID
   */
  setUserId(userId: string | null): void {
    this.userId = userId;
    
    for (const provider of this.providers) {
      try {
        provider.setUserId(userId);
      } catch (error) {
        console.error(`Failed to set user ID:`, error);
      }
    }
  }
  
  /**
   * Set properties for the current user
   */
  setUserProperties(properties: Record<string, any>): void {
    this.userProperties = {
      ...this.userProperties,
      ...properties
    };
    
    for (const provider of this.providers) {
      try {
        provider.setUserProperties(this.userProperties);
      } catch (error) {
        console.error(`Failed to set user properties:`, error);
      }
    }
  }
  
  /**
   * Enable or disable analytics
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }
  
  /**
   * Set sampling rate (0-1) to control data volume
   */
  setSamplingRate(rate: number): void {
    this.samplingRate = Math.max(0, Math.min(1, rate));
  }
}

/**
 * Get the singleton analytics manager instance
 */
export function getAnalytics(): AnalyticsManager {
  if (!analyticsInstance) {
    analyticsInstance = new AnalyticsManager();
  }
  return analyticsInstance;
}

/**
 * Reset the analytics manager (useful for testing)
 */
export function resetAnalytics(): void {
  analyticsInstance = null;
}