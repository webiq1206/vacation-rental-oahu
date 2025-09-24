import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X, Images } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollReveal, StaggeredReveal } from "@/components/ui/scroll-reveal";
import { ProgressiveImage } from "@/components/ui/progressive-image";
import { SkeletonGallery, ProgressiveLoader } from "@/components/ui/luxury-skeleton";
import { motion } from "framer-motion";

interface Photo {
  id: string;
  url: string;
  alt: string;
  is_featured?: boolean;
}

export function PhotoGallery() {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lastFocusedElement, setLastFocusedElement] = useState<HTMLElement | null>(null);
  const [announceText, setAnnounceText] = useState("");
  const galleryRef = useRef<HTMLDivElement>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const { data: photos = [], isLoading } = useQuery<Photo[]>({
    queryKey: ["/api/photos"],
  });

  // Default photos if none are loaded - moved before callbacks to avoid temporal dead zone
  const defaultPhotos: Photo[] = [
    {
      id: "1",
      url: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      alt: "Vacation Rental Oahu - Beach House living room with ocean views",
      is_featured: true,
    },
    {
      id: "2", 
      url: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
      alt: "Vacation Rental Oahu - Master bedroom with tropical decor",
    },
    {
      id: "3",
      url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
      alt: "Vacation Rental Oahu - Gourmet kitchen with modern appliances",
    },
    {
      id: "4",
      url: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
      alt: "Vacation Rental Oahu - Infinity pool with ocean views at sunset",
    },
    {
      id: "5",
      url: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
      alt: "Vacation Rental Oahu - Luxury bathroom with rainfall shower",
    },
    {
      id: "6",
      url: "https://images.unsplash.com/photo-1600585152915-d208bec867a1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
      alt: "Vacation Rental Oahu - Outdoor dining area with ocean views",
    },
  ];

  const displayPhotos = useMemo(() => {
    return photos.length > 0 ? photos : defaultPhotos;
  }, [photos]);

  // Show only first 6 photos in the grid, but keep all for lightbox
  const gridPhotos = useMemo(() => {
    return displayPhotos.slice(0, 6);
  }, [displayPhotos]);

  const openLightbox = useCallback((index: number) => {
    // Store the currently focused element for restoration later
    setLastFocusedElement(document.activeElement as HTMLElement);
    setCurrentImageIndex(index);
    setIsLightboxOpen(true);
    setAnnounceText(`Opening image ${index + 1} of ${displayPhotos.length} in lightbox: ${displayPhotos[index]?.alt || 'Property image'}`);
  }, [displayPhotos]);

  const nextImage = useCallback(() => {
    const newIndex = (currentImageIndex + 1) % displayPhotos.length;
    setCurrentImageIndex(newIndex);
    setAnnounceText(`Image ${newIndex + 1} of ${displayPhotos.length}: ${displayPhotos[newIndex]?.alt || 'Property image'}`);
  }, [currentImageIndex, displayPhotos]);

  const prevImage = useCallback(() => {
    const newIndex = (currentImageIndex - 1 + displayPhotos.length) % displayPhotos.length;
    setCurrentImageIndex(newIndex);
    setAnnounceText(`Image ${newIndex + 1} of ${displayPhotos.length}: ${displayPhotos[newIndex]?.alt || 'Property image'}`);
  }, [currentImageIndex, displayPhotos]);

  const closeLightbox = useCallback(() => {
    setIsLightboxOpen(false);
    setAnnounceText('Lightbox closed');
    // Restore focus to the previously focused element
    if (lastFocusedElement) {
      setTimeout(() => {
        lastFocusedElement.focus();
      }, 100);
    }
  }, [lastFocusedElement]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLightboxOpen) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          prevImage();
          break;
        case 'ArrowRight':
          e.preventDefault();
          nextImage();
          break;
        case 'Escape':
          e.preventDefault();
          closeLightbox();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, prevImage, nextImage, closeLightbox]);

  // Focus management for lightbox
  useEffect(() => {
    if (isLightboxOpen && closeButtonRef.current) {
      // Focus the close button when lightbox opens
      closeButtonRef.current.focus();
    }
  }, [isLightboxOpen]);


  const galleryContent = (
    <section 
      id="gallery" 
      className="py-16 bg-background"
      aria-labelledby="gallery-heading"
      role="region"
    >
      <div className="container mx-auto px-4">
        {/* Screen reader announcements */}
        <div 
          aria-live="polite" 
          aria-atomic="true"
          className="sr-only"
          role="status"
        >
          {announceText}
        </div>
        
        <ScrollReveal className="text-center mb-12">
          <h2 
            id="gallery-heading"
            className="text-luxury-2xl sm:text-luxury-3xl font-serif font-normal text-foreground mb-4 tracking-luxury-tight"
          >
            Stunning Views & Spaces
          </h2>
          <p className="text-luxury-lg font-serif text-muted-foreground max-w-2xl mx-auto leading-relaxed tracking-luxury-tight">
            Discover every corner of our tropical paradise, from the stunning interior spaces to the private beach access.
          </p>
        </ScrollReveal>

        <StaggeredReveal 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto"
          staggerDelay={0.1}
          distance={40}
          aria-label={`Property photo gallery with ${gridPhotos.length} images shown, ${displayPhotos.length} total`}
        >
          {gridPhotos.map((photo, index) => {
            const isFeatured = photo.is_featured || index === 0;
            return (
              <motion.div
                key={photo.id}
                className="relative overflow-hidden rounded-2xl cursor-pointer group luxury-card gallery-item"
                onClick={() => openLightbox(index)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openLightbox(index);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Open image ${index + 1} of ${displayPhotos.length}: ${photo.alt} in lightbox`}
                data-testid={`gallery-image-${index}`}
                whileHover={{ 
                  scale: 1.02,
                  transition: { duration: 0.3, ease: "easeOut" }
                }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="aspect-[3/2] h-full"
                >
                  <ProgressiveImage
                    src={photo.url}
                    alt={photo.alt}
                    width={600}
                    height={400}
                    priority={index < 3}
                    lcp={index === 0}
                    aspectRatio="3/2"
                    className="w-full h-full gallery-image object-cover"
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    fill={true}
                    progressive={true}
                    webpFirst={true}
                    responsive={true}
                    role="img"
                    aria-describedby={`image-description-${index}`}
                    onProgressiveLoad={(stage) => {
                      if (stage === 'full' && index === 0) {
                        performance.mark('gallery-hero-loaded');
                      }
                    }}
                  />
                  <span id={`image-description-${index}`} className="sr-only">
                    Gallery image: {photo.alt}. Click to view in lightbox.
                  </span>
                </motion.div>
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
                <motion.div 
                  className="absolute inset-0 bronze-shimmer-overlay"
                  initial={{ opacity: 0, x: "-100%" }}
                  whileHover={{ opacity: 0.3, x: "100%" }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                />
              </motion.div>
            );
          })}
        </StaggeredReveal>

        <div className="flex justify-center mt-8">
          <ScrollReveal>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                onClick={() => openLightbox(0)}
                variant="bronze"
                size="lg"
                className="btn-bronze-enhanced font-semibold touch-target"
                data-testid="show-all-photos"
                aria-label={`View all ${displayPhotos.length} property photos in gallery lightbox`}
              >
                <Images className="h-5 w-5 mr-2" aria-hidden="true" />
                Show all {displayPhotos.length} photos
              </Button>
            </motion.div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );

  const skeletonContent = (
    <section id="gallery" className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="h-8 w-64 mx-auto mb-4 bg-gradient-to-r from-bronze-200 via-bronze-300 to-bronze-200 animate-shimmer bg-[length:200%_100%] rounded-xl" />
          <div className="h-6 w-96 mx-auto bg-gradient-to-r from-bronze-100 via-bronze-200 to-bronze-100 animate-shimmer bg-[length:200%_100%] rounded-xl" />
        </div>
        <SkeletonGallery items={6} className="max-w-6xl mx-auto" variant="shimmer" speed="normal" />
      </div>
    </section>
  );

  return (
    <>
      <ProgressiveLoader
        isLoading={isLoading}
        skeleton={skeletonContent}
        delay={0.1}
      >
        {galleryContent}
      </ProgressiveLoader>

      {/* Lightbox */}
      <Dialog open={isLightboxOpen} onOpenChange={closeLightbox}>
        <DialogContent 
          className="max-w-5xl w-full h-full max-h-[90vh] p-0 bg-black"
          ref={lightboxRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="lightbox-title"
          aria-describedby="lightbox-description"
        >
          <DialogTitle id="lightbox-title" className="sr-only">
            Property Photo Gallery - Image {currentImageIndex + 1} of {displayPhotos.length}
          </DialogTitle>
          <div id="lightbox-description" className="sr-only">
            Use arrow keys to navigate between images, or press Escape to close the gallery.
          </div>
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close button */}
            <Button
              ref={closeButtonRef}
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/20 touch-target"
              onClick={closeLightbox}
              aria-label="Close photo gallery"
              data-testid="lightbox-close"
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </Button>

            {/* Navigation buttons */}
            {displayPhotos.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 touch-target carousel-button"
                  onClick={prevImage}
                  aria-label={`Go to previous image: ${displayPhotos[currentImageIndex - 1 >= 0 ? currentImageIndex - 1 : displayPhotos.length - 1]?.alt || 'previous image'}`}
                  data-testid="lightbox-prev"
                >
                  <ChevronLeft className="h-8 w-8" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 touch-target carousel-button"
                  onClick={nextImage}
                  aria-label={`Go to next image: ${displayPhotos[currentImageIndex + 1 < displayPhotos.length ? currentImageIndex + 1 : 0]?.alt || 'next image'}`}
                  data-testid="lightbox-next"
                >
                  <ChevronRight className="h-8 w-8" aria-hidden="true" />
                </Button>
              </>
            )}

            {/* Current image */}
            <img
              src={displayPhotos[currentImageIndex]?.url}
              alt={displayPhotos[currentImageIndex]?.alt}
              className="max-w-full max-h-full w-auto h-auto object-contain"
              data-testid="lightbox-image"
              loading="eager"
              onError={(e) => {
                console.error('Lightbox image failed to load:', displayPhotos[currentImageIndex]?.url);
                const target = e.target as HTMLImageElement;
                target.style.display = 'block';
                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjZjNmNGY2Ii8+CjxyZWN0IHg9IjE2MCIgeT0iMTIwIiB3aWR0aD0iODAiIGhlaWdodD0iNjAiIHJ4PSI0IiBmaWxsPSIjZTVlN2ViIi8+CjxyZWN0IHg9IjE3MCIgeT0iMTMwIiB3aWR0aD0iMjAiIGhlaWdodD0iMTUiIHJ4PSIyIiBmaWxsPSIjOWNhM2FmIi8+CjxyZWN0IHg9IjIwMCIgeT0iMTMwIiB3aWR0aD0iMzAiIGhlaWdodD0iMTUiIHJ4PSIyIiBmaWxsPSIjOWNhM2FmIi8+CjxyZWN0IHg9IjE3MCIgeT0iMTU1IiB3aWR0aD0iNjAiIGhlaWdodD0iMTUiIHJ4PSIyIiBmaWxsPSIjOWNhM2FmIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjEwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjk3Mzc3IiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCI+SW1hZ2UgZmFpbGVkIHRvIGxvYWQ8L3RleHQ+Cjwvc3ZnPg==';
              }}
            />

            {/* Image counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
              {currentImageIndex + 1} / {displayPhotos.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
