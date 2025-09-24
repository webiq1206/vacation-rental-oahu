import { useCallback, useEffect, useState } from 'react';

// Network status monitoring
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState<string>('unknown');
  const [effectiveType, setEffectiveType] = useState<string>('unknown');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Get connection information if available
    const connection = (navigator as any).connection || 
                     (navigator as any).mozConnection || 
                     (navigator as any).webkitConnection;

    if (connection) {
      setConnectionType(connection.type || 'unknown');
      setEffectiveType(connection.effectiveType || 'unknown');

      const handleConnectionChange = () => {
        setConnectionType(connection.type || 'unknown');
        setEffectiveType(connection.effectiveType || 'unknown');
      };

      connection.addEventListener('change', handleConnectionChange);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        connection.removeEventListener('change', handleConnectionChange);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    connectionType,
    effectiveType,
    isSlowConnection: effectiveType === 'slow-2g' || effectiveType === '2g',
    isFastConnection: effectiveType === '4g' || effectiveType === '5g',
  };
}

// Adaptive loading based on network conditions
export function useAdaptiveLoading() {
  const { isOnline, isSlowConnection, isFastConnection } = useNetworkStatus();

  const getOptimizedImageUrl = useCallback((url: string, size: 'small' | 'medium' | 'large' = 'medium') => {
    if (!isOnline) return url;

    // Adjust image quality based on connection
    const quality = isSlowConnection ? 70 : isFastConnection ? 95 : 85;
    
    // Adjust size based on connection
    const sizeMap = {
      small: isSlowConnection ? 400 : 600,
      medium: isSlowConnection ? 600 : 800,
      large: isSlowConnection ? 800 : 1200,
    };

    const targetSize = sizeMap[size];

    // If URL contains Unsplash parameters, modify them
    if (url.includes('unsplash.com')) {
      const urlObj = new URL(url);
      urlObj.searchParams.set('w', targetSize.toString());
      urlObj.searchParams.set('q', quality.toString());
      urlObj.searchParams.set('fm', 'webp');
      return urlObj.toString();
    }

    // For other URLs, add query parameters
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}w=${targetSize}&q=${quality}&fm=webp`;
  }, [isOnline, isSlowConnection, isFastConnection]);

  const shouldPreload = useCallback((priority: 'high' | 'medium' | 'low' = 'medium') => {
    if (!isOnline) return false;
    if (isSlowConnection && priority === 'low') return false;
    if (isSlowConnection && priority === 'medium') return Math.random() < 0.3; // 30% chance
    return true;
  }, [isOnline, isSlowConnection]);

  const getOptimalBatchSize = useCallback(() => {
    if (isSlowConnection) return 2;
    if (isFastConnection) return 6;
    return 4;
  }, [isSlowConnection, isFastConnection]);

  return {
    getOptimizedImageUrl,
    shouldPreload,
    getOptimalBatchSize,
    isOnline,
    isSlowConnection,
    isFastConnection,
  };
}

// Request batching and deduplication
export function useRequestBatcher<T>() {
  const batchQueue = useState<Array<{
    key: string;
    resolve: (value: T) => void;
    reject: (error: Error) => void;
  }>>(() => [])[0];
  const batchTimeout = useState<NodeJS.Timeout | null>(() => null)[0];

  const batchRequest = useCallback(async (
    key: string,
    requestFn: (keys: string[]) => Promise<Record<string, T>>,
    delay: number = 50
  ): Promise<T> => {
    return new Promise((resolve, reject) => {
      // Add to batch queue
      batchQueue.push({ key, resolve, reject });

      // Clear existing timeout
      if (batchTimeout) {
        clearTimeout(batchTimeout);
      }

      // Set new timeout to process batch
      setTimeout(() => {
        const currentBatch = [...batchQueue];
        batchQueue.length = 0; // Clear queue

        if (currentBatch.length === 0) return;

        const keys = currentBatch.map(item => item.key);
        const uniqueKeys = Array.from(new Set(keys));

        requestFn(uniqueKeys)
          .then(results => {
            currentBatch.forEach(({ key, resolve }) => {
              if (results[key]) {
                resolve(results[key]);
              } else {
                resolve({} as T); // Fallback empty result
              }
            });
          })
          .catch(error => {
            currentBatch.forEach(({ reject }) => {
              reject(error);
            });
          });
      }, delay);
    });
  }, [batchQueue, batchTimeout]);

  return { batchRequest };
}

// Retry logic with exponential backoff
export function useRetryableRequest() {
  const retryWithBackoff = useCallback(<T>(
    requestFn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> => {
    return new Promise(async (resolve, reject) => {
      let lastError: Error;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const result = await requestFn();
          resolve(result);
          return;
        } catch (error) {
          lastError = error as Error;
          
          if (attempt === maxRetries) {
            reject(lastError);
            return;
          }

          // Exponential backoff with jitter
          const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
          await new Promise(resolveDelay => setTimeout(resolveDelay, delay));
        }
      }
    });
  }, []);

  return { retryWithBackoff };
}

// Compression utilities
export function useCompression() {
  const compressText = useCallback(async (text: string): Promise<ArrayBuffer> => {
    if ('CompressionStream' in window) {
      const stream = new CompressionStream('gzip');
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();

      writer.write(new TextEncoder().encode(text));
      writer.close();

      const chunks: Uint8Array[] = [];
      let done = false;

      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;
        if (value) {
          chunks.push(value);
        }
      }

      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;

      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }

      return result.buffer;
    }

    // Fallback for browsers without CompressionStream
    return new TextEncoder().encode(text).buffer;
  }, []);

  const decompressText = useCallback(async (buffer: ArrayBuffer): Promise<string> => {
    if ('DecompressionStream' in window) {
      const stream = new DecompressionStream('gzip');
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();

      writer.write(new Uint8Array(buffer));
      writer.close();

      const chunks: Uint8Array[] = [];
      let done = false;

      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;
        if (value) {
          chunks.push(value);
        }
      }

      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;

      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }

      return new TextDecoder().decode(result);
    }

    // Fallback for browsers without DecompressionStream
    return new TextDecoder().decode(buffer);
  }, []);

  return { compressText, decompressText };
}