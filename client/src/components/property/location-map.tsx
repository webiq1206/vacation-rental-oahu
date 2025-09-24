import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, Circle } from "react-leaflet";
import L from "leaflet";
import { MapPin, Plane, Car, UtensilsCrossed, Mountain, ShoppingBag, Loader2, AlertCircle, Waves } from "lucide-react";
import type { PublicProperty, NearbyAttraction } from "@shared/schema";
import { AttractionLightbox } from "./attraction-lightbox";
import { useAuth } from "@/hooks/use-auth";

// Color validation function to prevent XSS attacks
function sanitizeColor(color: string): string {
  // Whitelist hex colors (3 or 6 digits)
  const hexColorRegex = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/;
  
  // Whitelist HSL colors
  const hslColorRegex = /^hsl\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*\)$/;
  
  // Whitelist HSLA colors
  const hslaColorRegex = /^hsla\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*,\s*(?:0|1|0?\.\d+)\s*\)$/;
  
  // Whitelist RGB colors
  const rgbColorRegex = /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/;
  
  // Whitelist RGBA colors
  const rgbaColorRegex = /^rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(?:0|1|0?\.\d+)\s*\)$/;
  
  // Whitelist CSS named colors (common safe ones)
  const namedColors = [
    'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown',
    'black', 'white', 'gray', 'grey', 'cyan', 'magenta', 'lime', 'navy',
    'teal', 'silver', 'maroon', 'olive', 'aqua', 'fuchsia'
  ];
  
  if (!color || typeof color !== 'string') {
    return '#666666'; // Default safe color
  }
  
  const trimmedColor = color.trim().toLowerCase();
  
  if (hexColorRegex.test(trimmedColor) || 
      hslColorRegex.test(trimmedColor) || 
      hslaColorRegex.test(trimmedColor) ||
      rgbColorRegex.test(trimmedColor) ||
      rgbaColorRegex.test(trimmedColor) ||
      namedColors.includes(trimmedColor)) {
    return trimmedColor;
  }
  
  // If color doesn't match any safe format, return default
  return '#666666';
}

