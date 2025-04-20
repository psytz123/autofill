/**
 * Shared Analytics and Performance Monitoring Utilities
 * Common functionality for tracking events and performance metrics across platforms
 */

// Types of events we can track
export enum EventType {
  PAGE_VIEW = 'page_view',
  SCREEN_VIEW = 'screen_view',
  USER_ACTION = 'user_action',
  ERROR = 'error',
  PERFORMANCE = 'performance',
  API_CALL = 'api_call',
  LIFECYCLE = 'lifecycle'
}

// Performance metric categories
export enum PerformanceCategory {
  API_LATENCY = 'api_latency',
  RENDER_TIME = 'render_time',
  LOAD_TIME = 'load_time',
  INTERACTION_TIME = 'interaction_time',
  RESOURCE_LOAD = 'resource_load',
  MEMORY_USAGE = 'memory_usage',
  FIRST_PAINT = 'first_paint',
  FIRST_CONTENTFUL_PAINT = 'first_contentful_paint',
  TIME_TO_INTERACTIVE = 'time_to_interactive'
}

// Standard event properties
export interface EventProperties {
  [key: string]: any;
}

// Analytics event interface
export interface AnalyticsEvent {
  type: EventType;
  name: string;
  timestamp: number;
  properties?: EventProperties;
}

// Performance metric interface
export interface PerformanceMetric {
  category: PerformanceCategory;
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'percent' | 'count';
  timestamp: number;
  tags?: Record<string, string>;
}

// Interface for analytics providers
export interface IAnalyticsProvider {
  trackEvent(event: AnalyticsEvent): Promise<void>;
  trackPerformance(metric: PerformanceMetric): Promise<void>;
  setUserProperties(properties: Record<string, any>): Promise<void>;
  identify(userId: string, traits?: Record<string, any>): Promise<void>;
}

// Generic no-op analytics provider
class NoOpAnalyticsProvider implements IAnalyticsProvider {
  async trackEvent(_event: AnalyticsEvent): Promise<void> {}
  async trackPerformance(_metric: PerformanceMetric): Promise<void> {}
  async setUserProperties(_properties: Record<string, any>): Promise<void> {}
  async identify(_userId: string, _traits?: Record<string, any>): Promise<void> {}
}

/**
 * Analytics Service
 * Unified interface for tracking events and metrics
 */
export class AnalyticsService {
  private providers: IAnalyticsProvider[] = [];
  private defaultProperties: Record<string, any> = {};
  private enabled: boolean = true;
  
  /**
   * Create a new analytics service
   * @param providers Analytics providers to use
   */
  constructor(providers: IAnalyticsProvider[] = []) {
    this.providers = providers.length ? providers : [new NoOpAnalyticsProvider()];
    
    // Set some default properties that will be included with all events
    this.defaultProperties = {
      platform: typeof window !== 'undefined' ? 'web' : 'mobile',
      appVersion: typeof window !== 'undefined' ? (window.__APP_VERSION__ || 'unknown') : 'unknown',
      sessionId: this.generateSessionId(),
      // Add other default properties as needed
    };
  }
  
  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  /**
   * Enable or disable analytics tracking
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
  
  /**
   * Add a new analytics provider
   */
  addProvider(provider: IAnalyticsProvider): void {
    this.providers.push(provider);
  }
  
  /**
   * Remove an analytics provider
   */
  removeProvider(provider: IAnalyticsProvider): void {
    this.providers = this.providers.filter(p => p !== provider);
  }
  
  /**
   * Set default properties to include with all events
   */
  setDefaultProperties(properties: Record<string, any>): void {
    this.defaultProperties = {
      ...this.defaultProperties,
      ...properties
    };
  }
  
  /**
   * Track an analytics event
   */
  async trackEvent(
    type: EventType,
    name: string,
    properties?: EventProperties
  ): Promise<void> {
    if (!this.enabled) return;
    
    const event: AnalyticsEvent = {
      type,
      name,
      timestamp: Date.now(),
      properties: {
        ...this.defaultProperties,
        ...properties
      }
    };
    
    await Promise.all(
      this.providers.map(provider => 
        provider.trackEvent(event).catch(err => 
          console.error('Error tracking event:', err)
        )
      )
    );
  }
  
