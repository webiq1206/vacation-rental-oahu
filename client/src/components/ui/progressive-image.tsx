import { useState, useRef, useEffect, forwardRef, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { useMotionPreferences } from "@/hooks/use-motion-preferences";
import { 
  generateWebPSrcSet, 
  generateJPEGSrcSet, 
  generateLQIP, 
  generateMQIP,
  generateSVGPlaceholder,
  detectWebPSupport,
  generateSizesAttribute,
  preloadCriticalImage,
  measureImageLoadTime
} from "@/lib/image-optimization";

interface ProgressiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean; // For above-the-fold images
  quality?: number; // 1-100
  sizes?: string;
  aspectRatio?: "16/9" | "4/3" | "1/1" | "3/2" | "21/9";
  fill?: boolean; // Object-fit cover with absolute positioning
  progressive?: boolean; // Enable progressive loading with thumbnails
  lcp?: boolean; // Mark as LCP candidate for optimization
  webpFirst?: boolean; // Prioritize WebP format
  responsive?: boolean; // Generate responsive image sets
  blurhash?: string; // Blurhash placeholder
  onLoad?: () => void;
  onError?: () => void;
  onLCPLoad?: () => void; // Callback when LCP image loads
  onProgressiveLoad?: (stage: 'lqip' | 'mqip' | 'full') => void;
}

type LoadingStage = 'lqip' | 'mqip' | 'full' | 'error';

