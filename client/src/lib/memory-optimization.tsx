import { useCallback, useEffect, useRef, useState } from 'react';
import { queryClient } from '@/lib/queryClient';

// Memory-optimized state management
export function useOptimizedState<T>(
  initialState: T,
  equalityFn?: (prev: T, next: T) => boolean
) {
  const [state, setState] = useState(initialState);
  const prevStateRef = useRef(initialState);

  const optimizedSetState = useCallback((newState: T | ((prev: T) => T)) => {
    const nextState = typeof newState === 'function' 
      ? (newState as (prev: T) => T)(prevStateRef.current)
      : newState;

    // Only update if state actually changed
    const hasChanged = equalityFn 
      ? !equalityFn(prevStateRef.current, nextState)
      : prevStateRef.current !== nextState;

    if (hasChanged) {
      prevStateRef.current = nextState;
      setState(nextState);
    }
  }, [equalityFn]);

  return [state, optimizedSetState] as const;
}

// Debounced state updates to prevent excessive re-renders
export function useDebouncedState<T>(
  initialState: T,
  delay: number = 300
): [T, T, (value: T) => void] {
  const [state, setState] = useState(initialState);
  const [debouncedState, setDebouncedState] = useState(initialState);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const setValue = useCallback((value: T) => {
    setState(value);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setDebouncedState(value);
    }, delay);
  }, [delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [state, debouncedState, setValue];
}

// Memory leak prevention for event listeners
export function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  element: Element | Window = window,
  options?: boolean | AddEventListenerOptions
) {
  const savedHandler = useRef<(event: WindowEventMap[K]) => void>();

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!element?.addEventListener) return;

    const eventListener = (event: Event) => {
      savedHandler.current?.(event as WindowEventMap[K]);
    };

    element.addEventListener(eventName, eventListener, options);

    return () => {
      element.removeEventListener(eventName, eventListener, options);
    };
  }, [eventName, element, options]);
}

// Optimized scroll handling with throttling
export function useThrottledScroll(
  callback: (scrollY: number, scrollDirection: 'up' | 'down') => void,
  throttleMs: number = 16
) {
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  const handleScroll = useCallback(() => {
    if (!ticking.current) {
      requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const direction = currentScrollY > lastScrollY.current ? 'down' : 'up';
        
        callback(currentScrollY, direction);
        lastScrollY.current = currentScrollY;
        ticking.current = false;
      });
      ticking.current = true;
    }
  }, [callback]);

  useEventListener('scroll', handleScroll);
}

// Memory-efficient image loading
export function useImageLoader() {
  const imageCache = useRef(new Map<string, HTMLImageElement>());
  const loadingImages = useRef(new Set<string>());

  const preloadImage = useCallback((src: string): Promise<HTMLImageElement> => {
    // Return cached image if available
    if (imageCache.current.has(src)) {
      return Promise.resolve(imageCache.current.get(src)!);
    }

    // Return existing promise if already loading
    if (loadingImages.current.has(src)) {
      return new Promise((resolve) => {
        const checkLoaded = () => {
          if (imageCache.current.has(src)) {
            resolve(imageCache.current.get(src)!);
          } else {
            setTimeout(checkLoaded, 10);
          }
        };
        checkLoaded();
      });
    }

    // Start loading new image
    loadingImages.current.add(src);
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        imageCache.current.set(src, img);
        loadingImages.current.delete(src);
        resolve(img);
      };
      
      img.onerror = () => {
        loadingImages.current.delete(src);
        reject(new Error(`Failed to load image: ${src}`));
      };
      
      img.src = src;
    });
  }, []);

  const clearImageCache = useCallback(() => {
    imageCache.current.clear();
    loadingImages.current.clear();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return clearImageCache;
  }, [clearImageCache]);

  return { preloadImage, clearImageCache };
}

// Component performance monitoring
export function useRenderTracker(componentName: string) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current += 1;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} rendered ${renderCount.current} times`, {
        timeSinceLastRender,
        renderCount: renderCount.current
      });
      
      // Warn about frequent re-renders
      if (timeSinceLastRender < 16 && renderCount.current > 10) {
        console.warn(`${componentName} is re-rendering frequently (${renderCount.current} times)`);
      }
    }
    
    lastRenderTime.current = now;
  });

  return renderCount.current;
}

// Cleanup resources on component unmount
export function useCleanup(cleanupFn: () => void) {
  const cleanupRef = useRef(cleanupFn);
  
  useEffect(() => {
    cleanupRef.current = cleanupFn;
  }, [cleanupFn]);

  useEffect(() => {
    return () => {
      cleanupRef.current();
    };
  }, []);
}

// Memory-efficient query cache management
export function useCacheOptimization() {
  const cleanupUnusedQueries = useCallback(() => {
    const queries = queryClient.getQueryCache().getAll();
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    queries.forEach(query => {
      if (query.getObserversCount() === 0 && query.state.dataUpdatedAt < oneHourAgo) {
        queryClient.removeQueries({ queryKey: query.queryKey });
      }
    });
  }, []);

  const clearOldCacheEntries = useCallback(() => {
    const queries = queryClient.getQueryCache().getAll();
    const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000);
    
    queries.forEach(query => {
      if (query.state.dataUpdatedAt < threeDaysAgo) {
        queryClient.removeQueries({ queryKey: query.queryKey });
      }
    });
  }, []);

  // Set up periodic cleanup
  useEffect(() => {
    const cleanupInterval = setInterval(cleanupUnusedQueries, 15 * 60 * 1000); // 15 minutes
    const deepCleanupInterval = setInterval(clearOldCacheEntries, 24 * 60 * 60 * 1000); // 24 hours
    
    return () => {
      clearInterval(cleanupInterval);
      clearInterval(deepCleanupInterval);
    };
  }, [cleanupUnusedQueries, clearOldCacheEntries]);

  return {
    cleanupUnusedQueries,
    clearOldCacheEntries,
  };
}