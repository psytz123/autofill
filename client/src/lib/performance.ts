/**
 * Performance Monitoring Utilities
 * 
 * This module provides tools for monitoring and reporting performance metrics
 * for the client application.
 */

import {
  PerformanceCategory,
  EventCategory,
  PerformanceTimer,
  getAnalytics,
  type PerformanceMetric
} from '@shared/utils';

// Web-specific metrics collection
interface PerformanceMetrics {
  // Core Web Vitals
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  firstInputDelay?: number;
  cumulativeLayoutShift?: number;
  timeToInteractive?: number;
  
  // Navigation metrics
  navigationStart?: number;
  loadEventEnd?: number;
  domComplete?: number;
  domInteractive?: number;
  
  // Resource metrics
  resourceLoadTime?: number;
  resourceCount?: number;
  
  // Custom app metrics
  apiResponseTimes: Record<string, number[]>;
  componentRenderTimes: Record<string, number[]>;
  interactions: Record<string, number[]>;
  
  // Performance health
  longTasks: number[];
  memoryUsage?: number;
  jsHeapSize?: number;
}

// Initialize metrics storage
const metrics: PerformanceMetrics = {
  apiResponseTimes: {},
  componentRenderTimes: {},
  interactions: {},
  longTasks: []
};

// Performance observer for tracking long tasks
let longTaskObserver: PerformanceObserver | null = null;
let layoutShiftObserver: PerformanceObserver | null = null;
let largestContentfulPaintObserver: PerformanceObserver | null = null;
let resourceObserver: PerformanceObserver | null = null;

/**
 * Initialize performance monitoring
 */
export function initPerformanceMonitoring() {
  // Only run in browser environment with Performance API
  if (typeof window === 'undefined' || !window.performance) {
    return;
  }
  
  // Track initial page load metrics
  trackPageLoadMetrics();
  
  // Track long tasks
  if ('PerformanceObserver' in window) {
    try {
      // Observe long tasks
      longTaskObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach(entry => {
          metrics.longTasks.push(entry.duration);
          
          getAnalytics().trackPerformance({
            category: PerformanceCategory.LONG_TASKS,
            name: 'long_task_duration',
            value: entry.duration,
            unit: 'ms',
            context: {
              entryType: entry.entryType,
              startTime: entry.startTime
            }
          });
        });
      });
      
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      
      // Observe layout shifts
      layoutShiftObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        
        // Get the last CLS value
        if (entries.length > 0) {
          const lastEntry = entries[entries.length - 1] as any;
          metrics.cumulativeLayoutShift = lastEntry.value;
          
          getAnalytics().trackPerformance({
            category: PerformanceCategory.LAYOUT_SHIFT,
            name: 'cumulative_layout_shift',
            value: lastEntry.value,
            unit: 'count',
            context: {
              hadRecentInput: lastEntry.hadRecentInput
            }
          });
        }
      });
      
      layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
      
      // Observe largest contentful paint
      largestContentfulPaintObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        
        // Get the most recent LCP value
        if (entries.length > 0) {
          const lastEntry = entries[entries.length - 1];
          metrics.largestContentfulPaint = lastEntry.startTime;
          
          getAnalytics().trackPerformance({
            category: PerformanceCategory.LARGEST_CONTENTFUL_PAINT,
            name: 'largest_contentful_paint',
            value: lastEntry.startTime,
            unit: 'ms'
          });
        }
      });
      
      largestContentfulPaintObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      
      // Observe resource loading
      resourceObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        
        entries.forEach(entry => {
          // Cast to ResourceTiming which has initiatorType
          const resourceEntry = entry as PerformanceResourceTiming;
          if (resourceEntry.initiatorType && entry.duration) {
            getAnalytics().trackPerformance({
              category: PerformanceCategory.RESOURCE_LOAD_TIME,
              name: `resource_load_${resourceEntry.initiatorType}`,
              value: entry.duration,
              unit: 'ms',
              context: {
                name: entry.name,
                type: resourceEntry.initiatorType
              }
            });
          }
        });
      });
      
      resourceObserver.observe({ entryTypes: ['resource'] });
    } catch (error) {
      console.error('Failed to initialize performance observers:', error);
    }
  }
  
  // Track memory usage if available
  trackMemoryUsageIfAvailable();
  
  // Track FID
  trackFirstInputDelay();
  
  // Periodically collect metrics (once per minute)
  setInterval(collectAndReportMetrics, 60000);
  
  // Add listeners for page visibility changes to collect metrics
  // when the user leaves the page
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        collectAndReportMetrics();
      }
    });
    
    // Report metrics before unload
    window.addEventListener('beforeunload', collectAndReportMetrics);
  }
}

