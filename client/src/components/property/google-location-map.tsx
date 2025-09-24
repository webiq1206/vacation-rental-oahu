import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Plane, Car, UtensilsCrossed, Mountain, ShoppingBag, Loader2, AlertCircle, Waves } from "lucide-react";
import type { PublicProperty, NearbyAttraction } from "@shared/schema";
import { AttractionLightbox } from "./attraction-lightbox";
import { useAuth } from "@/hooks/use-auth";
import { Loader } from "@googlemaps/js-api-loader";

// Google Maps configuration
const GOOGLE_MAPS_CONFIG = {
  apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  version: "weekly",
  libraries: ["places", "geometry"],
};

// Property coordinates - 49-541 Kamehameha Hwy, Kaneohe, HI 96744
const PROPERTY_COORDINATES = { lat: 21.51360, lng: -157.83760 };

// Icon mapping for different attraction types
const getAttractionIcon = (category: string) => {
  const iconMap: { [key: string]: any } = {
    'restaurant': UtensilsCrossed,
    'food': UtensilsCrossed,
    'attraction': Mountain,
    'shopping': ShoppingBag,
    'beach': Waves,
    'transportation': Car,
    'airport': Plane,
    'default': MapPin
  };
  
  const normalizedCategory = category.toLowerCase();
  return iconMap[normalizedCategory] || iconMap.default;
};

interface GoogleLocationMapProps {
  className?: string;
}

