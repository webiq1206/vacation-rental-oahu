import { useState, useRef, useEffect, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean; // For above-the-fold images
  quality?: number; // 1-100
  sizes?: string;
  aspectRatio?: "16/9" | "4/3" | "1/1" | "3/2" | "21/9";
  fill?: boolean; // Object-fit cover with absolute positioning
  placeholder?: "blur" | "empty" | string; // Base64 blur or color
  onLoad?: () => void;
  onError?: () => void;
}

// Generate WebP and fallback URLs with different sizes
function generateImageSrcSet(src: string, width?: number, quality: number = 75): string {
  if (!width || src.startsWith('data:') || src.startsWith('blob:')) {
    return src;
  }

  const baseUrl = src.split('?')[0];
  const isUnsplash = baseUrl.includes('unsplash.com');
  
  if (isUnsplash) {
    const sizes = [480, 768, 1024, 1280, 1536, 1920].filter(size => size <= width * 2);
    return sizes.map(size => 
      `${baseUrl}?auto=format&fit=crop&w=${size}&q=${quality} ${size}w`
    ).join(', ');
  }
  
  // For other URLs, return as-is for now
  return src;
}

function generateWebPSrcSet(src: string, width?: number, quality: number = 75): string {
  if (!width || src.startsWith('data:') || src.startsWith('blob:')) {
    return '';
  }

  const baseUrl = src.split('?')[0];
  const isUnsplash = baseUrl.includes('unsplash.com');
  
  if (isUnsplash) {
    const sizes = [480, 768, 1024, 1280, 1536, 1920].filter(size => size <= width * 2);
    return sizes.map(size => 
      `${baseUrl}?auto=format&fit=crop&w=${size}&q=${quality}&fm=webp ${size}w`
    ).join(', ');
  }
  
  return '';
}

// Generate a low-quality placeholder
function generatePlaceholder(src: string, aspectRatio?: string): string {
  const baseUrl = src.split('?')[0];
  const isUnsplash = baseUrl.includes('unsplash.com');
  
  if (isUnsplash) {
    return `${baseUrl}?auto=format&fit=crop&w=20&q=1&blur=10`;
  }
  
  // Default gray placeholder
  const ratio = aspectRatio === "16/9" ? "640x360" : 
                aspectRatio === "4/3" ? "400x300" :
                aspectRatio === "1/1" ? "400x400" :
                aspectRatio === "3/2" ? "600x400" : "400x300";
  
  return `data:image/svg+xml;base64,${btoa(`
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af" font-family="system-ui" font-size="14">Loading...</text>
    </svg>
  `)}`;
}

const OptimizedImage = forwardRef<HTMLImageElement, OptimizedImageProps>(({
  src,
  alt,
  width,
  height,
  priority = false,
  quality = 75,
  sizes = "(min-width: 1024px) 1024px, (min-width: 768px) 768px, 100vw",
  aspectRatio,
  fill = false,
  placeholder = "blur",
  className,
  onLoad,
  onError,
  ...props
}, ref) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);
  
  // Use intersection observer for lazy loading (unless priority is true)
  const { elementRef, hasIntersected } = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.1,
    rootMargin: '50px',
    freezeOnceVisible: true,
  });

  const shouldLoad = priority || hasIntersected;

  // Generate image URLs
  const webpSrcSet = width ? generateWebPSrcSet(src, width, quality) : '';
  const fallbackSrcSet = width ? generateImageSrcSet(src, width, quality) : '';
  const placeholderSrc = generatePlaceholder(src, aspectRatio);

  // Load image when it should be visible
  useEffect(() => {
    if (!shouldLoad) return;

    const img = new Image();
    
    // Try WebP first if supported
    const canvas = document.createElement('canvas');
    const supportsWebP = canvas.toDataURL('image/webp').startsWith('data:image/webp');
    
    if (supportsWebP && webpSrcSet) {
      // Load WebP version
      const webpUrl = webpSrcSet.split(' ')[0]; // Get first WebP URL
      img.src = webpUrl;
    } else {
      img.src = fallbackSrcSet ? fallbackSrcSet.split(' ')[0] : src;
    }
    
    img.onload = () => {
      setCurrentSrc(img.src);
      setIsLoaded(true);
      onLoad?.();
    };
    
    img.onerror = () => {
      // Fallback to original src if optimized version fails
      if (img.src !== src) {
        img.src = src;
      } else {
        setIsError(true);
        onError?.();
      }
    };
  }, [shouldLoad, src, webpSrcSet, fallbackSrcSet, onLoad, onError]);

  const aspectRatioClass = aspectRatio ? `aspect-${aspectRatio}` : '';
  
  const containerClass = cn(
    "relative overflow-hidden",
    aspectRatioClass,
    fill && "absolute inset-0",
    className
  );

  const imageClass = cn(
    "transition-opacity duration-300",
    fill ? "absolute inset-0 w-full h-full object-cover" : "w-full h-auto",
    isLoaded ? "opacity-100" : "opacity-0",
    isError && "hidden"
  );

  const placeholderClass = cn(
    "transition-opacity duration-300",
    fill ? "absolute inset-0 w-full h-full object-cover" : "w-full h-auto",
    isLoaded ? "opacity-0" : "opacity-100",
    "blur-sm scale-110" // Slight scale and blur for smooth transition
  );

  return (
    <div ref={elementRef} className={containerClass}>
      {/* Placeholder */}
      {!isError && (
        <img
          src={placeholderSrc}
          alt=""
          className={placeholderClass}
          aria-hidden="true"
        />
      )}
      
      {/* Main image */}
      {shouldLoad && !isError && (
        <picture>
          {webpSrcSet && (
            <source srcSet={webpSrcSet} sizes={sizes} type="image/webp" />
          )}
          <img
            ref={(node) => {
              if (typeof ref === 'function') ref(node);
              else if (ref) ref.current = node;
              imgRef.current = node;
            }}
            src={currentSrc || src}
            srcSet={fallbackSrcSet}
            sizes={sizes}
            alt={alt}
            width={width}
            height={height}
            className={imageClass}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
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
    </div>
  );
});

OptimizedImage.displayName = "OptimizedImage";

export { OptimizedImage };