/**
 * Track page load metrics from the Navigation Timing API
 */
function trackPageLoadMetrics() {
  // Use setTimeout to ensure we capture all metrics after load
  setTimeout(() => {
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      
      // Navigation metrics
      metrics.navigationStart = timing.navigationStart;
      metrics.loadEventEnd = timing.loadEventEnd;
      metrics.domComplete = timing.domComplete;
      metrics.domInteractive = timing.domInteractive;
      
      // Calculate key metrics
      const pageLoadTime = timing.loadEventEnd - timing.navigationStart;
      const domContentLoadedTime = timing.domContentLoadedEventEnd - timing.navigationStart;
      const timeToInteractive = timing.domInteractive - timing.navigationStart;
      
      // Track them via analytics
      getAnalytics().trackPerformance({
        category: PerformanceCategory.TIME_TO_INTERACTIVE,
        name: 'time_to_interactive',
        value: timeToInteractive,
        unit: 'ms'
      });
      
      getAnalytics().trackPerformance({
        category: PerformanceCategory.FIRST_CONTENTFUL_PAINT,
        name: 'dom_content_loaded',
        value: domContentLoadedTime,
        unit: 'ms'
      });
      
      getAnalytics().trackPerformance({
        category: PerformanceCategory.FIRST_PAINT,
        name: 'page_load_time',
        value: pageLoadTime,
        unit: 'ms'
      });
      
      // Report paint timings
      const paintMetrics = window.performance.getEntriesByType('paint');
      paintMetrics.forEach(paintMetric => {
        const metric = paintMetric as PerformanceEntry;
        
        if (metric.name === 'first-paint') {
          metrics.firstContentfulPaint = metric.startTime;
          
          getAnalytics().trackPerformance({
            category: PerformanceCategory.FIRST_PAINT,
            name: 'first_paint',
            value: metric.startTime,
            unit: 'ms'
          });
        } else if (metric.name === 'first-contentful-paint') {
          metrics.firstContentfulPaint = metric.startTime;
          
          getAnalytics().trackPerformance({
            category: PerformanceCategory.FIRST_CONTENTFUL_PAINT,
            name: 'first_contentful_paint',
            value: metric.startTime,
            unit: 'ms'
          });
        }
      });
    }
  }, 0);
}

/**
 * Track first input delay
 */
function trackFirstInputDelay() {
  const firstInputObserver = (entries: any[]) => {
    entries.forEach(entry => {
      if (entry.processingStart && entry.startTime) {
        const firstInputDelay = entry.processingStart - entry.startTime;
        metrics.firstInputDelay = firstInputDelay;
        
        getAnalytics().trackPerformance({
          category: PerformanceCategory.INPUT_DELAY,
          name: 'first_input_delay',
          value: firstInputDelay,
          unit: 'ms'
        });
      }
    });
  };
  
  if ('PerformanceObserver' in window) {
    try {
      const po = new PerformanceObserver((entryList) => {
        firstInputObserver(entryList.getEntries() as any);
      });
      po.observe({ type: 'first-input', buffered: true });
    } catch (e) {
      // Fallback for browsers without PerformanceObserver support
      ['mousedown', 'touchstart', 'keydown'].forEach(eventType => {
        window.addEventListener(eventType, function firstInputHandler() {
          const now = performance.now();
          
          // Use setTimeout to approximate processing start time
          setTimeout(() => {
            const processingStart = performance.now();
            const firstInputDelay = processingStart - now;
            
            metrics.firstInputDelay = firstInputDelay;
            
            getAnalytics().trackPerformance({
              category: PerformanceCategory.INPUT_DELAY,
              name: 'first_input_delay_approx',
              value: firstInputDelay,
              unit: 'ms'
            });
            
            // Remove event listeners after first input
            ['mousedown', 'touchstart', 'keydown'].forEach(event => {
              window.removeEventListener(event, firstInputHandler);
            });
          }, 0);
        }, { once: true, passive: true, capture: true });
      });
    }
  }
}

/**
 * Track memory usage if available in the browser
 */