export function GoogleLocationMap({ className = "" }: GoogleLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedAttraction, setSelectedAttraction] = useState<NearbyAttraction | null>(null);
  
  const { user } = useAuth();
  const hasExactLocation = Boolean(user);

  // Fetch property data
  const { data: property, isLoading: propertyLoading } = useQuery<PublicProperty>({
    queryKey: ["/api/property/public"],
  });

  // Fetch nearby attractions
  const { data: attractions = [], isLoading: attractionsLoading } = useQuery<NearbyAttraction[]>({
    queryKey: ["/api/nearby-attractions"],
  });

  // Initialize Google Maps
  const initializeMap = useCallback(async () => {
    if (!mapRef.current || !GOOGLE_MAPS_CONFIG.apiKey) {
      setMapError("Google Maps API key not configured");
      return;
    }

    try {
      const loader = new Loader({
        ...GOOGLE_MAPS_CONFIG,
        libraries: GOOGLE_MAPS_CONFIG.libraries as any
      });
      await loader.load();

      const mapOptions: any = {
        center: PROPERTY_COORDINATES,
        zoom: hasExactLocation ? 16 : 14,
        mapTypeId: 'roadmap',
        styles: [
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#a2daf2" }]
          },
          {
            featureType: "landscape.man_made",
            elementType: "geometry",
            stylers: [{ color: "#f7f1df" }]
          },
          {
            featureType: "landscape.natural",
            elementType: "geometry",
            stylers: [{ color: "#d0e3b4" }]
          },
          {
            featureType: "road",
            elementType: "geometry.stroke",
            stylers: [{ color: "#b4b0a3" }]
          },
          {
            featureType: "poi.park",
            elementType: "geometry",
            stylers: [{ color: "#bde6ab" }]
          },
          {
            featureType: "poi",
            elementType: "labels.text.fill",
            stylers: [{ color: "#6b9a76" }]
          }
        ],
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: true,
        streetViewControl: true,
        rotateControl: false,
        fullscreenControl: true,
        gestureHandling: 'cooperative'
      };

      const map = new (window as any).google.maps.Map(mapRef.current, mapOptions);
      googleMapRef.current = map;

      // Add property marker - use legacy Marker for compatibility
      if (hasExactLocation) {
        new (window as any).google.maps.Marker({
          position: PROPERTY_COORDINATES,
          map: map,
          title: property?.title || "Beach House Oahu",
          icon: {
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="18" fill="#B8864B" stroke="white" stroke-width="2"/>
                <circle cx="20" cy="20" r="8" fill="white"/>
                <path d="M20 12l4 8h-8l4-8z" fill="#B8864B"/>
              </svg>
            `)}`,
            scaledSize: new (window as any).google.maps.Size(40, 40),
            anchor: new (window as any).google.maps.Point(20, 20)
          }
        });
      } else {
        // General area circle for privacy
        new (window as any).google.maps.Circle({
          strokeColor: "#B8864B",
          strokeOpacity: 0.8,
          strokeWeight: 3,
          fillColor: "#B8864B",
          fillOpacity: 0.2,
          map: map,
          center: PROPERTY_COORDINATES,
          radius: 1000, // 1km radius
        });
      }

      // Add attraction markers using legacy Marker for compatibility
      attractions.forEach((attraction) => {
        if (attraction.lat && attraction.lng) {
          const marker = new (window as any).google.maps.Marker({
            position: { lat: parseFloat(attraction.lat), lng: parseFloat(attraction.lng) },
            map: map,
            title: attraction.name,
            icon: {
              url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" fill="${attraction.color || '#6B7280'}" stroke="white" stroke-width="2"/>
                  <circle cx="12" cy="12" r="4" fill="white"/>
                </svg>
              `)}`,
              scaledSize: new (window as any).google.maps.Size(24, 24),
              anchor: new (window as any).google.maps.Point(12, 12)
            }
          });

          const infoWindow = new (window as any).google.maps.InfoWindow({
            content: `
              <div class="p-3 max-w-xs">
                <h3 class="font-semibold text-lg mb-2">${attraction.name}</h3>
                <p class="text-sm text-gray-600 mb-2">${attraction.description || ''}</p>
                ${attraction.distance ? `<p class="text-xs text-gray-500">${attraction.distance}</p>` : ''}
              </div>
            `
          });

          marker.addListener("click", () => {
            infoWindow.open(map, marker);
            setSelectedAttraction(attraction);
          });
        }
      });

      setMapLoaded(true);
      setMapError(null);
    } catch (error) {
      console.error("Google Maps initialization error:", error);
      setMapError("Failed to load Google Maps. Please try again.");
    }
  }, [hasExactLocation, property?.title, attractions]);

  // Initialize map when component mounts
  useEffect(() => {
    initializeMap();
  }, [initializeMap]);

  const handleRetry = () => {
    setMapError(null);
    setMapLoaded(false);
    initializeMap();
  };

  if (!GOOGLE_MAPS_CONFIG.apiKey) {
    return (
      <section className={`bg-gradient-to-br from-stone/30 to-ivory ${className}`}>
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-luxury-3xl md:text-luxury-4xl font-serif font-normal text-foreground mb-4 tracking-luxury-tight">
              Location & Nearby Attractions
            </h2>
            <p className="text-luxury-lg font-serif text-muted-foreground max-w-2xl mx-auto tracking-luxury-tight">
              Explore the stunning location and discover amazing attractions nearby.
            </p>
          </div>

          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-0">
              <div className="bg-gradient-to-br from-stone/30 to-ivory h-[500px] flex items-center justify-center">
                <div className="text-center">
                  <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-luxury-lg font-serif font-normal text-foreground mb-2 tracking-luxury-tight">Google Maps Not Configured</h3>
                  <p className="text-luxury-base font-serif text-muted-foreground tracking-luxury-tight">Google Maps API key is required to display the interactive map.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className={`bg-gradient-to-br from-stone/30 to-ivory ${className}`}>
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-luxury-3xl md:text-luxury-4xl font-serif font-normal text-foreground mb-4 tracking-luxury-tight">
            Location & Nearby Attractions
          </h2>
          <p className="text-luxury-lg font-serif text-muted-foreground max-w-2xl mx-auto tracking-luxury-tight">
            {hasExactLocation 
              ? "Explore the exact location and discover amazing attractions nearby."
              : "Located in a beautiful area of Oahu with easy access to top attractions."
            }
          </p>
        </div>

        <Card className="max-w-4xl mx-auto overflow-hidden">
          <CardContent className="p-0">
            {/* Loading State */}
            {(propertyLoading || attractionsLoading || !mapLoaded) && !mapError && (
              <div className="bg-gradient-to-br from-stone/30 to-ivory h-[500px] md:h-[600px] flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                  <h3 className="text-luxury-lg font-serif font-normal text-foreground mb-2 tracking-luxury-tight">Loading Map</h3>
                  <p className="text-luxury-base font-serif text-muted-foreground tracking-luxury-tight">Preparing your interactive map experience...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {mapError && (
              <div className="bg-gradient-to-br from-stone/30 to-ivory h-[500px] md:h-[600px] flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-6">
                  <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
                  <h3 className="text-luxury-lg font-serif font-normal text-foreground mb-2 tracking-luxury-tight">Unable to Load Map</h3>
                  <p className="text-luxury-base font-serif text-muted-foreground mb-4 tracking-luxury-tight">{mapError}</p>
                  <Button
                    onClick={handleRetry}
                    variant="outline"
                    size="sm"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            )}

            {/* Google Map */}
            <div 
              ref={mapRef}
              className="w-full h-[500px] md:h-[600px]"
              style={{ display: mapError ? 'none' : 'block' }}
            />
          </CardContent>
        </Card>

        {/* Attractions Grid */}
        {attractions.length > 0 && (
          <div className="mt-12">
            <h3 className="text-luxury-2xl font-serif font-normal text-center text-foreground mb-8 tracking-luxury-tight">
              Popular Nearby Attractions
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {attractions.slice(0, 6).map((attraction) => {
                const IconComponent = getAttractionIcon(attraction.category);
                
                return (
                  <Card 
                    key={attraction.id} 
                    className="luxury-card cursor-pointer group transition-all hover:shadow-lg"
                    onClick={() => setSelectedAttraction(attraction)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div 
                          className="p-3 rounded-full flex-shrink-0"
                          style={{ 
                            backgroundColor: `${attraction.color}15`,
                            color: attraction.color
                          }}
                        >
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-luxury-lg font-serif font-normal text-foreground group-hover:text-primary transition-colors tracking-luxury-tight">
                            {attraction.name}
                          </h4>
                          <p className="text-luxury-base font-serif text-muted-foreground mt-1 line-clamp-2 tracking-luxury-tight">
                            {attraction.description}
                          </p>
                          {attraction.distance && (
                            <p className="text-luxury-sm font-serif text-muted-foreground mt-2 tracking-luxury-tight">
                              {attraction.distance}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Attraction Details Modal */}
      {selectedAttraction && (
        <AttractionLightbox
          attraction={selectedAttraction}
          isOpen={Boolean(selectedAttraction)}
          onClose={() => setSelectedAttraction(null)}
        />
      )}
    </section>
  );
}