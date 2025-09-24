import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

const sendToAnalytics = (metric) => {
  // Send to your analytics service
  console.log('Web Vitals:', metric);
  
  // Example: Send to Google Analytics
  if (window.gtag) {
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      non_interaction: true,
    });
  }
  
  // You can also send to other analytics services here
  // Example: Send to your own analytics endpoint
  if (process.env.NODE_ENV === 'production') {
    fetch('/api/analytics/web-vitals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: metric.name,
        value: metric.value,
        id: metric.id,
        delta: metric.delta,
        rating: metric.rating,
        navigationType: metric.navigationType,
        url: window.location.href,
        timestamp: Date.now(),
      }),
    }).catch(err => {
      console.warn('Failed to send Web Vitals to analytics:', err);
    });
  }
};

export const initWebVitals = () => {
  // Core Web Vitals
  getCLS(sendToAnalytics);  // Cumulative Layout Shift
  getFID(sendToAnalytics);  // First Input Delay
  getLCP(sendToAnalytics);  // Largest Contentful Paint
  
  // Other important metrics
  getFCP(sendToAnalytics);  // First Contentful Paint
  getTTFB(sendToAnalytics); // Time to First Byte
};

// Helper function to track custom performance metrics
export const trackCustomMetric = (name, value, additionalData = {}) => {
  const metric = {
    name,
    value,
    id: `${name}-${Date.now()}`,
    delta: value,
    rating: value > 2500 ? 'poor' : value > 1000 ? 'needs-improvement' : 'good',
    navigationType: 'navigate',
    ...additionalData
  };
  
  sendToAnalytics(metric);
};

// Performance observer for additional insights
export const initPerformanceObserver = () => {
  if ('PerformanceObserver' in window) {
    // Monitor Long Tasks (tasks > 50ms)
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          trackCustomMetric('long-task', entry.duration, {
            startTime: entry.startTime,
            name: entry.name,
          });
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      console.warn('Long Task Observer not supported');
    }

    // Monitor Layout Shifts
    try {
      const layoutShiftObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            trackCustomMetric('layout-shift', entry.value, {
              sources: entry.sources?.map(s => s.node?.tagName).join(','),
            });
          }
        }
      });
      layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      console.warn('Layout Shift Observer not supported');
    }
  }
};
