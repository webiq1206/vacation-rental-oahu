import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BookingWidget } from "@/components/booking/booking-widget";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Star, Users, Bed, Bath, Wifi, Car, Waves, UtensilsCrossed } from "lucide-react";
import { useSEO, useSEOSettings, generateOrganizationSchema, generateProductSchema, generateBreadcrumbSchema, type SiteInfoSettings } from "@/lib/seo-utils";
import type { PublicProperty, Amenity } from "@shared/schema";

export default function BookingPage() {
  const { data: property, isLoading } = useQuery<PublicProperty>({
    queryKey: ["/api/property/public"],
  });

  const { data: amenities = [] } = useQuery<Amenity[]>({
    queryKey: ["/api/amenities"],
  });

  // Get pricing data for structured data
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const dayAfter = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const { data: pricing } = useQuery({
    queryKey: [`/api/quote?start=${tomorrow}&end=${dayAfter}&guests=2`],
    enabled: true,
    retry: false,
  });

  // Get SEO settings for schema generation
  const { seoSettings } = useSEOSettings();

  // Get page-specific settings for dynamic content
  const { data: pageSettings } = useQuery<{ page_title?: string; page_description?: string }>({
    queryKey: ['/api/settings/booking_page'],
    retry: false,
  });

  // Get site settings for dynamic schema content
  const { data: siteSettings } = useQuery<SiteInfoSettings>({
    queryKey: ['/api/settings/site_info'],
    retry: false,
  });

  // SEO implementation for booking page using database-driven content
  useSEO({
    pageType: "booking",
    title: property?.title ? `Book ${property.title}` : undefined, // Let pageType handle default
    ogType: "product",
    twitterCard: "summary_large_image",
    // canonical and keywords will be handled dynamically by SEO settings
    structuredData: seoSettings ? [
      generateOrganizationSchema(seoSettings, siteSettings),
      generateProductSchema(property, pricing, seoSettings),
      generateBreadcrumbSchema([
        { name: "Home", url: "/" },
        { name: "Property Details", url: "/stay" },
        { name: pageSettings?.page_title || seoSettings?.page_titles?.booking || "Book Your Stay", url: "/booking" }
      ])
    ] : []
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-28 pb-16">
          <div className="container mx-auto px-4">
            <Skeleton className="h-8 w-1/3 mb-8" />
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Skeleton className="h-64 w-full" />
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

  // Get featured amenities or fall back to all amenities if none are marked as featured
  const featuredAmenities = (amenities as Amenity[]).filter(a => a.featured);
  const displayAmenities = featuredAmenities.length > 0 ? featuredAmenities : (amenities as Amenity[]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main id="main-content" className="pt-28 pb-16">
        <div className="container mx-auto mobile-container-padding px-4">
          <div className="mb-6 md:mb-8">
            <h1 className="text-luxury-2xl sm:text-luxury-3xl md:text-luxury-4xl font-serif font-normal text-foreground mb-4 md:mb-6 leading-tight tracking-luxury-tight mobile-heading-scale">
              {pageSettings?.page_title || seoSettings?.page_titles?.booking || (siteSettings?.site_name ? `Book ${siteSettings.site_name}` : 'Book Your Stay')}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground mobile-text-scale">
              {pageSettings?.page_description || seoSettings?.meta_descriptions?.booking || 'Complete your reservation for this property.'}
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Property Summary */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Property Overview */}
              <Card className="mobile-card-spacing">
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span className="text-lg sm:text-xl mobile-text-scale">
                      {property?.title ? property.title : (
                        <span className="text-muted-foreground italic">Property title not available</span>
                      )}
                    </span>
                    {property?.rating && (
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                        <span className="text-sm font-serif font-normal">{property.rating}</span>
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                    {property?.max_guests && (
                      <div className="flex items-center text-muted-foreground mobile-text-scale">
                        <Users className="h-4 w-4 mr-2" />
                        <span className="text-sm">{property.max_guests} guests</span>
                      </div>
                    )}
                    {property?.bedrooms && (
                      <div className="flex items-center text-muted-foreground mobile-text-scale">
                        <Bed className="h-4 w-4 mr-2" />
                        <span className="text-sm">{property.bedrooms} bedrooms</span>
                      </div>
                    )}
                    {property?.bathrooms && (
                      <div className="flex items-center text-muted-foreground mobile-text-scale">
                        <Bath className="h-4 w-4 mr-2" />
                        <span className="text-sm">{property.bathrooms} bathrooms</span>
                      </div>
                    )}
                    {property?.is_superhost && (
                      <div>
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 text-xs">
                          Superhost
                        </Badge>
                      </div>
                    )}
                  </div>

                  {property?.marketing_description ? (
                    <p className="text-muted-foreground text-sm mobile-text-scale leading-relaxed">
                      {property.marketing_description}
                    </p>
                  ) : property?.description ? (
                    <p className="text-muted-foreground text-sm mobile-text-scale leading-relaxed">
                      {property.description}
                    </p>
                  ) : (
                    <p className="text-muted-foreground text-sm mobile-text-scale leading-relaxed italic">
                      Property description not available. Please add through the admin panel.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Featured Amenities */}
              <Card className="mobile-card-spacing">
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="text-lg sm:text-xl mobile-text-scale">What this place offers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {displayAmenities.length > 0 ? (
                      displayAmenities.map((amenity: Amenity) => {
                        const getIcon = (iconName: string) => {
                          const iconMap: { [key: string]: React.ElementType } = {
                            'wifi': Wifi,
                            'car': Car,
                            'waves': Waves,
                            'utensils': UtensilsCrossed,
                          };
                          const IconComponent = iconMap[iconName] || Wifi;
                          return <IconComponent className="h-5 w-5 text-secondary" />;
                        };

                        return (
                          <div key={amenity.id} className="flex items-center space-x-3 mobile-amenity-card">
                            {getIcon(amenity.icon)}
                            <span className="text-sm text-foreground mobile-text-scale">{amenity.name}</span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-sm text-muted-foreground text-center py-4">
                        No amenities available. Please add amenities through the admin panel.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Booking Policies */}
              <Card>
                <CardHeader>
                  <CardTitle>Good to know</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(property?.check_in_time || property?.check_out_time || property?.max_guests) && (
                    <>
                      <div>
                        <h4 className="font-serif font-normal text-foreground mb-2">House rules</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {property?.check_in_time && (
                            <li>Check-in: {property.check_in_time} or later</li>
                          )}
                          {property?.check_out_time && (
                            <li>Check-out: {property.check_out_time}</li>
                          )}
                          {property?.max_guests && (
                            <li>Maximum {property.max_guests} guests</li>
                          )}
                        </ul>
                      </div>
                      <Separator />
                    </>
                  )}
                  
                  <div className="text-sm text-muted-foreground text-center py-8 italic">
                    Property policies and additional information can be managed through the admin panel.
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Booking Widget */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <div className="mobile-booking-widget lg:p-0">
                  <BookingWidget />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