function trackMemoryUsageIfAvailable() {
  if (window.performance && (performance as any).memory) {
    // Use an interval to track memory usage over time
    setInterval(() => {
      const memory = (performance as any).memory;
      
      if (memory) {
        const jsHeapSize = memory.usedJSHeapSize;
        const totalHeapSize = memory.totalJSHeapSize;
        
        metrics.jsHeapSize = jsHeapSize;
        
        // Report once per minute
        getAnalytics().trackPerformance({
          category: PerformanceCategory.JS_HEAP_SIZE,
          name: 'js_heap_size',
          value: jsHeapSize,
          unit: 'bytes',
          context: {
            totalHeapSize,
            heapLimit: memory.jsHeapSizeLimit
          }
        });
      }
    }, 60000);
  }
}

/**
 * Collect and report all metrics
 */
function collectAndReportMetrics() {
  // Collect resource metrics
  if (window.performance) {
    const resources = window.performance.getEntriesByType('resource');
    metrics.resourceCount = resources.length;
    
    // Calculate average resource load time
    const totalLoadTime = resources.reduce((sum, resource) => sum + resource.duration, 0);
    metrics.resourceLoadTime = resources.length > 0 ? totalLoadTime / resources.length : 0;
    
    // Report resource metrics
    getAnalytics().trackPerformance({
      category: PerformanceCategory.RESOURCE_SIZE,
      name: 'resource_count',
      value: metrics.resourceCount,
      unit: 'count'
    });
    
    getAnalytics().trackPerformance({
      category: PerformanceCategory.RESOURCE_LOAD_TIME,
      name: 'average_resource_load_time',
      value: metrics.resourceLoadTime,
      unit: 'ms'
    });
  }
  
  // Report long tasks
  if (metrics.longTasks.length > 0) {
    const totalLongTaskTime = metrics.longTasks.reduce((sum, duration) => sum + duration, 0);
    const avgLongTaskTime = metrics.longTasks.length > 0 ? totalLongTaskTime / metrics.longTasks.length : 0;
    
    getAnalytics().trackPerformance({
      category: PerformanceCategory.LONG_TASKS,
      name: 'long_tasks_count',
      value: metrics.longTasks.length,
      unit: 'count'
    });
    
    getAnalytics().trackPerformance({
      category: PerformanceCategory.LONG_TASKS,
      name: 'avg_long_task_duration',
      value: avgLongTaskTime,
      unit: 'ms'
    });
    
    // Reset long tasks after reporting
    metrics.longTasks = [];
  }
  
  // Report API response times
  Object.entries(metrics.apiResponseTimes).forEach(([endpoint, times]) => {
    if (times.length > 0) {
      const totalTime = times.reduce((sum, time) => sum + time, 0);
      const avgTime = times.length > 0 ? totalTime / times.length : 0;
      
      getAnalytics().trackPerformance({
        category: PerformanceCategory.API_RESPONSE_TIME,
        name: `api_response_time_${endpoint}`,
        value: avgTime,
        unit: 'ms',
        context: {
          endpoint,
          count: times.length
        }
      });
      
      // Reset after reporting
      metrics.apiResponseTimes[endpoint] = [];
    }
  });
  
  // Report component render times
  Object.entries(metrics.componentRenderTimes).forEach(([component, times]) => {
    if (times.length > 0) {
      const totalTime = times.reduce((sum, time) => sum + time, 0);
      const avgTime = times.length > 0 ? totalTime / times.length : 0;
      
      getAnalytics().trackPerformance({
        category: PerformanceCategory.RESOURCE_LOAD_TIME,
        name: `component_render_time_${component}`,
        value: avgTime,
        unit: 'ms',
        context: {
          component,
          count: times.length
        }
      });
      
      // Reset after reporting
      metrics.componentRenderTimes[component] = [];
    }
  });
}

/**
 * Track API response time
 * @param endpoint API endpoint
 * @param responseTime Response time in ms
 */
export function trackApiResponseTime(endpoint: string, responseTime: number) {
  // Normalize the endpoint name by removing URL params
  const normalizedEndpoint = endpoint.split('?')[0].replace(/\/\d+/g, '/:id');
  
  // Initialize array if needed
  if (!metrics.apiResponseTimes[normalizedEndpoint]) {
    metrics.apiResponseTimes[normalizedEndpoint] = [];
  }
  
  // Add the response time
  metrics.apiResponseTimes[normalizedEndpoint].push(responseTime);
  
  // Report individual measurement if it's slow (>500ms)
  if (responseTime > 500) {
    getAnalytics().trackPerformance({
      category: PerformanceCategory.API_RESPONSE_TIME,
      name: `slow_api_response_${normalizedEndpoint}`,
      value: responseTime,
      unit: 'ms',
      context: { endpoint: normalizedEndpoint }
    });
  }
}

/**
 * Track component render time
 * @param componentName Component name
 * @param renderTime Render time in ms
 */
