/**
 * Performance Monitoring Utilities for Client Application
 */

import { PerformanceCategory, PerformanceTimer } from '@shared/utils/analytics';

// Performance monitoring options
interface PerformanceMonitorOptions {
  debug?: boolean;
  sampleRate?: number;
  reportUrl?: string;
}

// Singleton performance monitor instance
let performanceMonitor: PerformanceMonitor | null = null;

/**
 * Web Vitals metrics with additional context
 */
interface WebVitalsMetric {
  name: string;
  value: number;
  category: PerformanceCategory;
  navigationType?: string;
  rating?: 'good' | 'needs-improvement' | 'poor';
}

/**
 * Component rendering performance
 */
interface ComponentRenderMetric {
  componentName: string;
  renderTime: number;
  isInitialRender: boolean;
}

/**
 * Performance monitoring manager for the application
 */
export class PerformanceMonitor {
  private options: PerformanceMonitorOptions;
  private metrics: Record<string, any>[] = [];
  private timers: Map<string, PerformanceTimer> = new Map();

  /**
   * Initialize the performance monitor
   */
  constructor(options: PerformanceMonitorOptions = {}) {
    this.options = {
      debug: false,
      sampleRate: 1.0, // 100% by default
      ...options,
    };

    // Initialize browser performance monitoring if available
    if (typeof window !== 'undefined' && 'performance' in window) {
      this.initializeBrowserMonitoring();
    }
  }

  /**
   * Set up browser performance monitoring
   */
  private initializeBrowserMonitoring() {
    try {
      // Use Performance Observer API if available
      if ('PerformanceObserver' in window) {
        // Monitor paint metrics (FP, FCP)
        const paintObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            this.trackWebVital({
              name: entry.name,
              value: entry.startTime,
              category: entry.name === 'first-paint' 
                ? PerformanceCategory.FIRST_PAINT 
                : PerformanceCategory.FIRST_CONTENTFUL_PAINT,
            });
          }
        });
        paintObserver.observe({ type: 'paint', buffered: true });

