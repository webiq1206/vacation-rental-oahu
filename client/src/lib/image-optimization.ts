// Advanced image optimization utilities for Core Web Vitals
export interface ImageGenerationOptions {
  width: number;
  quality?: number;
  responsive?: boolean;
  format?: 'webp' | 'jpeg' | 'png' | 'avif';
}

// Mobile-first responsive breakpoints
export const RESPONSIVE_BREAKPOINTS = {
  mobile: [320, 480, 640],
  tablet: [768, 1024],
  desktop: [1280, 1536, 1920],
} as const;

// Generate responsive image srcset with mobile optimization
export function generateResponsiveSrcSet(
  src: string, 
  options: ImageGenerationOptions
): string {
  const { width, quality = 75, responsive = true, format = 'jpeg' } = options;
  
  if (!responsive || src.startsWith('data:') || src.startsWith('blob:')) {
    return src;
  }

  const baseUrl = src.split('?')[0];
  const isUnsplash = baseUrl.includes('unsplash.com');
  
  if (!isUnsplash) {
    return src; // Fallback for non-Unsplash URLs
  }

  // Combine all breakpoints and filter by target width
  const allSizes = [
    ...RESPONSIVE_BREAKPOINTS.mobile,
    ...RESPONSIVE_BREAKPOINTS.tablet,
    ...RESPONSIVE_BREAKPOINTS.desktop
  ]
    .filter(size => size <= width * 2)
    .filter((size, index, arr) => arr.indexOf(size) === index) // Remove duplicates
    .sort((a, b) => a - b);

  return allSizes.map(size => {
    // Use higher quality for smaller images (mobile)
    const adaptiveQuality = size <= 640 ? Math.min(quality + 10, 85) : quality;
    const formatParam = format === 'webp' ? '&fm=webp' : '';
    
    return `${baseUrl}?auto=format&fit=crop&w=${size}&q=${adaptiveQuality}${formatParam} ${size}w`;
  }).join(', ');
}

// Generate WebP-optimized srcset
export function generateWebPSrcSet(src: string, width: number, quality: number = 75): string {
  return generateResponsiveSrcSet(src, { width, quality, format: 'webp' });
}

// Generate JPEG fallback srcset
export function generateJPEGSrcSet(src: string, width: number, quality: number = 75): string {
  return generateResponsiveSrcSet(src, { width, quality, format: 'jpeg' });
}

// Generate Low-Quality Image Placeholder (LQIP) for progressive loading
export function generateLQIP(src: string, width: number = 40): string {
  const baseUrl = src.split('?')[0];
  const isUnsplash = baseUrl.includes('unsplash.com');
  
  if (isUnsplash) {
    return `${baseUrl}?auto=format&fit=crop&w=${width}&q=1&blur=10&fm=webp`;
  }
  
  // Fallback SVG placeholder
  return generateSVGPlaceholder('Loading...');
}

// Generate Medium-Quality Image Placeholder (MQIP) for progressive enhancement
export function generateMQIP(src: string, width: number = 160): string {
  const baseUrl = src.split('?')[0];
  const isUnsplash = baseUrl.includes('unsplash.com');
  
  if (isUnsplash) {
    return `${baseUrl}?auto=format&fit=crop&w=${width}&q=20&fm=webp`;
  }
  
  return src; // Fallback to original
}

