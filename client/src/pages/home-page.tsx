import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BookingWidget } from "@/components/booking/booking-widget";
import { MobileStickyCTA } from "@/components/booking/mobile-sticky-cta";
import { MobileBookingOptimizer } from "@/components/booking/mobile-booking-optimizer";
import { PhotoGallery } from "@/components/property/photo-gallery";
import { AmenitiesGrid } from "@/components/property/amenities-grid";
import { GoogleLocationMap } from "@/components/property/google-location-map";
import ReviewsSection from "@/components/property/reviews-section";
import { Button } from "@/components/ui/button";
import { ScrollReveal, StaggeredReveal } from "@/components/ui/scroll-reveal";
import { useQuery } from "@tanstack/react-query";
import { Users, Bed, Waves, Home } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useParallax } from "@/hooks/use-parallax";
import { useSEO, useSEOSettings, generateOrganizationSchema, generateLodgingBusinessSchema, generateBreadcrumbSchema, type SiteInfoSettings } from "@/lib/seo-utils";
import { ProgressiveImage } from "@/components/ui/progressive-image";
import type { PublicProperty } from "@shared/schema";
import heroVideoPath from "@assets/Vacation Rental Oahu - Chinaman's Beach House_1758642684022.mp4";
import { useIsMobile } from "@/hooks/use-mobile";

// Optimized Parallax Background Component with mobile optimization
function ParallaxBackground() {
  const { ref: bgRef, y: bgY } = useParallax<HTMLDivElement>({ speed: 0.3 });
  const { ref: overlayRef, y: overlayY } = useParallax<HTMLDivElement>({ speed: 0.1 });
  const isMobile = useIsMobile();
  
  // Disable parallax on mobile for better performance
  const mobileBgY = isMobile ? 0 : bgY;
  const mobileOverlayY = isMobile ? 0 : overlayY;

  return (
    <>
      <motion.div 
        ref={bgRef}
        className="absolute inset-0 gpu-accelerated"
        style={{ y: mobileBgY }}
        initial={{ scale: isMobile ? 1 : 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: isMobile ? 0.8 : 1.5, ease: "easeOut" }}
        viewport={{ once: true, amount: 0.2 }}
      >
        {/* Use video for both desktop and mobile */}
        <video
          src={heroVideoPath}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className="w-full h-full object-cover"
          style={{ 
            willChange: isMobile ? 'auto' : 'transform',
            objectPosition: 'center',
          }}
          aria-label="Vacation Rental Oahu - Beach House Oahu oceanfront property at Chinaman's Beach with stunning ocean views"
          onLoadedData={() => {
            performance.mark('hero-video-loaded');
            console.log('Hero video loaded');
          }}
          onLoadStart={() => {
            // Prevent layout shift by setting explicit dimensions
            const video = document.querySelector('video') as HTMLVideoElement;
            if (video) {
              video.style.minHeight = '100vh';
              video.style.objectFit = 'cover';
              video.style.objectPosition = 'center';
            }
          }}
        />
      </motion.div>
      <motion.div 
        ref={overlayRef}
        className="absolute inset-0 bg-black/20 hero-overlay gpu-accelerated z-10"
        style={{ y: mobileOverlayY }}
      />
    </>
  );
}