        // Monitor long tasks
        const longTaskObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (this.options.debug) {
              console.debug(`Long task detected: ${entry.duration}ms`);
            }
            this.recordMetric('long_task', {
              duration: entry.duration,
              timestamp: entry.startTime,
            });
          }
        });
        longTaskObserver.observe({ type: 'longtask', buffered: true });

        // Monitor resource timing
        const resourceObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            // Only track resources that took more than 500ms
            if (entry.duration > 500) {
              this.recordMetric('slow_resource', {
                name: entry.name,
                duration: entry.duration,
                initiatorType: entry.initiatorType,
                size: (entry as any).transferSize || 0,
              });
            }
          }
        });
        resourceObserver.observe({ type: 'resource', buffered: true });
      }

      // Track navigation timing metrics
      window.addEventListener('load', () => {
        setTimeout(() => {
          this.trackNavigationTiming();
        }, 0);
      });
    } catch (error) {
      console.error('Failed to initialize performance monitoring:', error);
    }
  }

  /**
   * Track standard navigation timing metrics
   */
  private trackNavigationTiming() {
    if (!window.performance || !window.performance.timing) return;

    const timing = window.performance.timing;
    const navigationStart = timing.navigationStart;

    // Calculate key metrics
    const metrics = {
      dns: timing.domainLookupEnd - timing.domainLookupStart,
      tcp: timing.connectEnd - timing.connectStart,
      request: timing.responseStart - timing.requestStart,
      response: timing.responseEnd - timing.responseStart,
      dom: timing.domComplete - timing.domLoading,
      load: timing.loadEventEnd - timing.loadEventStart,
      total: timing.loadEventEnd - navigationStart,
    };

    this.recordMetric('navigation_timing', metrics);
  }

  /**
   * Track web vitals metric
   */
  private trackWebVital(metric: WebVitalsMetric) {
    this.recordMetric('web_vital', {
      name: metric.name,
      value: metric.value,
      category: metric.category,
      rating: metric.rating,
      navigationType: metric.navigationType,
    });

    if (this.options.debug) {
      console.debug(`Web Vital: ${metric.name} - ${metric.value}ms`);
    }
  }

  /**
   * Record a metric to be sent to analytics
   */
  private recordMetric(metricType: string, data: Record<string, any>) {
    // Apply sampling to reduce data volume if needed
    if (Math.random() > this.options.sampleRate!) {
      return;
    }

    const metric = {
      type: metricType,
      timestamp: Date.now(),
      ...data,
    };

    this.metrics.push(metric);

    // Send metrics in batches
    if (this.metrics.length >= 10) {
      this.flushMetrics();
    }
  }

  /**
   * Start a performance timer
   */
  startTimer(name: string): void {
    const timer = new PerformanceTimer();
    this.timers.set(name, timer);
  }

  /**
   * End a performance timer and record the metric
   */
  endTimer(name: string, category: PerformanceCategory = PerformanceCategory.INTERACTION_TIME): number {
    const timer = this.timers.get(name);
    if (!timer) return 0;

    const duration = timer.getElapsedTime();
    this.timers.delete(name);

    this.recordMetric('timer', {
      name,
      duration,
      category,
    });

    return duration;
  }

  /**
   * Track component render time
   */
  trackComponentRender(metric: ComponentRenderMetric): void {
    this.recordMetric('component_render', metric);

    if (this.options.debug && metric.renderTime > 16) {
      // Log slow renders (taking more than 16ms / 1 frame)
      console.debug(
        `Slow render: ${metric.componentName} took ${metric.renderTime.toFixed(2)}ms`,
        metric.isInitialRender ? '(initial render)' : '(re-render)'
      );
    }
  }

  /**
   * Track API request performance
   */
  trackApiRequest(
    endpoint: string,
    method: string,
    duration: number,
    status: number,
    success: boolean
  ): void {
    this.recordMetric('api_request', {
      endpoint,
      method,
      duration,
      status,
      success,
    });
  }

  /**
   * Send metrics to analytics backend
   */
  private async flushMetrics() {
    if (!this.metrics.length) return;

    const metricsToSend = [...this.metrics];
    this.metrics = [];

    if (this.options.reportUrl) {
      try {
        await fetch(this.options.reportUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            metrics: metricsToSend,
            app: 'autofill-client',
            version: window.__APP_VERSION__ || 'unknown',
            url: window.location.href,
            userAgent: navigator.userAgent,
          }),
          // Use keepalive to ensure the request completes even if the page unloads
          keepalive: true,
        });
      } catch (error) {
        console.error('Failed to send performance metrics:', error);
        // Re-add failed metrics to be sent next time
        this.metrics = [...metricsToSend, ...this.metrics];
      }
    } else if (this.options.debug) {
      console.debug('Performance metrics:', metricsToSend);
    }
  }
}

/**
 * Get the singleton performance monitor instance
 */
export function getPerformanceMonitor(options?: PerformanceMonitorOptions): PerformanceMonitor {
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor(options);
  }
  return performanceMonitor;
}

/**
 * Reset the performance monitor (useful for testing)
 */
export function resetPerformanceMonitor(): void {
  performanceMonitor = null;
}

/**
 * Performance monitoring React Hook
 */
export function usePerformanceMonitoring(options?: PerformanceMonitorOptions) {
  return getPerformanceMonitor(options);
}

// Higher order component to track component performance
export function withPerformanceTracking<P>(
  Component: React.ComponentType<P>,
  componentName: string
): React.FC<P> {
  const displayName = componentName || Component.displayName || Component.name || 'Component';
  
  const WrappedComponent: React.FC<P> = (props) => {
    const startTime = performance.now();
    const result = <Component {...props} />;
    
    // We use requestAnimationFrame to measure after the component has rendered
    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => {
        const endTime = performance.now();
        const renderTime = endTime - startTime;
        
        getPerformanceMonitor().trackComponentRender({
          componentName: displayName,
          renderTime,
          isInitialRender: true, // This is approximate as we can't reliably detect initial vs re-render
        });
      });
    }
    
    return result;
  };
  
  WrappedComponent.displayName = `WithPerformanceTracking(${displayName})`;
  return WrappedComponent;
}