import { useEffect, useCallback } from 'react';
import { queryClient, prefetchCriticalData } from '@/lib/queryClient';
import { useAdaptiveLoading } from '@/lib/network-optimization';
import { useImageLoader } from '@/lib/memory-optimization';

// Strategic preloading manager
export class StrategicPreloader {
  private preloadedRoutes = new Set<string>();
  private preloadingPromises = new Map<string, Promise<void>>();
  private resourceHints = new Map<string, HTMLElement>();

  constructor() {
    this.setupResourceHints();
  }

  private setupResourceHints() {
    // DNS prefetching for external domains
    const externalDomains = [
      'images.unsplash.com',
      'api.stripe.com',
      'fonts.googleapis.com',
      'fonts.gstatic.com'
    ];

    externalDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = `//${domain}`;
      document.head.appendChild(link);
      this.resourceHints.set(`dns-${domain}`, link);
    });

    // Preconnect to critical domains
    const criticalDomains = ['images.unsplash.com'];
    criticalDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = `https://${domain}`;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
      this.resourceHints.set(`preconnect-${domain}`, link);
    });
  }

  // Preload route-based resources
  async preloadRoute(route: string, priority: 'high' | 'medium' | 'low' = 'medium') {
    if (this.preloadedRoutes.has(route)) return;

    const cacheKey = `preload-${route}`;
    if (this.preloadingPromises.has(cacheKey)) {
      return this.preloadingPromises.get(cacheKey);
    }

    const preloadPromise = this.executeRoutePreload(route, priority);
    this.preloadingPromises.set(cacheKey, preloadPromise);

    try {
      await preloadPromise;
      this.preloadedRoutes.add(route);
    } catch (error) {
      console.warn(`Failed to preload route ${route}:`, error);
    } finally {
      this.preloadingPromises.delete(cacheKey);
    }
  }

  private async executeRoutePreload(route: string, priority: 'high' | 'medium' | 'low') {
    const routePreloadMap: Record<string, () => Promise<void>> = {
      '/booking': async () => {
        // Preload booking-related resources
        await Promise.allSettled([
          import('@/pages/booking-page'),
          import('@/pages/checkout-page'),
          queryClient.prefetchQuery({
            queryKey: ['/api/quote'],
            staleTime: 1000 * 60 * 5, // 5 minutes
          }),
        ]);
      },
      '/admin': async () => {
        // Preload admin components
        await Promise.allSettled([
          import('@/pages/admin/admin-dashboard'),
          import('@/pages/admin/admin-bookings'),
          import('@/pages/admin/admin-calendar'),
        ]);
      },
      '/contact': async () => {
        await import('@/pages/contact-page');
      },
      '/policies': async () => {
        await import('@/pages/policies-page');
      },
    };

    const preloadFn = routePreloadMap[route];
    if (preloadFn) {
      await preloadFn();
    }
  }

  // Preload critical images
  async preloadCriticalImages(imageUrls: string[]) {
    const promises = imageUrls.map(async url => {
      try {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = url;
        link.fetchPriority = 'high';
        document.head.appendChild(link);
        this.resourceHints.set(`image-${url}`, link);

        // Also preload through Image API for better caching
        return new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = url;
        });
      } catch (error) {
        console.warn(`Failed to preload image ${url}:`, error);
      }
    });

    await Promise.allSettled(promises);
  }

  // Intelligent prefetching based on user behavior
  prefetchOnUserIntent(element: HTMLElement, route: string, prefetchDelay = 200) {
    let prefetchTimeout: NodeJS.Timeout;
    let hasPrefetched = false;

    const prefetch = () => {
      if (!hasPrefetched) {
        this.preloadRoute(route, 'low');
        hasPrefetched = true;
      }
    };

    const handleMouseEnter = () => {
      prefetchTimeout = setTimeout(prefetch, prefetchDelay);
    };

    const handleMouseLeave = () => {
      if (prefetchTimeout) {
        clearTimeout(prefetchTimeout);
      }
    };

    const handleFocus = prefetch;

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);
    element.addEventListener('focus', handleFocus);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      element.removeEventListener('focus', handleFocus);
      if (prefetchTimeout) {
        clearTimeout(prefetchTimeout);
      }
    };
  }

  // Cleanup resource hints
  cleanup() {
    this.resourceHints.forEach(element => {
      element.remove();
    });
    this.resourceHints.clear();
    this.preloadedRoutes.clear();
    this.preloadingPromises.clear();
  }
}

