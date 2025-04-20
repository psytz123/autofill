/**
 * Analytics Utilities
 * 
 * This module provides standardized analytics interfaces for use across web and mobile platforms.
 */

/**
 * Event categories
 */
export enum EventCategory {
  // Navigation events
  SCREEN_VIEW = 'screen_view',
  PAGE_VIEW = 'page_view',
  NAVIGATION = 'navigation',
  
  // Interaction events
  BUTTON_CLICK = 'button_click',
  FORM_SUBMIT = 'form_submit',
  INPUT_CHANGE = 'input_change',
  DROPDOWN_SELECT = 'dropdown_select',
  GESTURE = 'gesture',
  SWIPE = 'swipe',
  PULL_TO_REFRESH = 'pull_to_refresh',
  
  // Content events
  CONTENT_VIEW = 'content_view',
  CONTENT_SHARE = 'content_share',
  CONTENT_SAVE = 'content_save',
  MEDIA_PLAY = 'media_play',
  MEDIA_PAUSE = 'media_pause',
  MEDIA_COMPLETE = 'media_complete',
  
  // Conversion events
  ADD_TO_CART = 'add_to_cart',
  REMOVE_FROM_CART = 'remove_from_cart',
  CHECKOUT_START = 'checkout_start',
  CHECKOUT_COMPLETE = 'checkout_complete',
  PURCHASE = 'purchase',
  PAYMENT_INFO_ENTER = 'payment_info_enter',
  SUBSCRIPTION_START = 'subscription_start',
  SUBSCRIPTION_RENEW = 'subscription_renew',
  SUBSCRIPTION_CANCEL = 'subscription_cancel',
  
  // User events
  SIGNUP = 'signup',
  LOGIN = 'login',
  LOGOUT = 'logout',
  PROFILE_UPDATE = 'profile_update',
  ACCOUNT_DELETE = 'account_delete',
  
  // Fuel delivery specific events
  ORDER_CREATE = 'order_create',
  ORDER_UPDATE = 'order_update',
  ORDER_CANCEL = 'order_cancel',
  ORDER_COMPLETE = 'order_complete',
  VEHICLE_ADD = 'vehicle_add',
  VEHICLE_UPDATE = 'vehicle_update',
  VEHICLE_REMOVE = 'vehicle_remove',
  LOCATION_ADD = 'location_add',
  LOCATION_UPDATE = 'location_update',
  LOCATION_REMOVE = 'location_remove',
  LOCATION_SELECT = 'location_select',
  FUEL_TYPE_SELECT = 'fuel_type_select',
  DELIVERY_TIME_SELECT = 'delivery_time_select',
  PAYMENT_METHOD_ADD = 'payment_method_add',
  PAYMENT_METHOD_UPDATE = 'payment_method_update',
  PAYMENT_METHOD_REMOVE = 'payment_method_remove',
  PAYMENT_METHOD_SELECT = 'payment_method_select',
  
  // Error events
  ERROR = 'error',
  VALIDATION_ERROR = 'validation_error',
  
  // Custom events
  CUSTOM = 'custom',
}

/**
 * Performance measurement categories
 */
export enum PerformanceCategory {
  // Loading and rendering times
  TIME_TO_INTERACTIVE = 'time_to_interactive',
  FIRST_CONTENTFUL_PAINT = 'first_contentful_paint',
  FIRST_PAINT = 'first_paint',
  LARGEST_CONTENTFUL_PAINT = 'largest_contentful_paint',
  
  // Interactivity
  INPUT_DELAY = 'input_delay',
  INTERACTION_TIME = 'interaction_time',
  
  // Layout stability
  LAYOUT_SHIFT = 'layout_shift',
  
  // Resources
  RESOURCE_SIZE = 'resource_size',
  RESOURCE_LOAD_TIME = 'resource_load_time',
  
  // JavaScript execution
  LONG_TASKS = 'long_tasks',
  JS_HEAP_SIZE = 'js_heap_size',
  
  // Network
  API_RESPONSE_TIME = 'api_response_time',
  
  // App-specific
  MAP_LOAD_TIME = 'map_load_time',
  ORDER_COMPLETION_TIME = 'order_completion_time',
  PAYMENT_PROCESSING_TIME = 'payment_processing_time',
  
  // Custom
  CUSTOM = 'custom',
}

/**
 * Event data interface
 */
export interface AnalyticsEvent {
  /**
   * Category of the event
   */
  category: EventCategory;
  
  /**
   * Action performed
   */
  action: string;
  
  /**
   * Optional label for the event
   */
  label?: string;
  
  /**
   * Optional numeric value
   */
  value?: number;
  
  /**
   * Additional data
   */
  data?: Record<string, any>;
}

/**
 * Performance metric interface
 */
export interface PerformanceMetric {
  /**
   * Category of the performance metric
   */
  category: PerformanceCategory;
  
  /**
   * Name of the metric
   */
  name: string;
  
  /**
   * Value of the metric
   */
  value: number;
  
  /**
   * Unit of measurement (ms, bytes, count, etc.)
   */
  unit: 'ms' | 'bytes' | 'count' | 'percentage' | string;
  
  /**
   * Additional context for the metric
   */
  context?: Record<string, any>;
}

/**
 * User identification data
 */
export interface UserIdentification {
  /**
   * User ID
   */
  userId?: string | number;
  
  /**
   * Anonymous ID for tracking before login
   */
  anonymousId?: string;
  
  /**
   * User attributes
   */
  traits?: {
    email?: string;
    name?: string;
    username?: string;
    role?: string;
    [key: string]: any;
  };
}

/**
 * Analytics provider interface
 */
export interface IAnalytics {
  /**
   * Initialize the analytics provider
   * @param options Initialization options
   */
  initialize(options?: Record<string, any>): void;
  
  /**
   * Identify a user
   * @param user User identification data
   */
  identify(user: UserIdentification): void;
  
  /**
   * Track an event
   * @param event Event data
   */
  trackEvent(event: AnalyticsEvent): void;
  
  /**
   * Track a page or screen view
   * @param name Page or screen name
   * @param properties Additional properties
   */
  trackPage(name: string, properties?: Record<string, any>): void;
  
  /**
   * Track a performance metric
   * @param metric Performance metric data
   */
  trackPerformance(metric: PerformanceMetric): void;
  
  /**
   * Reset user identification (e.g., on logout)
   */
  reset(): void;
  
  /**
   * Flush any queued events
   */
  flush(): void;
}

/**
 * No-op analytics provider
 */
class NoOpAnalytics implements IAnalytics {
  initialize(): void {}
  identify(): void {}
  trackEvent(): void {}
  trackPage(): void {}
  trackPerformance(): void {}
  reset(): void {}
  flush(): void {}
}

// Default analytics instance
let analyticsInstance: IAnalytics = new NoOpAnalytics();

/**
 * Set the analytics provider
 * @param provider Analytics provider
 */
export function setAnalyticsProvider(provider: IAnalytics): void {
  analyticsInstance = provider;
}

/**
 * Get the current analytics provider
 * @returns Analytics provider
 */
export function getAnalytics(): IAnalytics {
  return analyticsInstance;
}