const ProgressiveImage = forwardRef<HTMLImageElement, ProgressiveImageProps>(({
  src,
  alt,
  width,
  height,
  priority = false,
  quality = 75,
  sizes,
  aspectRatio,
  fill = false,
  progressive = true,
  lcp = false,
  webpFirst = true,
  responsive = true,
  blurhash,
  className,
  onLoad,
  onError,
  onLCPLoad,
  onProgressiveLoad,
  ...props
}, ref) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [loadingStage, setLoadingStage] = useState<LoadingStage>('lqip');
  const [supportsWebP, setSupportsWebP] = useState<boolean | null>(null);
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const { preferReducedMotion } = useMotionPreferences();

  // Enhanced intersection observer with LCP optimization
  const { elementRef, hasIntersected } = useIntersectionObserver<HTMLDivElement>({
    threshold: lcp ? 0.01 : 0.1, // Earlier loading for LCP images
    rootMargin: lcp ? '200px' : priority ? '100px' : '50px',
    freezeOnceVisible: true,
  });

  const shouldLoad = priority || hasIntersected;

  // WebP support detection
  useEffect(() => {
    detectWebPSupport().then(setSupportsWebP);
  }, []);

  // Preload critical images
  useEffect(() => {
    if (lcp || priority) {
      preloadCriticalImage(src, {
        format: webpFirst ? 'webp' : 'jpeg',
        width: width || 1920,
        fetchPriority: 'high'
      });
    }
  }, [lcp, priority, src, webpFirst, width]);

  // Memoize image URLs to prevent unnecessary recalculations
  const imageUrls = useMemo(() => {
    if (!width) {
      return {
        webpSrcSet: '',
        fallbackSrcSet: '',
        placeholderSrc: generateSVGPlaceholder('Loading...', aspectRatio),
        mediumQualitySrc: '',
        sizesAttr: sizes || '100vw'
      };
    }

    const webpSrcSet = responsive ? generateWebPSrcSet(src, width, quality) : '';
    const fallbackSrcSet = responsive ? generateJPEGSrcSet(src, width, quality) : '';
    const placeholderSrc = progressive ? generateLQIP(src, 40) : generateSVGPlaceholder('Loading...', aspectRatio);
    const mediumQualitySrc = progressive ? generateMQIP(src, 160) : '';
    
    // Generate optimal sizes attribute based on responsive breakpoints
    const sizesAttr = sizes || generateSizesAttribute({
      '(min-width: 1280px)': fill ? '100vw' : '1280px',
      '(min-width: 1024px)': fill ? '100vw' : '1024px',
      '(min-width: 768px)': fill ? '100vw' : '768px',
    });
    
    return { webpSrcSet, fallbackSrcSet, placeholderSrc, mediumQualitySrc, sizesAttr };
  }, [src, width, quality, responsive, progressive, aspectRatio, sizes, fill]);

  // Progressive loading implementation
  const loadNextStage = useCallback(async () => {
    if (!shouldLoad || isError || supportsWebP === null) return;
    
    try {
      let targetSrc = '';
      let nextStage: LoadingStage = loadingStage;
      
      if (loadingStage === 'lqip' && progressive) {
        // Load medium quality placeholder
        targetSrc = imageUrls.mediumQualitySrc;
        nextStage = 'mqip';
      } else {
        // Load full quality image
        if (supportsWebP && webpFirst && imageUrls.webpSrcSet) {
          targetSrc = imageUrls.webpSrcSet.split(' ')[0];
        } else {
          targetSrc = imageUrls.fallbackSrcSet ? imageUrls.fallbackSrcSet.split(' ')[0] : src;
        }
        nextStage = 'full';
      }
      
      if (!targetSrc) return;
      
      // Measure load time for performance monitoring
      const startTime = performance.now();
      
      const img = new Image();
      img.src = targetSrc;
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Image load failed'));
      });
      
      const endTime = performance.now();
      const loadDuration = endTime - startTime;
      setLoadTime(loadDuration);
      
      setCurrentSrc(targetSrc);
      setLoadingStage(nextStage);
      onProgressiveLoad?.(nextStage);
      
      if (nextStage === 'full') {
        setIsLoaded(true);
        
        if (lcp) {
          // Report LCP time for monitoring
          performance.mark('lcp-image-loaded');
          // Measure LCP if this is the largest contentful element
          if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
            try {
              const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach((entry) => {
                  if (entry.entryType === 'largest-contentful-paint') {
                    console.log('LCP Time:', entry.startTime);
                  }
                });
              });
              observer.observe({ type: 'largest-contentful-paint', buffered: true });
            } catch (e) {
              // Observer not supported
            }
          }
          onLCPLoad?.();
        }
        onLoad?.();
      } else {
        // Continue to next stage after a brief delay for progressive effect
        setTimeout(() => loadNextStage(), preferReducedMotion ? 0 : 150);
      }
    } catch (error) {
      // Fallback to original src
      const img = new Image();
      img.src = src;
      
      img.onload = () => {
        setCurrentSrc(src);
        setIsLoaded(true);
        onLoad?.();
      };
      
      img.onerror = () => {
        setLoadingStage('error');
        setIsError(true);
        onError?.();
      };
    }
  }, [shouldLoad, loadingStage, progressive, supportsWebP, webpFirst, imageUrls, src, isError, lcp, onLCPLoad, onLoad, onError, onProgressiveLoad, preferReducedMotion]);
  
  useEffect(() => {
    loadNextStage();
  }, [loadNextStage]);

  const aspectRatioClass = aspectRatio ? `aspect-${aspectRatio}` : '';
  
  const containerClass = cn(
    "relative overflow-hidden",
    aspectRatioClass,
    fill && "absolute inset-0",
    className
  );

  const imageClass = cn(
    "transition-all duration-500 ease-out",
    fill ? "absolute inset-0 w-full h-full object-cover" : "w-full h-auto",
    isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105",
    lcp && "will-change-transform", // Optimize LCP images for transform
    isError && "hidden"
  );

  const placeholderClass = cn(
    "transition-all duration-500 ease-out",
    fill ? "absolute inset-0 w-full h-full object-cover" : "w-full h-auto",
    isLoaded ? "opacity-0 scale-110" : "opacity-100 scale-100",
    progressive && loadingStage === 'lqip' && "blur-md",
    progressive && loadingStage === 'mqip' && "blur-sm",
    !progressive && "blur-sm"
  );

  return (
    <div ref={elementRef} className={containerClass}>
      {/* Progressive placeholder images */}
      {!isError && (
        <>
          {/* LQIP (Low Quality Image Placeholder) */}
          <img
            src={imageUrls.placeholderSrc}
            alt=""
            className={cn(
              placeholderClass,
              loadingStage !== 'lqip' && "opacity-0"
            )}
            aria-hidden="true"
          />
          
          {/* MQIP (Medium Quality Image Placeholder) */}
          {progressive && loadingStage === 'mqip' && (
            <img
              src={imageUrls.mediumQualitySrc}
              alt=""
              className={cn(
                "transition-opacity duration-300",
                fill ? "absolute inset-0 w-full h-full object-cover" : "w-full h-auto",
                "opacity-100 blur-sm"
              )}
              aria-hidden="true"
            />
          )}
        </>
      )}
      
      {/* Main optimized image */}
      {shouldLoad && !isError && (
        <picture>
          {/* WebP sources with responsive sizes */}
          {imageUrls.webpSrcSet && supportsWebP && (
            <source 
              srcSet={imageUrls.webpSrcSet} 
              sizes={imageUrls.sizesAttr} 
              type="image/webp" 
            />
          )}
          
          {/* AVIF sources for better compression (future enhancement) */}
          {/* <source srcSet={avifSrcSet} sizes={sizes} type="image/avif" /> */}
          
          {/* Fallback JPEG/PNG */}
          <img
            ref={(node) => {
              if (typeof ref === 'function') ref(node);
              else if (ref && typeof ref === 'object') (ref as any).current = node;
              imgRef.current = node;
            }}
            src={currentSrc || src}
            srcSet={imageUrls.fallbackSrcSet}
            sizes={imageUrls.sizesAttr}
            alt={alt}
            width={width}
            height={height}
            className={imageClass}
            loading={priority || lcp ? "eager" : "lazy"}
            decoding={lcp ? "sync" : "async"}
            // fetchPriority={lcp ? "high" : priority ? "high" : "auto"} // Experimental feature
            {...(lcp && { "data-priority": "high" })}
            {...props}
          />
        </picture>
      )}
      
      {/* Error state */}
      {isError && (
        <div className={cn(
          "flex items-center justify-center text-muted-foreground bg-muted",
          fill ? "absolute inset-0" : `w-full ${aspectRatio ? aspectRatioClass : 'h-64'}`
        )}>
          <div className="text-center">
            <div className="text-sm">Unable to load image</div>
            <div className="text-xs mt-1 opacity-70">{alt}</div>
          </div>
        </div>
      )}
      
      {/* Performance debug info (development only) */}
      {process.env.NODE_ENV === 'development' && loadTime && (
        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          {loadTime.toFixed(0)}ms
        </div>
      )}
    </div>
  );
});

ProgressiveImage.displayName = "ProgressiveImage";

export { ProgressiveImage };
export type { ProgressiveImageProps, LoadingStage };