export default function HomePage() {
  const { data: property } = useQuery<PublicProperty>({
    queryKey: ["/api/property/public"],
  });

  // Get base pricing for display
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const dayAfter = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const { data: pricing } = useQuery({
    queryKey: [`/api/quote?start=${tomorrow}&end=${dayAfter}&guests=2`],
    enabled: true,
    retry: false,
  });

  // Get SEO settings for schema generation
  const { seoSettings } = useSEOSettings();

  // Get site settings for dynamic schema content
  const { data: siteSettings } = useQuery<SiteInfoSettings>({
    queryKey: ['/api/settings/site_info'],
    retry: false,
  });

  // SEO implementation for home page using database-driven content
  useSEO({
    pageType: "home",
    // keywords and canonical will be handled dynamically by SEO settings
    ogType: "website",
    twitterCard: "summary_large_image",
    structuredData: seoSettings ? [
      generateOrganizationSchema(seoSettings, siteSettings),
      generateLodgingBusinessSchema(property, seoSettings, siteSettings),
      generateBreadcrumbSchema([
        { name: "Home", url: "/" }
      ])
    ] : []
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main id="main-content">
        {/* Hero Section with Real Parallax */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-28">
        <ParallaxBackground />
        
        <div className="relative z-10 container mx-auto mobile-container-padding grid lg:grid-cols-2 gap-8 md:gap-10 lg:gap-12 items-center min-h-[80vh] lg:min-h-screen py-8 lg:py-0">
          <motion.div 
            className="text-center lg:text-left"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true, amount: 0.2 }}
          >
            <motion.h1 
              className="text-luxury-5xl md:text-luxury-6xl font-serif font-normal text-white mb-6 md:mb-8 lg:mb-10 leading-tight tracking-luxury-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true, amount: 0.2 }}
            >
              Beach House{" "}
              <span className="paradise-text">
                Paradise
              </span>
              {" "}on Oahu
            </motion.h1>
            
            <motion.p 
              className="text-luxury-lg md:text-luxury-xl text-white/90 mb-8 md:mb-10 lg:mb-12 leading-relaxed font-light tracking-luxury-wide max-w-2xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              viewport={{ once: true, amount: 0.2 }}
            >
              Experience the ultimate Hawaiian getaway in our stunning oceanfront beach house with breathtaking ocean views and premium amenities.
            </motion.p>
            
            <StaggeredReveal 
              className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 justify-items-center md:justify-items-start mb-8 md:mb-10 lg:mb-12"
              staggerDelay={0.1}
              distance={20}
            >
              <div className="flex items-center text-white/95 text-luxury-sm font-serif font-normal tracking-luxury-tight glass-card px-4 py-3 rounded-full min-w-[130px] justify-center whitespace-nowrap">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-bronze-200 flex-shrink-0" />
                <span className="text-center">{property?.max_guests ? `Sleeps ${property.max_guests}` : `Sleeps 8`}</span>
              </div>
              <div className="flex items-center text-white/95 text-luxury-sm font-serif font-normal tracking-luxury-tight glass-card px-4 py-3 rounded-full min-w-[130px] justify-center whitespace-nowrap">
                <Bed className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-bronze-200 flex-shrink-0" />
                <span className="text-center">{property?.bedrooms ? `${property.bedrooms} Bedrooms` : `3 Bedrooms`}</span>
              </div>
              <div className="flex items-center text-white/95 text-luxury-sm font-serif font-normal tracking-luxury-tight glass-card px-4 py-3 rounded-full min-w-[130px] justify-center whitespace-nowrap">
                <Home className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-bronze-200 flex-shrink-0" />
                <span className="text-center">Ocean View</span>
              </div>
              <div className="flex items-center text-white/95 text-luxury-sm font-serif font-normal tracking-luxury-tight glass-card px-4 py-3 rounded-full min-w-[130px] justify-center whitespace-nowrap">
                <Waves className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-bronze-200 flex-shrink-0" />
                <span className="text-center">Beach Gear</span>
              </div>
            </StaggeredReveal>

            <motion.div 
              className="grid grid-cols-2 gap-3 sm:gap-4 justify-items-center lg:justify-start"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              viewport={{ once: true, amount: 0.2 }}
            >
              <Link href="/stay" className="w-full">
                <Button size="lg" variant="bronze" className="btn-bronze-enhanced font-serif font-normal tracking-luxury-tight touch-target-optimal w-full" data-testid="explore-button">
                  Explore Beach House
                </Button>
              </Link>
              <Link href="/booking" className="w-full">
                <Button size="lg" variant="bronze" className="btn-bronze-enhanced touch-target-optimal w-full" data-testid="book-now-button">
                  Book Now
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Desktop Booking Widget in Hero */}
          <motion.div 
            className="lg:justify-self-end w-full max-w-md xl:max-w-lg mx-auto lg:mx-0 mt-8 lg:mt-0 hidden lg:block"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true, amount: 0.2 }}
          >
            <div className="glass-card">
              <BookingWidget />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Property Facts Section - Logical Position #2 */}
      <section className="py-16 bg-secondary/20">
        <div className="container mx-auto px-4">
          <ScrollReveal className="text-center mb-12">
            <h2 className="text-luxury-3xl md:text-luxury-4xl font-serif font-normal text-foreground mb-6 leading-tight tracking-luxury-tight">
              Your Beach House Oahu Hawaiian Escape
            </h2>
            <p className="text-luxury-lg text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
              Everything you need for the perfect Oahu vacation experience
            </p>
          </ScrollReveal>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="text-center p-8 rounded-lg bg-card border hover:border-primary/20 transition-colors">
              <Users className="h-10 w-10 mx-auto mb-4 text-primary" />
              <h3 className="text-luxury-xl font-serif font-normal mb-2 tracking-luxury-tight">
                {property?.max_guests ? `${property.max_guests} Guests` : 'Spacious for All'}
              </h3>
              <p className="text-luxury-base font-serif text-muted-foreground tracking-luxury-tight">Perfect for families and groups</p>
            </div>
            <div className="text-center p-8 rounded-lg bg-card border hover:border-primary/20 transition-colors">
              <Bed className="h-10 w-10 mx-auto mb-4 text-primary" />
              <h3 className="text-luxury-xl font-serif font-normal mb-2 tracking-luxury-tight">
                {property?.bedrooms ? `${property.bedrooms} Bedrooms` : 'Comfortable Sleeping'}
              </h3>
              <p className="text-luxury-base font-serif text-muted-foreground tracking-luxury-tight">Premium accommodations for everyone</p>
            </div>
            <div className="text-center p-8 rounded-lg bg-card border hover:border-primary/20 transition-colors">
              <Waves className="h-10 w-10 mx-auto mb-4 text-primary" />
              <h3 className="text-luxury-xl font-serif font-normal mb-2 tracking-luxury-tight">Oceanfront</h3>
              <p className="text-luxury-base font-serif text-muted-foreground tracking-luxury-tight">Direct beach access and stunning views</p>
            </div>
          </div>
        </div>
      </section>


      {/* Photo Gallery - Logical Position #4 */}
      <PhotoGallery />

      {/* Amenities */}
      <AmenitiesGrid />

      {/* Location */}
      <GoogleLocationMap />

      {/* Reviews */}
      <ReviewsSection />

      {/* Hawaiian Experience Booking */}
      <section className="section-padding-responsive bg-background">
        <div className="container mx-auto mobile-container-padding">
          <ScrollReveal className="text-center mb-8 md:mb-12">
            <h2 className="text-luxury-2xl sm:text-luxury-3xl font-serif font-normal text-foreground mb-3 md:mb-4 tracking-luxury-tight">
              Book Hawaiian Experiences
            </h2>
            <p className="text-luxury-lg font-serif text-muted-foreground max-w-2xl mx-auto leading-relaxed tracking-luxury-tight">
              Enhance your stay with unforgettable adventures and activities around Oahu.
            </p>
          </ScrollReveal>

          <ScrollReveal className="max-w-4xl mx-auto">
            <div className="luxury-card p-6 md:p-8 rounded-xl">
              <div 
                data-vi-partner-id="P00269401" 
                data-vi-widget-ref="W-05b9336c-e7c2-4c23-a749-fff0a44366ea"
                className="min-h-[400px] w-full"
              ></div>
            </div>
            
            <div className="text-center mt-8">
              <Link href="/experiences">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="font-serif font-normal tracking-luxury-tight touch-target-optimal"
                  data-testid="view-all-experiences-button"
                >
                  View All Experiences
                </Button>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Call to Action */}
      <section className="section-padding-responsive bg-tropical-gradient text-white">
        <div className="container mx-auto mobile-container-padding text-center">
          <ScrollReveal>
            <h2 className="text-luxury-2xl sm:text-luxury-3xl font-serif font-normal mb-3 md:mb-4 tracking-luxury-tight">
              Ready for Your Hawaiian{" "}
              <span className="paradise-text text-white font-weight-600">
                Paradise
              </span>?
            </h2>
            <p className="text-luxury-xl font-serif text-white/90 mb-6 md:mb-8 max-w-2xl mx-auto leading-relaxed tracking-luxury-tight">
              Book now and start planning your dream vacation in our luxury Oahu beach house.
            </p>
            <Link href="/booking">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Button 
                  size="lg" 
                  variant="bronze"
                  className="btn-bronze-enhanced font-serif font-normal tracking-luxury-tight touch-target-optimal"
                  data-testid="cta-book-button"
                >
                  Book Your Stay
                </Button>
              </motion.div>
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* Enhanced Mobile Sticky Booking CTA - Only render one mobile booking component */}
      <MobileStickyCTA />

      </main>
      <Footer />
    </div>
  );
}
