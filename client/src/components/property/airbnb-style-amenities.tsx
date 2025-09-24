import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Waves, 
  Wifi, 
  Car, 
  UtensilsCrossed, 
  Wind, 
  Sparkles, 
  Flame,
  Coffee,
  Tv,
  Dumbbell,
  Bath,
  ShirtIcon,
  Zap,
  Refrigerator,
  Droplets,
  Package,
  Heart,
  Mountain,
  Speaker,
  Book,
  Armchair,
  Umbrella,
  Baby,
  Gamepad2,
  Moon,
  Shield,
  Key,
  Battery,
  ChefHat,
  Snowflake,
  Users,
  TreePine,
  MapPin,
  Shirt,
  Utensils,
  Home,
  Bed,
  Sofa,
  Monitor,
  Gamepad,
  Music,
  Camera,
  Sun,
  Star,
  CheckCircle,
  Award,
  Clock,
  Thermometer
} from "lucide-react";

interface Amenity {
  id: string;
  name: string;
  icon: string;
  category: string;
  description?: string;
  featured?: boolean;
}

interface AmenityCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  sort_order: number;
}

export function AirbnbStyleAmenities() {
  const { data: amenities = [], isLoading, error } = useQuery<Amenity[]>({
    queryKey: ["/api/amenities"],
  });

  const { data: categories = [] } = useQuery<AmenityCategory[]>({
    queryKey: ["/api/amenity-categories"],
  });

  const getIcon = (iconName: string, amenityName: string = '', size: 'sm' | 'md' | 'lg' = 'md') => {
    // Special icon mapping for specific amenities
    const specialMappings: { [key: string]: React.ElementType } = {
      'Beach Access': Sun,
      'Mountain View': TreePine,
      'Ocean View': Waves,
    };

    if (specialMappings[amenityName]) {
      const IconComponent = specialMappings[amenityName];
      const sizeClasses = {
        'sm': 'h-4 w-4 stroke-1',
        'md': 'h-6 w-6 stroke-1', 
        'lg': 'h-8 w-8 stroke-1'
      };
      return <IconComponent className={`${sizeClasses[size]} text-bronze-700`} />;
    }

    const iconMap: { [key: string]: React.ElementType } = {
      'waves': Waves,
      'wifi': Wifi,
      'car': Car,
      'utensils': UtensilsCrossed,
      'wind': Wind,
      'sparkles': Sparkles,
      'flame': Flame,
      'coffee': Coffee,
      'tv': Tv,
      'dumbbell': Dumbbell,
      'bath': Bath,
      'shirt': ShirtIcon,
      'zap': Zap,
      'refrigerator': Refrigerator,
      'droplets': Droplets,
      'package': Package,
      'heart': TreePine, // Changed from Heart to TreePine for Mountain View
      'speaker': Speaker,
      'book': Book,
      'chair': Armchair,
      'umbrella': Umbrella,
      'baby': Baby,
      'gamepad2': Gamepad2,
      'moon': Moon,
      'shield': Shield,
      'key': Key,
      'battery': Battery,
      'chef': ChefHat,
      'snowflake': Snowflake,
      'users': Users,
      'tree': TreePine,
      'map': MapPin,
      'laundry': Shirt,
      'kitchen': Utensils,
      'home': Home,
      'bed': Bed,
      'sofa': Sofa,
      'monitor': Monitor,
      'gaming': Gamepad,
      'music': Music,
      'camera': Camera,
      'sun': Sun,
      'star': Star,
      'check': CheckCircle,
      'award': Award,
      'clock': Clock,
      'thermometer': Thermometer,
    };
    
    const sizeClasses = {
      'sm': 'h-4 w-4 stroke-1',
      'md': 'h-6 w-6 stroke-1',
      'lg': 'h-8 w-8 stroke-1'
    };
    
    const IconComponent = iconMap[iconName] || Sparkles;
    return <IconComponent className={sizeClasses[size]} />;
  };

  // Organize amenities by category
  const amenitiesByCategory = amenities.reduce((acc, amenity) => {
    if (!acc[amenity.category]) acc[amenity.category] = [];
    acc[amenity.category].push(amenity);
    return acc;
  }, {} as Record<string, Amenity[]>);

  // Get featured amenities (first 6 for initial display)
  const featuredAmenities = (() => {
    const markedFeatured = amenities.filter(amenity => amenity.featured);
    if (markedFeatured.length >= 6) {
      return markedFeatured.slice(0, 6);
    }
    // If we don't have enough featured amenities, take featured ones plus top amenities
    const remainingNeeded = 6 - markedFeatured.length;
    const nonFeatured = amenities.filter(amenity => !amenity.featured);
    const topNonFeatured = nonFeatured.slice(0, remainingNeeded);
    return [...markedFeatured, ...topNonFeatured];
  })();

  // Create dynamic category configuration from database
  const categoryConfig = categories.reduce((acc, category) => {
    acc[category.name] = {
      icon: category.icon || 'sparkles',
      title: category.name,
      description: category.description || `Everything you need for ${category.name.toLowerCase()}`,
      color: category.color || 'from-bronze-400 to-bronze-600'
    };
    return acc;
  }, {} as Record<string, { icon: string; title: string; description: string; color: string }>);

  // Fallback configuration for categories not yet configured
  const getFallbackCategoryConfig = (categoryName: string) => {
    return {
      icon: 'sparkles',
      title: categoryName,
      description: `Premium ${categoryName.toLowerCase()} amenities for your stay`,
      color: 'from-bronze-400 to-bronze-600'
    };
  };

  if (isLoading) {
    return (
      <section className="py-16 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <Skeleton className="h-8 w-64 mb-8" />
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-border rounded-lg overflow-hidden">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={`p-8 md:p-10 ${
                    i % 2 === 0 ? 'md:border-r border-border' : ''
                  } ${
                    i < 4 ? 'border-b border-border' : ''
                  }`}>
                    <div className="flex items-start space-x-5">
                      <Skeleton className="w-12 h-12 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error || amenities.length === 0) {
    return (
      <section className="py-16 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-luxury-2xl font-serif font-normal text-foreground mb-8 tracking-luxury-tight">
              What this place offers
            </h2>
            <div className="max-w-lg mx-auto text-center py-16">
              <div className="border border-border rounded-lg p-12">
                <div className="text-muted-foreground mb-4">
                  {error ? "Unable to load amenities at this time." : "No amenities configured yet."}
                </div>
                {error && (
                  <Button 
                    onClick={() => window.location.reload()} 
                    variant="outline"
                    className="mt-4"
                    data-testid="retry-amenities"
                  >
                    Try Again
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <h2 className="text-luxury-2xl font-serif font-normal text-foreground mb-8 tracking-luxury-tight">
              What this place offers
            </h2>
          </ScrollReveal>

          {/* Minimal list layout matching homepage design */}
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-border rounded-lg overflow-hidden">
              {featuredAmenities.slice(0, 6).map((amenity, index) => (
                <div 
                  key={amenity.id} 
                  className={`group p-8 md:p-10 transition-colors duration-200 hover:bg-muted/50 ${
                    index % 2 === 0 ? 'md:border-r border-border' : ''
                  } ${
                    index < 4 ? 'border-b border-border' : ''
                  }`}
                  data-testid={`amenity-${amenity.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className="flex items-start space-x-5">
                    {/* Refined icon */}
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center text-bronze-700">
                      {getIcon(amenity.icon, amenity.name, 'md')}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1">
                      <h3 className="text-luxury-xl font-serif font-normal text-foreground mb-2 leading-tight tracking-luxury-tight">
                        {amenity.name}
                      </h3>
                      <p className="text-luxury-base font-serif text-muted-foreground leading-relaxed tracking-luxury-tight">
                        {amenity.description || `Premium ${amenity.name.toLowerCase()} amenities for your comfort`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Show all button with dialog */}
          <div className="text-center mt-12">
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-foreground text-foreground hover:bg-foreground hover:text-background font-serif font-normal tracking-luxury-tight"
                  data-testid="show-all-amenities-button"
                >
                  Show all {amenities.length} amenities
                </Button>
              </DialogTrigger>
              
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden bg-background border border-border rounded-lg">
                <DialogHeader className="border-b border-border pb-8">
                  <div className="text-center">
                    <DialogTitle className="text-2xl md:text-3xl font-serif text-foreground mb-4 leading-tight">
                      Complete Amenities Collection
                    </DialogTitle>
                    <div className="w-16 h-px bg-border mx-auto mb-4" />
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
                      Every premium detail and service designed to exceed your expectations
                    </p>
                  </div>
                </DialogHeader>
                
                <div className="overflow-y-auto max-h-[70vh] px-2">
                  <div className="space-y-12 py-8">
                    {Object.entries(amenitiesByCategory).map(([category, categoryAmenities]) => {
                      const config = categoryConfig[category] || getFallbackCategoryConfig(category);
                      
                      return (
                        <div 
                          key={category}
                          className="bg-card border border-border rounded-lg p-8"
                        >
                          {/* Category header */}
                          <div className="flex items-center space-x-6 mb-8">
                            <div className="w-12 h-12 border border-border rounded-lg flex items-center justify-center text-muted-foreground">
                              {getIcon(config.icon, 'md')}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-xl font-serif text-foreground mb-2 leading-tight">{config.title}</h3>
                              <p className="text-muted-foreground text-sm leading-relaxed">{config.description}</p>
                            </div>
                          </div>
                          
                          {/* Amenities grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {categoryAmenities.map((amenity) => (
                              <div 
                                key={amenity.id}
                                className="group p-6 hover:bg-muted/50 transition-colors cursor-pointer rounded-lg border border-transparent hover:border-border"
                                role="button"
                                tabIndex={0}
                                aria-label={`${amenity.name}: ${amenity.description}`}
                              >
                                <div className="flex items-start space-x-4">
                                  <div className="w-8 h-8 text-bronze-700 flex items-center justify-center flex-shrink-0">
                                    {getIcon(amenity.icon, amenity.name, 'sm')}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between mb-2">
                                      <h4 className="font-semibold text-foreground text-base leading-tight">
                                        {amenity.name}
                                      </h4>
                                      {amenity.featured && (
                                        <div className="w-4 h-4 text-bronze-700 flex items-center justify-center flex-shrink-0 ml-2">
                                          <Star className="h-3 w-3 fill-current" />
                                        </div>
                                      )}
                                    </div>
                                    {amenity.description && (
                                      <p className="text-muted-foreground leading-relaxed text-sm mb-3">
                                        {amenity.description}
                                      </p>
                                    )}
                                    <div className="flex items-center space-x-2 text-muted-foreground text-xs">
                                      <CheckCircle className="h-3 w-3" />
                                      <span>Included</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </section>
  );
}