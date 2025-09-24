import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Star,
  Phone,
  Globe,
  MapPin,
  Clock,
  Tag,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Navigation,
  Mountain,
  UtensilsCrossed,
  Waves,
  Plane,
  ShoppingBag,
  Calendar,
  MessageCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { NearbyAttraction, Property } from "@shared/schema";

interface AttractionLightboxProps {
  attraction: NearbyAttraction | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AttractionLightbox({ attraction, isOpen, onClose }: AttractionLightboxProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { toast } = useToast();

  // Get property coordinates for directions
  const { data: propertyCoords } = useQuery<{lat: number; lng: number; general_location: string}>({
    queryKey: ["/api/property/directions-coordinates"],
  });

  if (!attraction) return null;

  // Prepare gallery images - main image plus gallery images
  const allImages = [
    ...(attraction.image_url ? [attraction.image_url] : []),
    ...(attraction.gallery_images || []),
  ].filter(Boolean);

  const hasMultipleImages = allImages.length > 1;

  // Get category icon with bronze styling
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'attraction':
        return <Mountain className="h-5 w-5 text-bronze-700" />;
      case 'restaurant':
        return <UtensilsCrossed className="h-5 w-5 text-bronze-700" />;
      case 'beach':
        return <Waves className="h-5 w-5 text-bronze-700" />;
      case 'transportation':
        return <Plane className="h-5 w-5 text-bronze-700" />;
      case 'shopping':
        return <ShoppingBag className="h-5 w-5 text-bronze-700" />;
      default:
        return <MapPin className="h-5 w-5 text-bronze-700" />;
    }
  };

  // Navigate gallery
  const goToPrevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? allImages.length - 1 : prev - 1
    );
  };

  const goToNextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === allImages.length - 1 ? 0 : prev + 1
    );
  };

  // Handle Google Maps directions
  const handleGetDirections = () => {
    if (!propertyCoords?.lat || !propertyCoords?.lng) {
      toast({
        title: "Location Unavailable",
        description: "Property location not available for directions. Please contact us for assistance.",
        variant: "destructive",
      });
      return;
    }

    // Check if we have either coordinates or address for the destination
    const hasDestinationCoords = attraction.lat && attraction.lng;
    const hasDestinationAddress = attraction.address && attraction.address.trim();

    if (!hasDestinationCoords && !hasDestinationAddress) {
      toast({
        title: "Destination Unavailable", 
        description: "This attraction's location is not available for directions.",
        variant: "destructive",
      });
      return;
    }

    try {
      const origin = `${propertyCoords.lat},${propertyCoords.lng}`;
      const destination = attraction.address || `${attraction.lat},${attraction.lng}`;
      const url = `https://www.google.com/maps/dir/${encodeURIComponent(origin)}/${encodeURIComponent(destination)}`;
      
      // Success feedback
      toast({
        title: "Opening Directions",
        description: `Getting directions to ${attraction.name}...`,
      });
      
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      toast({
        title: "Error Opening Directions",
        description: "Unable to open directions. Please try again later.",
        variant: "destructive",
      });
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 luxury-card-border"
        data-testid="attraction-lightbox"
      >
        <div className="relative">
          {/* Image Gallery Section */}
          {allImages.length > 0 && (
            <div className="relative h-64 md:h-80 overflow-hidden">
              <img
                src={allImages[currentImageIndex]}
                alt={attraction.name}
                className="w-full h-full object-cover"
                data-testid="attraction-main-image"
              />
              
              {/* Gallery Navigation */}
              {hasMultipleImages && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-bronze-700/80 text-white transition-all duration-300"
                    onClick={goToPrevImage}
                    data-testid="gallery-prev-button"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-bronze-700/80 text-white transition-all duration-300"
                    onClick={goToNextImage}
                    data-testid="gallery-next-button"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                  
                  {/* Image Counter */}
                  <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-luxury-sm font-serif font-normal tracking-luxury-tight">
                    {currentImageIndex + 1} / {allImages.length}
                  </div>
                </>
              )}
              
              {/* Category Badge */}
              <Badge 
                className="absolute top-2 left-2 bg-white/90 text-bronze-700 hover:bg-white font-serif font-normal tracking-luxury-tight"
                data-testid="attraction-category"
              >
                <span className="mr-1">{getCategoryIcon(attraction.category)}</span>
                {attraction.category.charAt(0).toUpperCase() + attraction.category.slice(1)}
              </Badge>
            </div>
          )}

          {/* Content Section */}
          <div className="p-6">
            {/* Header */}
            <DialogHeader className="mb-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <DialogTitle className="text-luxury-4xl font-serif font-normal tracking-luxury-tight mb-2" data-testid="attraction-name">
                    {attraction.name}
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    Detailed information about {attraction.name} including images, description, hours, and directions.
                  </DialogDescription>
                  
                  {/* Rating and Reviews */}
                  <div className="flex items-center gap-4 mb-2">
                    {attraction.rating && (
                      <div className="flex items-center gap-1" data-testid="attraction-rating">
                        <Star className="h-4 w-4 fill-bronze-600 text-bronze-600" />
                        <span className="font-serif font-normal tracking-luxury-tight text-luxury-base">{attraction.rating}</span>
                        {attraction.reviews_count && attraction.reviews_count > 0 && (
                          <span className="text-muted-foreground font-serif font-normal tracking-luxury-tight text-luxury-sm">
                            ({attraction.reviews_count} reviews)
                          </span>
                        )}
                      </div>
                    )}
                    
                    {attraction.distance && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Navigation className="h-4 w-4 text-bronze-700" />
                        <span className="font-serif font-normal tracking-luxury-tight text-luxury-sm">{attraction.distance}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Get Directions Button */}
                <Button
                  variant="bronze"
                  onClick={handleGetDirections}
                  className="font-serif font-normal tracking-luxury-tight"
                  data-testid="get-directions-button"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Get Directions
                </Button>
              </div>
            </DialogHeader>

            {/* Description */}
            {(attraction.description || attraction.detailed_description) && (
              <div className="mb-6">
                <h3 className="text-luxury-xl font-serif font-normal tracking-luxury-tight text-bronze-700 mb-2">About</h3>
                <p className="text-muted-foreground leading-relaxed font-serif font-normal tracking-luxury-tight text-luxury-base" data-testid="attraction-description">
                  {attraction.detailed_description || attraction.description}
                </p>
              </div>
            )}

            {/* Tags */}
            {attraction.tags && attraction.tags.length > 0 && (
              <div className="mb-6">
                <h3 className="text-luxury-xl font-serif font-normal tracking-luxury-tight text-bronze-700 mb-2 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-bronze-700" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {attraction.tags.map((tag, index) => (
                    <Badge 
                      key={index} 
                      variant="outline" 
                      className="font-serif font-normal tracking-luxury-tight border-bronze-300 text-bronze-700 hover:bg-bronze-50"
                      data-testid={`tag-${tag.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Visitor Information */}
            {(attraction.hours || attraction.ticket_price) && (
              <Card className="mb-6 luxury-card">
                <CardContent className="p-4">
                  <h3 className="text-luxury-xl font-serif font-normal tracking-luxury-tight text-bronze-700 mb-4">Visitor Information</h3>
                  <div className="space-y-3">
                    {attraction.hours && (
                      <div className="flex items-start gap-3" data-testid="attraction-hours">
                        <Clock className="h-4 w-4 mt-0.5 text-bronze-700" />
                        <div>
                          <div className="text-luxury-sm font-serif font-normal tracking-luxury-tight text-bronze-700">Hours</div>
                          <div className="text-luxury-sm font-serif font-normal tracking-luxury-tight text-muted-foreground">{attraction.hours}</div>
                        </div>
                      </div>
                    )}
                    
                    {attraction.ticket_price && (
                      <div className="flex items-start gap-3" data-testid="attraction-price">
                        <DollarSign className="h-4 w-4 mt-0.5 text-bronze-700" />
                        <div>
                          <div className="text-luxury-sm font-serif font-normal tracking-luxury-tight text-bronze-700">Price</div>
                          <div className="text-luxury-sm font-serif font-normal tracking-luxury-tight text-muted-foreground">{attraction.ticket_price}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Gallery Thumbnails */}
            {hasMultipleImages && (
              <div className="mt-6">
                <h3 className="text-luxury-xl font-serif font-normal tracking-luxury-tight text-bronze-700 mb-2">Gallery</h3>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {allImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                        index === currentImageIndex 
                          ? 'border-bronze-600' 
                          : 'border-transparent hover:border-bronze-400'
                      }`}
                      data-testid={`gallery-thumbnail-${index}`}
                    >
                      <img
                        src={image}
                        alt={`${attraction.name} - Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}