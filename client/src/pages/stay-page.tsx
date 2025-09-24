import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BookingWidget } from "@/components/booking/booking-widget";
import { PhotoGallery } from "@/components/property/photo-gallery";
import { AirbnbStyleAmenities } from "@/components/property/airbnb-style-amenities";
import { LocationMap } from "@/components/property/location-map";
import ReviewsSection from "@/components/property/reviews-section";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Bed, Bath, Star, Shield, Key, Calendar, Sparkles } from "lucide-react";
import { useSEO, useSEOSettings, generateOrganizationSchema, generateLodgingBusinessSchema, generateBreadcrumbSchema, generateReviewsSchema, type SiteInfoSettings } from "@/lib/seo-utils";
import type { PublicProperty } from "@shared/schema";

export default function StayPage() {
  const { data: property, isLoading } = useQuery<PublicProperty>({
    queryKey: ["/api/property/public"],
  });

  // Get reviews for structured data
  const { data: reviews = [] } = useQuery<any[]>({
    queryKey: ["/api/reviews/public"],
  });

  // Get SEO settings for schema generation
  const { seoSettings } = useSEOSettings();

  // Get site settings for dynamic schema content
  const { data: siteSettings } = useQuery<SiteInfoSettings>({
    queryKey: ['/api/settings/site_info'],
    retry: false,
  });

  // SEO implementation for stay page using database-driven content
  useSEO({
    pageType: "stay",
    title: property?.title ? `${property.title} | Vacation Rental Details` : undefined, // Let pageType handle default
    keywords: "Oahu beach house rental, Beach House Oahu vacation rental Hawaii, oceanfront property, Hawaiian beachfront rental, family vacation rental, group accommodation Oahu",
    ogType: "place",
    twitterCard: "summary_large_image",
    canonical: "https://vacationrentaloahu.co/stay",
    structuredData: seoSettings ? [
      generateOrganizationSchema(seoSettings, siteSettings),
      generateLodgingBusinessSchema(property, seoSettings, siteSettings),
      ...generateReviewsSchema(reviews, property, seoSettings),
      generateBreadcrumbSchema([
        { name: "Home", url: "/" },
        { name: "Property Details", url: "/stay" }
      ])
    ] : []
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-28 pb-16">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-8">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-24 w-full" />
                <div className="grid grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              </div>
              <div>
                <Skeleton className="h-96 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main id="main-content" className="pt-28">
        {/* Property Header - Airbnb Style */}
        <header className="pt-6 pb-4">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h1 className="text-luxury-3xl md:text-luxury-4xl font-serif font-normal text-foreground mb-4 leading-tight tracking-luxury-tight" data-testid="property-title">
                {property?.title || "Beach House Ocean View Vacation Rental"}
              </h1>
              
              <div className="flex flex-wrap items-center gap-3 text-luxury-sm">
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                  <span className="font-serif font-normal mr-1" data-testid="property-rating">
                    {property?.rating ? property.rating : 'New'}
                  </span>
                  <span className="text-muted-foreground">
                    {property?.review_count ? `(${property.review_count} reviews)` : ''}
                  </span>
                </div>
                <span className="text-muted-foreground">•</span>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 text-xs">
                  Superhost
                </Badge>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground underline" data-testid="property-location">
                  {property?.general_location || "Honolulu, Hawaii"}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Photo Gallery */}
        <PhotoGallery />

        {/* Main Content - Airbnb Style Layout */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
                <div className="lg:col-span-2">
                  {/* Property Overview */}
                  <div className="mb-10">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-luxury-2xl font-serif font-normal text-foreground mb-2 tracking-luxury-tight">
                          Entire beach house
                        </h2>
                        <div className="flex items-center space-x-4 text-muted-foreground">
                          <span data-testid="property-guests-overview">
                            {property?.max_guests || '8'} guests
                          </span>
                          <span>•</span>
                          <span data-testid="property-bedrooms-overview">
                            {property?.bedrooms || '4'} bedrooms
                          </span>
                          <span>•</span>
                          <span data-testid="property-bathrooms-overview">
                            {property?.bathrooms || '3'} bathrooms
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Key Features - Airbnb Style */}
                  <div className="space-y-4 mb-10 pb-10 border-b border-border">
                    <div className="flex items-start space-x-4">
                      <div className="w-6 h-6 bg-coral-100 rounded-lg flex items-center justify-center mt-1 flex-shrink-0">
                        <Shield className="h-4 w-4 text-coral-600" />
                      </div>
                      <div>
                        <h3 className="font-serif font-normal text-foreground mb-1">Entire beach house</h3>
                        <p className="text-muted-foreground text-luxury-sm">
                          You'll have the entire Beach House Oahu property to yourself with beach access and premium amenities.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center mt-1 flex-shrink-0">
                        <Sparkles className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-serif font-normal text-foreground mb-1">Enhanced Clean</h3>
                        <p className="text-muted-foreground text-luxury-sm">
                          Professional 5-step enhanced cleaning process for your safety.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="w-6 h-6 bg-ocean-100 rounded-lg flex items-center justify-center mt-1 flex-shrink-0">
                        <Key className="h-4 w-4 text-ocean-600" />
                      </div>
                      <div>
                        <h3 className="font-serif font-normal text-foreground mb-1">Self check-in</h3>
                        <p className="text-muted-foreground text-luxury-sm">
                          Check yourself in with the smart lock and start your vacation immediately.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="w-6 h-6 bg-coral-100 rounded-lg flex items-center justify-center mt-1 flex-shrink-0">
                        <Calendar className="h-4 w-4 text-coral-600" />
                      </div>
                      <div>
                        <h3 className="font-serif font-normal text-foreground mb-1">Free cancellation</h3>
                        <p className="text-muted-foreground text-luxury-sm">
                          Get a full refund if you cancel by 48 hours before check-in.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-10 pb-10 border-b border-border">
                    <h2 className="text-luxury-2xl font-serif font-normal text-foreground mb-6 tracking-luxury-tight">About this place</h2>
                    <div className="space-y-4 text-muted-foreground leading-relaxed" data-testid="property-description">
                      {property?.description ? (
                        <div dangerouslySetInnerHTML={{ __html: property.description }} />
                      ) : (
                        <>
                          <p>
                            Escape to our stunning Beach House Oahu property perched on the pristine shores of Oahu's most exclusive coastline. 
                            This architectural masterpiece seamlessly blends modern elegance with authentic Hawaiian charm, offering 
                            an unparalleled vacation experience for up to 8 guests.
                          </p>
                          <p>
                            Wake up to breathtaking ocean views from every bedroom, enjoy the spacious outdoor living areas, 
                            or stroll down to your own stretch of white sand beach. The Beach House features four spacious bedrooms, each with 
                            en-suite bathrooms, a gourmet kitchen with premium appliances, and expansive outdoor living spaces perfect 
                            for entertaining.
                          </p>
                          <p>
                            Located just minutes from world-class dining, shopping, and adventure activities, yet secluded enough to 
                            provide complete privacy and tranquility. This is more than accommodation – it's your gateway to the 
                            ultimate Hawaiian experience.
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* House Rules */}
                  <div className="mb-10">
                    <h2 className="text-luxury-2xl font-serif font-normal text-foreground mb-6 tracking-luxury-tight">House rules</h2>
                    <div className="grid md:grid-cols-3 gap-6 mb-6">
                      <div>
                        <h3 className="font-serif font-normal text-foreground mb-2">Check-in</h3>
                        {property?.check_in_time ? (
                          <p className="text-muted-foreground">After {property.check_in_time}</p>
                        ) : (
                          <p className="text-muted-foreground">After 4:00 PM</p>
                        )}
                      </div>
                      <div>
                        <h3 className="font-serif font-normal text-foreground mb-2">Check-out</h3>
                        {property?.check_out_time ? (
                          <p className="text-muted-foreground">Before {property.check_out_time}</p>
                        ) : (
                          <p className="text-muted-foreground">Before 11:00 AM</p>
                        )}
                      </div>
                      <div>
                        <h3 className="font-serif font-normal text-foreground mb-2">Maximum guests</h3>
                        {property?.max_guests ? (
                          <p className="text-muted-foreground">{property.max_guests} guests</p>
                        ) : (
                          <p className="text-muted-foreground">8 guests</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-muted-foreground text-luxury-sm">
                      <p>• No smoking anywhere on the property</p>
                      <p>• No events or parties</p>
                      <p>• Pets allowed with prior approval</p>
                      <p>• Quiet hours from 10:00 PM to 8:00 AM</p>
                    </div>
                  </div>
                </div>

                {/* Booking Widget - Airbnb Style Positioning */}
                <div className="lg:col-span-1">
                  <div className="sticky top-28 z-20" data-testid="booking-widget-container">
                    <BookingWidget />
                    
                    <div className="mt-6 p-4 bg-muted/50 rounded-lg text-center">
                      <p className="text-luxury-sm text-muted-foreground mb-2">
                        Questions about the property?
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        data-testid="contact-host-button"
                        onClick={() => window.location.href = '/contact'}
                      >
                        Contact Host
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Amenities */}
        <AirbnbStyleAmenities />

        {/* Location */}
        <LocationMap />

        {/* Reviews */}
        <ReviewsSection />
      </main>

      <Footer />
    </div>
  );
}