  /**
   * Track a performance metric
   */
  async trackPerformance(
    category: PerformanceCategory,
    name: string,
    value: number,
    unit: 'ms' | 'bytes' | 'percent' | 'count' = 'ms',
    tags?: Record<string, string>
  ): Promise<void> {
    if (!this.enabled) return;
    
    const metric: PerformanceMetric = {
      category,
      name,
      value,
      unit,
      timestamp: Date.now(),
      tags
    };
    
    await Promise.all(
      this.providers.map(provider => 
        provider.trackPerformance(metric).catch(err => 
          console.error('Error tracking performance:', err)
        )
      )
    );
  }
  
  /**
   * Set properties for the current user
   */
  async setUserProperties(properties: Record<string, any>): Promise<void> {
    if (!this.enabled) return;
    
    await Promise.all(
      this.providers.map(provider => 
        provider.setUserProperties(properties).catch(err => 
          console.error('Error setting user properties:', err)
        )
      )
    );
  }
  
  /**
   * Identify a user
   */
  async identify(userId: string, traits?: Record<string, any>): Promise<void> {
    if (!this.enabled) return;
    
    await Promise.all(
      this.providers.map(provider => 
        provider.identify(userId, traits).catch(err => 
          console.error('Error identifying user:', err)
        )
      )
    );
  }
  
  /**
   * Track a page view (web-specific)
   */
  async trackPageView(
    pageName: string,
    path: string,
    properties?: EventProperties
  ): Promise<void> {
    await this.trackEvent(EventType.PAGE_VIEW, pageName, {
      path,
      ...properties
    });
  }
  
  /**
   * Track a screen view (mobile-specific)
   */
  async trackScreenView(
    screenName: string,
    properties?: EventProperties
  ): Promise<void> {
    await this.trackEvent(EventType.SCREEN_VIEW, screenName, properties);
  }
  
  /**
   * Track a user action
   */
  async trackAction(
    actionName: string,
    properties?: EventProperties
  ): Promise<void> {
    await this.trackEvent(EventType.USER_ACTION, actionName, properties);
  }
  
  /**
   * Track an error
   */
  async trackError(
    errorName: string,
    error: Error,
    properties?: EventProperties
  ): Promise<void> {
    await this.trackEvent(EventType.ERROR, errorName, {
      message: error.message,
      stack: error.stack,
      ...properties
    });
  }
  
  /**
   * Track an API call
   */
  async trackApiCall(
    endpoint: string,
    method: string,
    statusCode: number,
    duration: number,
    properties?: EventProperties
  ): Promise<void> {
    await this.trackEvent(EventType.API_CALL, endpoint, {
      method,
      statusCode,
      duration,
      ...properties
    });
    
    // Also track as a performance metric
    await this.trackPerformance(
      PerformanceCategory.API_LATENCY,
      `${method} ${endpoint}`,
      duration,
      'ms',
      { statusCode: String(statusCode) }
    );
  }
}

// Create a shared timing utility for performance measurement
export class PerformanceTimer {
  private startTime: number;
  private marks: Map<string, number> = new Map();
  
  constructor() {
    this.startTime = this.now();
  }
  
  /**
   * Get current time in milliseconds
   */
  private now(): number {
    // Use performance.now() if available (more precise), otherwise use Date.now()
    return typeof performance !== 'undefined' ? performance.now() : Date.now();
  }
  
  /**
   * Mark a point in time
   */
  mark(name: string): void {
    this.marks.set(name, this.now());
  }
  
  /**
   * Measure time between two marks
   */
  measure(endName: string, startName?: string): number {
    const endTime = this.marks.get(endName);
    
    if (!endTime) {
      throw new Error(`Mark "${endName}" not found`);
    }
    
    let startTime: number;
    
    if (startName) {
      startTime = this.marks.get(startName) || this.startTime;
      if (!startTime) {
        throw new Error(`Mark "${startName}" not found`);
      }
    } else {
      startTime = this.startTime;
    }
    
    return endTime - startTime;
  }
  
  /**
   * Get total elapsed time since timer creation
   */
  getElapsedTime(): number {
    return this.now() - this.startTime;
  }
  
  /**
   * Reset the timer
   */
  reset(): void {
    this.startTime = this.now();
    this.marks.clear();
  }
}