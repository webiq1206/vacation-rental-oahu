import { useEffect, useState, useCallback } from 'react';

// Core Web Vitals monitoring
interface WebVitals {
  CLS: number;
  FID: number;
  FCP: number;
  LCP: number;
  TTFB: number;
}

interface PerformanceMetrics {
  pageLoadTime: number;
  domContentLoadedTime: number;
  timeToFirstByte: number;
  resourceLoadTimes: Record<string, number>;
  memoryUsage?: any;
  webVitals: Partial<WebVitals>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private observer?: PerformanceObserver;
  private vitalsObserver?: PerformanceObserver;
  
  constructor() {
    this.metrics = {
      pageLoadTime: 0,
      domContentLoadedTime: 0,
      timeToFirstByte: 0,
      resourceLoadTimes: {},
      webVitals: {},
    };
    this.initializeMonitoring();
  }

  private initializeMonitoring() {
    if (typeof window === 'undefined') return;

    // Basic navigation timing
    window.addEventListener('load', () => {
      this.collectNavigationTiming();
      this.collectResourceTiming();
      this.collectMemoryUsage();
    });

    // Core Web Vitals monitoring
    this.setupWebVitalsMonitoring();
    
    // Continuous performance monitoring
    this.setupContinuousMonitoring();
  }

  private collectNavigationTiming() {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!navigation) return;

    this.metrics.pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
    this.metrics.domContentLoadedTime = navigation.domContentLoadedEventEnd - navigation.fetchStart;
    this.metrics.timeToFirstByte = navigation.responseStart - navigation.requestStart;
  }

  private collectResourceTiming() {
    const resources = performance.getEntriesByType('resource');
    resources.forEach((resource) => {
      const entry = resource as PerformanceResourceTiming;
      this.metrics.resourceLoadTimes[entry.name] = entry.responseEnd - entry.fetchStart;
    });
  }

  private collectMemoryUsage() {
    if ('memory' in performance) {
      this.metrics.memoryUsage = (performance as any).memory;
    }
  }

  private setupWebVitalsMonitoring() {
    // Largest Contentful Paint (LCP)
    this.observePerformanceEntry('largest-contentful-paint', (entries) => {
      const lcpEntry = entries[entries.length - 1] as any;
      this.metrics.webVitals.LCP = lcpEntry.renderTime || lcpEntry.loadTime;
    });

    // First Input Delay (FID)
    this.observePerformanceEntry('first-input', (entries) => {
      const fidEntry = entries[0] as any;
      this.metrics.webVitals.FID = fidEntry.processingStart - fidEntry.startTime;
    });

    // Cumulative Layout Shift (CLS)
    this.observePerformanceEntry('layout-shift', (entries) => {
      let cls = 0;
      entries.forEach((entry) => {
        if (!(entry as any).hadRecentInput) {
          cls += (entry as any).value;
        }
      });
      this.metrics.webVitals.CLS = cls;
    });

    // First Contentful Paint (FCP)
    this.observePerformanceEntry('paint', (entries) => {
      const fcpEntry = entries.find((entry) => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        this.metrics.webVitals.FCP = fcpEntry.startTime;
      }
    });
  }

  private observePerformanceEntry(entryType: string, callback: (entries: PerformanceEntry[]) => void) {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      observer.observe({ type: entryType, buffered: true });
    } catch (e) {
      console.warn(`Could not observe ${entryType}:`, e);
    }
  }

  private setupContinuousMonitoring() {
    // Monitor long tasks (> 50ms)
    this.observePerformanceEntry('longtask', (entries) => {
      entries.forEach((entry) => {
        console.warn('Long task detected:', {
          duration: entry.duration,
          startTime: entry.startTime,
        });
      });
    });

    // Monitor navigation timing for SPAs
    this.observePerformanceEntry('navigation', (entries) => {
      this.collectNavigationTiming();
    });
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public startTiming(label: string) {
    performance.mark(`${label}-start`);
  }

  public endTiming(label: string): number {
    performance.mark(`${label}-end`);
    const measure = performance.measure(label, `${label}-start`, `${label}-end`);
    return measure.duration;
  }

  public logWebVitals() {
    console.log('Core Web Vitals:', this.metrics.webVitals);
    
    // Send to analytics service (implement as needed)
    this.sendAnalytics(this.metrics);
  }

  private sendAnalytics(metrics: PerformanceMetrics) {
    // Implement analytics reporting here
    // For now, just log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Performance Metrics:', metrics);
    }
  }

  public checkThresholds() {
    const vitals = this.metrics.webVitals;
    const issues: string[] = [];

    // Check Core Web Vitals thresholds
    if (vitals.LCP && vitals.LCP > 2500) {
      issues.push(`LCP too high: ${vitals.LCP}ms (should be < 2500ms)`);
    }
    if (vitals.FID && vitals.FID > 100) {
      issues.push(`FID too high: ${vitals.FID}ms (should be < 100ms)`);
    }
    if (vitals.CLS && vitals.CLS > 0.1) {
      issues.push(`CLS too high: ${vitals.CLS} (should be < 0.1)`);
    }

    if (issues.length > 0) {
      console.warn('Performance issues detected:', issues);
    }

    return issues;
  }
}

// Global instance
const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export function usePerformanceMonitoring() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined' || !('performance' in window)) {
      setIsSupported(false);
      return;
    }

    const updateMetrics = () => {
      setMetrics(performanceMonitor.getMetrics());
    };

    // Update metrics periodically
    const interval = setInterval(updateMetrics, 5000);
    
    // Initial update
    setTimeout(updateMetrics, 1000);

    return () => clearInterval(interval);
  }, []);

  const startTiming = useCallback((label: string) => performanceMonitor.startTiming(label), []);
  const endTiming = useCallback((label: string) => performanceMonitor.endTiming(label), []);
  const checkThresholds = useCallback(() => performanceMonitor.checkThresholds(), []);
  const logWebVitals = useCallback(() => performanceMonitor.logWebVitals(), []);

  return {
    metrics,
    isSupported,
    startTiming,
    endTiming,
    checkThresholds,
    logWebVitals,
  };
}

// Component for displaying performance metrics in development
export function PerformanceDebugPanel() {
  const { metrics, isSupported, checkThresholds } = usePerformanceMonitoring();
  const [issues, setIssues] = useState<string[]>([]);

  useEffect(() => {
    if (metrics) {
      setIssues(checkThresholds());
    }
  }, [metrics, checkThresholds]);

  if (!isSupported || process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: 10,
        right: 10,
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: 12,
        borderRadius: 8,
        fontSize: 12,
        fontFamily: 'monospace',
        maxWidth: 300,
        zIndex: 9999,
      }}
    >
      <h4>Performance Metrics</h4>
      {metrics && (
        <>
          <div>Page Load: {metrics.pageLoadTime.toFixed(0)}ms</div>
          <div>TTFB: {metrics.timeToFirstByte.toFixed(0)}ms</div>
          {metrics.webVitals.LCP && <div>LCP: {metrics.webVitals.LCP.toFixed(0)}ms</div>}
          {metrics.webVitals.FID && <div>FID: {metrics.webVitals.FID.toFixed(0)}ms</div>}
          {metrics.webVitals.CLS && <div>CLS: {metrics.webVitals.CLS.toFixed(3)}</div>}
          {metrics.memoryUsage && (
            <div>Memory: {(metrics.memoryUsage.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB</div>
          )}
          {issues.length > 0 && (
            <div style={{ color: '#ff6b6b', marginTop: 8 }}>
              <strong>Issues:</strong>
              {issues.map((issue, i) => <div key={i}>{issue}</div>)}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default performanceMonitor;