// Global preloader instance
export const strategicPreloader = new StrategicPreloader();

// React hook for strategic preloading
export function useStrategicPreloader() {
  const { shouldPreload, isFastConnection } = useAdaptiveLoading();
  const { preloadImage } = useImageLoader();

  const preloadRoute = useCallback((route: string, priority: 'high' | 'medium' | 'low' = 'medium') => {
    if (shouldPreload(priority)) {
      strategicPreloader.preloadRoute(route, priority);
    }
  }, [shouldPreload]);

  const preloadImages = useCallback(async (imageUrls: string[]) => {
    if (isFastConnection || imageUrls.length <= 3) {
      await strategicPreloader.preloadCriticalImages(imageUrls);
    }
  }, [isFastConnection]);

  const prefetchOnHover = useCallback((element: HTMLElement, route: string, delay = 200) => {
    return strategicPreloader.prefetchOnUserIntent(element, route, delay);
  }, []);

  // Auto-preload based on current location
  useEffect(() => {
    const currentPath = window.location.pathname;
    
    // Preload likely next routes
    if (currentPath === '/') {
      preloadRoute('/booking', 'medium');
      preloadRoute('/contact', 'low');
    } else if (currentPath === '/booking') {
      preloadRoute('/booking/checkout', 'high');
    } else if (currentPath.includes('/admin')) {
      preloadRoute('/admin/bookings', 'medium');
      preloadRoute('/admin/calendar', 'medium');
    }
  }, [preloadRoute]);

  return {
    preloadRoute,
    preloadImages,
    prefetchOnHover,
  };
}

// Critical resource preloader for app initialization
export function useCriticalResourcePreloader() {
  useEffect(() => {
    const preloadCritical = async () => {
      try {
        // Preload critical data first
        await prefetchCriticalData();
        
        // Preload hero images
        const heroImages = [
          'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800&q=90&fm=webp',
          'https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600&q=85&fm=webp',
        ];
        
        await strategicPreloader.preloadCriticalImages(heroImages);
        
        // Preload booking route for likely navigation
        await strategicPreloader.preloadRoute('/booking', 'medium');
        
      } catch (error) {
        console.warn('Critical resource preloading failed:', error);
      }
    };

    // Slight delay to not block initial render
    const timeoutId = setTimeout(preloadCritical, 100);
    
    return () => clearTimeout(timeoutId);
  }, []);
}

// Intersection-based preloading
export function useViewportPreloader() {
  const { shouldPreload } = useAdaptiveLoading();

  useEffect(() => {
    if (!shouldPreload('low') || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const preloadRoute = element.dataset.preloadRoute;
            const preloadImages = element.dataset.preloadImages;

            if (preloadRoute) {
              strategicPreloader.preloadRoute(preloadRoute, 'low');
            }

            if (preloadImages) {
              const imageUrls = preloadImages.split(',').map(url => url.trim());
              strategicPreloader.preloadCriticalImages(imageUrls);
            }

            observer.unobserve(element);
          }
        });
      },
      {
        rootMargin: '200px', // Preload when element is 200px away from viewport
        threshold: 0,
      }
    );

    // Observe elements with preload data attributes
    const preloadElements = document.querySelectorAll('[data-preload-route], [data-preload-images]');
    preloadElements.forEach(element => observer.observe(element));

    return () => observer.disconnect();
  }, [shouldPreload]);
}

// Cleanup on app unmount
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    strategicPreloader.cleanup();
  });
}