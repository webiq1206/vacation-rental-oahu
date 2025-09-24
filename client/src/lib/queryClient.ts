import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Performance monitoring for API calls
const performanceObserver = {
  start: (key: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark(`api-${key}-start`);
    }
  },
  end: (key: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark(`api-${key}-end`);
      window.performance.measure(`api-${key}`, `api-${key}-start`, `api-${key}-end`);
    }
  }
};

// Helper function to convert queryKey to string for URL construction
const queryKeyToString = (key: string | readonly unknown[]): string => {
  if (Array.isArray(key)) {
    return key.map(segment => {
      if (typeof segment === 'string') {
        return segment;
      } else if (segment && typeof segment === 'object') {
        // Convert objects to query string format
        return Object.entries(segment)
          .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
          .join('&');
      } else {
        return String(segment);
      }
    }).join('/');
  }
  // At this point, key must be a string since we handled the array case above
  return key as string;
};

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey, signal }) => {
    const keyString = queryKeyToString(queryKey);
    performanceObserver.start(keyString);
    
    try {
      const res = await fetch(keyString as string, {
        credentials: "include",
        signal, // Support request cancellation
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      const data = await res.json();
      
      performanceObserver.end(keyString);
      return data;
    } catch (error) {
      performanceObserver.end(keyString);
      
      // Handle AbortError gracefully - don't throw it as it's expected behavior
      if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('aborted'))) {
        return Promise.reject(error); // Let React Query handle it internally
      }
      
      throw error;
    }
  };

// Cache configuration with intelligent strategies
const getCacheConfig = (key: string) => {
  // Critical static content - very long cache
  if (key.includes('/api/property/public') || key.includes('/api/amenities')) {
    return {
      staleTime: 1000 * 60 * 60 * 24, // 24 hours
      gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days (formerly cacheTime)
    };
  }
  
  // Semi-static content like photos and reviews
  if (key.includes('/api/photos') || key.includes('/api/reviews')) {
    return {
      staleTime: 1000 * 60 * 30, // 30 minutes
      gcTime: 1000 * 60 * 60 * 2, // 2 hours
      refetchOnMount: 'always' as const,
      refetchOnWindowFocus: false,
    };
  }
  
  // Dynamic content like quotes and availability
  if (key.includes('/api/quote') || key.includes('/api/availability')) {
    return {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 15, // 15 minutes
      refetchOnMount: 'always' as const,
      refetchOnWindowFocus: true,
    };
  }
  
  // User-specific content
  if (key.includes('/api/user') || key.includes('/api/bookings')) {
    return {
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      refetchOnMount: true,
      refetchOnWindowFocus: true,
    };
  }
  
  // Default for other content
  return {
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  };
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors except 408 (timeout)
        if (error instanceof Error && error.message.includes('4')) {
          const statusCode = parseInt(error.message.split(':')[0]);
          if (statusCode >= 400 && statusCode < 500 && statusCode !== 408) {
            return false;
          }
        }
        return failureCount < 3;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Dynamic configuration based on query key
      ...getCacheConfig('default'),
    },
    mutations: {
      retry: false,
      // Global mutation settings
      onError: (error) => {
        console.error('Mutation failed:', error);
      },
    },
  },
});

// Enhanced query function with caching awareness
export const createQuery = (key: string | readonly unknown[], options: any = {}) => {
  const keyString: string = queryKeyToString(key);
  const cacheConfig = getCacheConfig(keyString);
  
  return {
    queryKey: key,
    ...cacheConfig,
    ...options, // Allow overrides
  };
};

// Prefetch utilities
export const prefetchCriticalData = async () => {
  // Prefetch critical static data
  const prefetchPromises = [
    queryClient.prefetchQuery(createQuery(['/api/property/public'])),
    queryClient.prefetchQuery(createQuery(['/api/amenities'])),
    queryClient.prefetchQuery(createQuery(['/api/photos'])),
  ];
  
  try {
    await Promise.allSettled(prefetchPromises);
  } catch (error) {
    console.warn('Some prefetch operations failed:', error);
  }
};

// Background refresh for dynamic content
export const setupBackgroundRefresh = () => {
  // Refresh pricing data every 5 minutes in the background
  setInterval(() => {
    queryClient.invalidateQueries({ 
      queryKey: ['/api/quote'],
      refetchType: 'none' // Just mark as stale, don't refetch immediately
    });
  }, 1000 * 60 * 5);
  
  // Refresh reviews every 30 minutes
  setInterval(() => {
    queryClient.invalidateQueries({ 
      queryKey: ['/api/reviews'],
      refetchType: 'none'
    });
  }, 1000 * 60 * 30);
};

// Memory optimization - remove unused queries
export const cleanupCache = () => {
  // Remove queries that haven't been used recently
  queryClient.getQueryCache().getAll().forEach(query => {
    if (query.getObserversCount() === 0) {
      const lastUsed = query.state.dataUpdatedAt;
      const oneHourAgo = Date.now() - 1000 * 60 * 60;
      
      if (lastUsed < oneHourAgo) {
        queryClient.removeQueries({ queryKey: query.queryKey });
      }
    }
  });
};

// Setup cleanup interval
if (typeof window !== 'undefined') {
  setInterval(cleanupCache, 1000 * 60 * 15); // Every 15 minutes
  
  // Add global error handler for unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    // Silently handle AbortErrors as they are expected behavior
    if (event.reason && 
        (event.reason.name === 'AbortError' || 
         (typeof event.reason.message === 'string' && event.reason.message.includes('aborted')))) {
      event.preventDefault(); // Prevent the error from being logged
      return;
    }
  });
}