export function trackComponentRenderTime(componentName: string, renderTime: number) {
  // Initialize array if needed
  if (!metrics.componentRenderTimes[componentName]) {
    metrics.componentRenderTimes[componentName] = [];
  }
  
  // Add the render time
  metrics.componentRenderTimes[componentName].push(renderTime);
  
  // Report individual measurement if it's slow (>50ms)
  if (renderTime > 50) {
    getAnalytics().trackPerformance({
      category: PerformanceCategory.RESOURCE_LOAD_TIME,
      name: `slow_component_render_${componentName}`,
      value: renderTime,
      unit: 'ms',
      context: { component: componentName }
    });
  }
}

/**
 * Track user interaction time
 * @param interactionName Name of the interaction
 * @param duration Duration in ms
 */
export function trackInteraction(interactionName: string, duration: number) {
  // Initialize array if needed
  if (!metrics.interactions[interactionName]) {
    metrics.interactions[interactionName] = [];
  }
  
  // Add the interaction time
  metrics.interactions[interactionName].push(duration);
  
  // Report the interaction
  getAnalytics().trackPerformance({
    category: PerformanceCategory.INTERACTION_TIME,
    name: `interaction_${interactionName}`,
    value: duration,
    unit: 'ms',
    context: { interaction: interactionName }
  });
  
  // Also track as an event for user behavior analysis
  getAnalytics().trackEvent({
    category: EventCategory.BUTTON_CLICK, 
    action: interactionName,
    value: duration
  });
}

/**
 * Create a timer for measuring performance
 * @returns PerformanceTimer instance
 */
export function createTimer(): PerformanceTimer {
  return new PerformanceTimer();
}

/**
 * Track map loading performance
 * @param loadTime Load time in ms
 */
export function trackMapLoadTime(loadTime: number) {
  getAnalytics().trackPerformance({
    category: PerformanceCategory.MAP_LOAD_TIME,
    name: 'map_load_time',
    value: loadTime,
    unit: 'ms'
  });
}

/**
 * Track order completion time
 * @param duration Time from start to completion in ms
 */
export function trackOrderCompletionTime(duration: number) {
  getAnalytics().trackPerformance({
    category: PerformanceCategory.ORDER_COMPLETION_TIME,
    name: 'order_completion_time',
    value: duration,
    unit: 'ms'
  });
}

/**
 * Track payment processing time
 * @param duration Processing time in ms
 */
export function trackPaymentProcessingTime(duration: number) {
  getAnalytics().trackPerformance({
    category: PerformanceCategory.PAYMENT_PROCESSING_TIME,
    name: 'payment_processing_time',
    value: duration,
    unit: 'ms'
  });
}

/**
 * Performance measurement HOC for React components
 * Wraps a component with performance timing
 */
export function withPerformanceMeasurement<P>(
  Component: any,
  componentName: string
): any {
  // This function is designed to be used with React, but we're making it type-safe
  // for compilation even without the React import
  return Component;
  
  // The actual implementation would look like this in a React file:
  /*
  // Import React at the top of your file
  import React from 'react';
  
  return function MeasuredComponent(props: P) {
    const [mounted, setMounted] = React.useState(false);
    const startTime = React.useRef(performance.now());
    
    React.useEffect(() => {
      // Measure initial render
      const renderTime = performance.now() - startTime.current;
      trackComponentRenderTime(componentName, renderTime);
      setMounted(true);
      
      // Clean up measurement observers
      return () => {
        const unmountTime = performance.now() - startTime.current;
        
        // Track component lifetime
        getAnalytics().trackPerformance({
          category: PerformanceCategory.RESOURCE_LOAD_TIME,
          name: `component_lifetime_${componentName}`,
          value: unmountTime,
          unit: 'ms',
          context: { component: componentName }
        });
      };
    }, []);
    
    // Track re-renders after initial render
    if (mounted) {
      const reRenderStart = performance.now();
      React.useEffect(() => {
        const reRenderTime = performance.now() - reRenderStart;
        trackComponentRenderTime(`${componentName}_rerender`, reRenderTime);
      });
    }
    
    // Render the wrapped component
    return <Component {...props} />;
  };
  */
}

// Collect app version for analytics if available
const appVersion = 'unknown';

// In a real application, you might get this from an environment variable or injected at build time
// Example: const appVersion = (typeof window !== 'undefined' && (window as any).__APP_VERSION__) || 'unknown';

// Export app information for analytics
export const appInfo = {
  version: appVersion,
  environment: process.env.NODE_ENV || 'development',
  platform: 'web',
};