// Generate SVG placeholder with custom text and aspect ratio
export function generateSVGPlaceholder(
  text: string = 'Loading...', 
  aspectRatio?: string,
  bgColor: string = '#f3f4f6',
  textColor: string = '#9ca3af'
): string {
  const dimensions = getAspectRatioDimensions(aspectRatio);
  
  const svg = `
    <svg width="${dimensions.width}" height="${dimensions.height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${bgColor}"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="${textColor}" font-family="system-ui" font-size="14">${text}</text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// Get dimensions from aspect ratio
function getAspectRatioDimensions(aspectRatio?: string): { width: number; height: number } {
  switch (aspectRatio) {
    case '16/9': return { width: 640, height: 360 };
    case '4/3': return { width: 400, height: 300 };
    case '1/1': return { width: 400, height: 400 };
    case '3/2': return { width: 600, height: 400 };
    case '21/9': return { width: 840, height: 360 };
    default: return { width: 400, height: 300 };
  }
}

// WebP support detection (cached result)
let webpSupport: boolean | null = null;

export function detectWebPSupport(): Promise<boolean> {
  if (webpSupport !== null) {
    return Promise.resolve(webpSupport);
  }

  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    canvas.toBlob((blob) => {
      webpSupport = blob?.type === 'image/webp';
      resolve(webpSupport);
    }, 'image/webp');
  });
}

// AVIF support detection (for future use)
export function detectAVIFSupport(): Promise<boolean> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    canvas.toBlob((blob) => {
      resolve(blob?.type === 'image/avif');
    }, 'image/avif');
  });
}

// Preload critical images for LCP optimization
export function preloadCriticalImage(
  src: string, 
  options: { 
    format?: 'webp' | 'jpeg';
    width?: number;
    as?: 'image';
    fetchPriority?: 'high' | 'low' | 'auto';
  } = {}
): void {
  const { format = 'webp', width = 1920, as = 'image', fetchPriority = 'high' } = options;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = as;
  link.fetchPriority = fetchPriority;
  
  if (format === 'webp') {
    link.href = generateWebPSrcSet(src, width).split(' ')[0] || src;
  } else {
    link.href = generateJPEGSrcSet(src, width).split(' ')[0] || src;
  }
  
  document.head.appendChild(link);
}

// Calculate image loading priority based on viewport position
export function calculateImagePriority(elementTop: number, viewportHeight: number): 'high' | 'low' | 'auto' {
  if (elementTop < viewportHeight) {
    return 'high'; // Above the fold
  } else if (elementTop < viewportHeight * 2) {
    return 'auto'; // Just below the fold
  } else {
    return 'low'; // Far below the fold
  }
}

// Generate optimal sizes attribute for responsive images
export function generateSizesAttribute(breakpoints: { [key: string]: string }): string {
  const defaultBreakpoints = {
    '(min-width: 1024px)': '1024px',
    '(min-width: 768px)': '768px',
    '(min-width: 480px)': '480px',
  };
  
  const combinedBreakpoints = { ...defaultBreakpoints, ...breakpoints };
  
  const sizeQueries = Object.entries(combinedBreakpoints)
    .map(([query, size]) => `${query} ${size}`)
    .join(', ');
    
  return `${sizeQueries}, 100vw`;
}

// Image loading performance monitoring
export function measureImageLoadTime(src: string, callback?: (loadTime: number) => void): Promise<number> {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    const img = new Image();
    
    img.onload = () => {
      const loadTime = performance.now() - startTime;
      callback?.(loadTime);
      resolve(loadTime);
    };
    
    img.onerror = () => {
      reject(new Error(`Failed to load image: ${src}`));
    };
    
    img.src = src;
  });
}

// Batch preload multiple images
export async function batchPreloadImages(
  imageSources: string[], 
  options: { maxConcurrent?: number; priority?: 'high' | 'low' | 'auto' } = {}
): Promise<void> {
  const { maxConcurrent = 3, priority = 'auto' } = options;
  
  const preloadBatch = async (sources: string[]) => {
    const promises = sources.map(src => 
      measureImageLoadTime(src).catch(() => {
        console.warn(`Failed to preload image: ${src}`);
      })
    );
    
    await Promise.allSettled(promises);
  };
  
  // Process images in batches to avoid overwhelming the network
  for (let i = 0; i < imageSources.length; i += maxConcurrent) {
    const batch = imageSources.slice(i, i + maxConcurrent);
    await preloadBatch(batch);
  }
}