// Create custom property marker icon
const createPropertyMarkerIcon = () => {
  return L.divIcon({
    html: `
      <div class="custom-property-marker">
        <div class="marker-pulse"></div>
        <div class="marker-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="currentColor"/>
            <circle cx="12" cy="10" r="3" fill="white"/>
          </svg>
        </div>
      </div>
    `,
    className: 'custom-marker-wrapper',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
};

// Create custom attraction marker icon
const createAttractionMarkerIcon = (color: string) => {
  const safeColor = sanitizeColor(color);
  return L.divIcon({
    html: `
      <div class="custom-attraction-marker" style="color: ${safeColor}">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="currentColor"/>
          <circle cx="12" cy="10" r="2" fill="white"/>
        </svg>
      </div>
    `,
    className: 'custom-attraction-wrapper',
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24]
  });
};

export function LocationMap() {
  const [mapError, setMapError] = useState<string | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [selectedAttraction, setSelectedAttraction] = useState<NearbyAttraction | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const { user } = useAuth();

  // Get property details from public API
  const { data: property } = useQuery<PublicProperty>({
    queryKey: ["/api/property/public"],
  });

  // Try to get exact coordinates if user has confirmed booking
  const { data: exactCoordinates } = useQuery<{ lat: string; lng: string } | null>({
    queryKey: ["/api/property/coordinates"],
    enabled: !!user, // Only try if user is authenticated
    retry: false, // Don't retry on 403 errors
  });

  // Get nearby attractions from API
  const { data: nearbyAttractions = [] } = useQuery<NearbyAttraction[]>({
    queryKey: ["/api/nearby-attractions"],
  });

  // Use exact coordinates if available, otherwise use approximate coordinates
  // For now, using hardcoded approximate coordinates for the radius area
  const APPROXIMATE_COORDINATES: [number, number] = [21.5136, -157.8401]; // Close to actual location
  const PROPERTY_COORDINATES: [number, number] | null = exactCoordinates 
    ? [parseFloat(exactCoordinates.lat), parseFloat(exactCoordinates.lng)]
    : APPROXIMATE_COORDINATES;

  const hasExactLocation = !!exactCoordinates;
  const hasValidCoordinates = !!PROPERTY_COORDINATES;


  // Helper function to get icon based on category
  function getAttractionIcon(category: string) {
    switch (category) {
      case 'attraction':
        return <Mountain className="h-5 w-5" />;
      case 'restaurant':
        return <UtensilsCrossed className="h-5 w-5" />;
      case 'beach':
        return <Waves className="h-5 w-5" />;
      case 'transportation':
        return <Plane className="h-5 w-5" />;
      case 'shopping':
        return <ShoppingBag className="h-5 w-5" />;
      default:
        return <MapPin className="h-5 w-5" />;
    }
  }

  // Handle attraction click to open lightbox
  const handleAttractionClick = (attraction: NearbyAttraction) => {
    setSelectedAttraction(attraction);
    setIsLightboxOpen(true);
  };

  // Handle lightbox close
  const handleLightboxClose = () => {
    setIsLightboxOpen(false);
    setSelectedAttraction(null);
  };

  useEffect(() => {
    // Add custom marker styles to the document
    const style = document.createElement('style');
    style.textContent = `
      .custom-property-marker {
        position: relative;
        color: hsl(43 65% 49%);
        filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
      }
      
      .marker-pulse {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 60px;
        height: 60px;
        background: hsl(43 65% 49%);
        border-radius: 50%;
        opacity: 0.3;
        animation: pulse 2s infinite;
      }
      
      .marker-icon {
        position: relative;
        z-index: 10;
        transition: transform 0.2s ease;
      }
      
      .custom-property-marker:hover .marker-icon {
        transform: scale(1.1);
      }
      
      .custom-attraction-marker {
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
        transition: transform 0.2s ease;
      }
      
      .custom-attraction-marker:hover {
        transform: scale(1.1);
      }
      
      @keyframes pulse {
        0% {
          opacity: 0.3;
          transform: translate(-50%, -50%) scale(0.8);
        }
        50% {
          opacity: 0.1;
          transform: translate(-50%, -50%) scale(1.2);
        }
        100% {
          opacity: 0.3;
          transform: translate(-50%, -50%) scale(0.8);
        }
      }
      
      .leaflet-container {
        border-radius: 12px;
        overflow: hidden;
      }
      
      .leaflet-popup-content-wrapper {
        border-radius: 8px;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
      }
      
      .leaflet-popup-content {
        margin: 16px;
        font-family: var(--font-sans);
      }
      
      .leaflet-control-zoom {
        border: none !important;
        border-radius: 8px !important;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
      }
      
      .leaflet-control-zoom a {
        background: white !important;
        color: hsl(195 100% 15%) !important;
        border: none !important;
        font-weight: 600;
        transition: all 0.2s ease;
      }
      
      .leaflet-control-zoom a:hover {
        background: hsl(43 65% 49%) !important;
        color: white !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleMapLoad = () => {
    setIsMapLoaded(true);
  };

  const handleMapError = (error: any) => {
    console.error('Map loading error:', error);
    setMapError('Failed to load map. Please check your internet connection.');
  };

  return (
    <section id="location" className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-luxury-3xl md:text-luxury-4xl font-serif font-normal text-foreground mb-4 tracking-luxury-tight">
              Where you'll be
            </h2>
            <p className="text-lg text-muted-foreground">
              Prime oceanfront location on Oahu's exclusive south shore
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Interactive Map */}
            <div className="order-2 lg:order-1">
              <Card className="overflow-hidden">
                <div className="relative" data-testid="location-map">
                  {/* Loading State */}
                  {!isMapLoaded && !mapError && (
                    <div className="absolute inset-0 z-20 bg-gradient-to-br from-ocean-100 to-emerald-100 h-[500px] md:h-[600px] flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 text-coral-500 animate-spin mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">Loading Interactive Map</h3>
                        <p className="text-muted-foreground">Preparing your luxury oceanfront location</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Error State */}
                  {mapError && (
                    <div className="bg-gradient-to-br from-ocean-100 to-emerald-100 h-[500px] md:h-[600px] flex items-center justify-center">
                      <div className="text-center">
                        <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">Map Unavailable</h3>
                        <p className="text-muted-foreground mb-4">{mapError}</p>
                        <Button 
                          onClick={() => {
                            setMapError(null);
                            setIsMapLoaded(false);
                          }}
                          variant="outline"
                          size="sm"
                        >
                          Try Again
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* No Coordinates Available */}
                  {!mapError && !hasValidCoordinates && (
                    <div className="bg-gradient-to-br from-ocean-100 to-emerald-100 h-[500px] md:h-[600px] flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">Location Not Set</h3>
                        <p className="text-muted-foreground">Property coordinates haven't been configured yet.</p>
                      </div>
                    </div>
                  )}

                  {/* Interactive Leaflet Map */}
                  {!mapError && hasValidCoordinates && PROPERTY_COORDINATES && (
                    <div className="h-[500px] md:h-[600px]">
                      <MapContainer
                        center={PROPERTY_COORDINATES}
                        zoom={14}
                        className="w-full h-full z-10"
                        zoomControl={false}
                        whenReady={handleMapLoad}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        
                        <ZoomControl position="topright" />
                        
                        {hasExactLocation ? (
                          /* Exact Property Location - For Confirmed Guests */
                          <Marker
                            position={PROPERTY_COORDINATES}
                            icon={createPropertyMarkerIcon()}
                          >
                            <Popup className="custom-popup">
                              <div className="p-2">
                                <h3 className="font-semibold text-lg mb-2">{property?.title || 'Property'}</h3>
                                <p className="text-sm text-muted-foreground mb-2">{property?.general_location}</p>
                                <div className="space-y-1 text-sm">
                                  <p>🏖️ Luxury vacation rental</p>
                                  <p>🌺 Beautiful location</p>
                                  <p>📍 Exact location</p>
                                  <p className="text-bronze-600 font-semibold">Available to confirmed guests</p>
                                </div>
                              </div>
                            </Popup>
                          </Marker>
                        ) : (
                          /* General Area - 1 Mile Radius for Public View */
                          <Circle
                            center={PROPERTY_COORDINATES}
                            radius={1609.34} // 1 mile in meters
                            pathOptions={{
                              color: 'hsl(43 65% 49%)', // Bronze color matching the luxury theme
                              fillColor: 'hsl(43 65% 49%)',
                              fillOpacity: 0.2,
                              weight: 3,
                            }}
                          >
                            <Popup className="custom-popup">
                              <div className="p-2">
                                <h3 className="font-semibold text-lg mb-2">{property?.title || 'Property'}</h3>
                                <p className="text-sm text-muted-foreground mb-2">{property?.general_location}</p>
                                <div className="space-y-1 text-sm">
                                  <p>🏖️ Luxury vacation rental</p>
                                  <p>🌺 Beautiful location</p>
                                  <p>📍 General area (1-mile radius)</p>
                                  {user ? (
                                    <p className="text-muted-foreground text-xs">Exact location shown after booking confirmation</p>
                                  ) : (
                                    <p className="text-muted-foreground text-xs">Exact location shown to confirmed guests</p>
                                  )}
                                </div>
                              </div>
                            </Popup>
                          </Circle>
                        )}
                        
                        {/* Nearby Attraction Markers */}
                        {nearbyAttractions.map((attraction, index) => (
                          <Marker
                            key={attraction.id}
                            position={[parseFloat(attraction.lat), parseFloat(attraction.lng)]}
                            icon={createAttractionMarkerIcon(attraction.color)}
                            eventHandlers={{
                              click: () => handleAttractionClick(attraction),
                            }}
                          >
                            <Popup>
                              <div className="p-2">
                                <h4 className="font-semibold mb-1">{attraction.name}</h4>
                                <p className="text-sm text-muted-foreground">{attraction.distance || "N/A"} from property</p>
                                {attraction.description && (
                                  <p className="text-xs text-muted-foreground mt-1">{attraction.description}</p>
                                )}
                                <Button
                                  size="sm"
                                  className="mt-2 w-full"
                                  onClick={() => handleAttractionClick(attraction)}
                                  data-testid={`view-details-${attraction.name.toLowerCase().replace(/\s+/g, '-')}`}
                                >
                                  View Details
                                </Button>
                              </div>
                            </Popup>
                          </Marker>
                        ))}
                      </MapContainer>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Location Details */}
            <div className="order-1 lg:order-2 space-y-6">
              <div>
                <h3 className="text-luxury-2xl font-serif font-normal text-foreground mb-4 tracking-luxury-tight">Kaneohe, Hawaii</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Located directly across from world-famous Kualoa Ranch on Oahu's stunning windward coast. 
                  This oceanfront location offers incredible views of Chinaman's Hat Island and puts you 
                  just steps away from movie filming locations, pristine beaches, and authentic Hawaiian culture.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-foreground mb-4">Nearby Attractions</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {nearbyAttractions.length > 0 ? (
                    nearbyAttractions.map((attraction) => (
                      <button 
                        key={attraction.id}
                        onClick={() => handleAttractionClick(attraction)}
                        className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer text-left"
                        data-testid={`attraction-${attraction.name.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <div className="flex-shrink-0">
                          {getAttractionIcon(attraction.category)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {attraction.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {attraction.distance || "N/A"}
                          </p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-8">
                      <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No nearby attractions configured</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-tropical-gradient p-6 rounded-2xl text-white">
                <h4 className="font-semibold mb-3">Perfect Location</h4>
                <ul className="text-white/90 text-sm space-y-2">
                  <li>• Direct ocean views of Chinaman's Hat Island</li>
                  <li>• 1-minute walk to Kualoa Ranch (Jurassic Park filming site)</li>
                  <li>• Secluded windward coast location</li>
                  <li>• Gateway to North Shore and cultural attractions</li>
                </ul>
              </div>

              <Button 
                className="btn-bronze font-semibold py-3 px-8 rounded-lg w-full sm:w-auto"
                data-testid="explore-area-button"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Explore the area
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Attraction Lightbox */}
      <AttractionLightbox
        attraction={selectedAttraction}
        isOpen={isLightboxOpen}
        onClose={handleLightboxClose}
      />
    </section>
  );
}
