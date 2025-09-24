import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Minus, Plus, Users, User, Baby, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBooking } from "@/hooks/use-booking-context";

interface GuestType {
  id: 'adults' | 'children' | 'infants' | 'pets';
  label: string;
  description: string;
  icon: React.ReactNode;
  min: number;
  max?: number;
  countsTowardsTotal: boolean;
}

interface GuestsFieldProps {
  className?: string;
  error?: boolean;
}

interface Property {
  id: string;
  max_guests?: number;
}

interface GuestCounts {
  adults: number;
  children: number;
  infants: number;
  pets: number;
}

export function GuestsField({ 
  className, 
  error
}: GuestsFieldProps) {
  const { guests, setGuests } = useBooking();
  const [isOpen, setIsOpen] = useState(false);
  const [announceText, setAnnounceText] = useState("");
  
  // Refs for focus management
  const triggerRef = useRef<HTMLButtonElement>(null);
  
  // Initialize guest counts from current guests value
  const initializeGuestCounts = (): GuestCounts => {
    const totalGuests = parseInt(guests) || 0;
    return {
      adults: Math.max(1, totalGuests), // Adults minimum is 1
      children: 0,
      infants: 0,
      pets: 0
    };
  };

  const [guestCounts, setGuestCounts] = useState<GuestCounts>(initializeGuestCounts);

  // Get property data for max guests limit
  const { data: property } = useQuery<Property>({
    queryKey: ["/api/property/public"],
    enabled: true,
  });

  const maxGuests = property?.max_guests || 16; // Default max guests

  // Guest type definitions
  const guestTypes: GuestType[] = [
    {
      id: 'adults',
      label: 'Adults',
      description: '18+ years',
      icon: <Users className="h-5 w-5" />,
      min: 1,
      max: maxGuests,
      countsTowardsTotal: true,
    },
    {
      id: 'children',
      label: 'Children',
      description: 'Ages 2-17',
      icon: <User className="h-5 w-5" />,
      min: 0,
      max: Math.max(0, maxGuests - 1), // Ensure at least 1 adult
      countsTowardsTotal: true,
    },
    {
      id: 'infants',
      label: 'Infants',
      description: 'Under 2',
      icon: <Baby className="h-5 w-5" />,
      min: 0,
      max: 5, // Reasonable limit for infants
      countsTowardsTotal: false, // Infants typically don't count towards occupancy
    },
    {
      id: 'pets',
      label: 'Pets',
      description: 'Service animals welcome',
      icon: <Heart className="h-5 w-5" />,
      min: 0,
      max: 5, // Reasonable limit for pets
      countsTowardsTotal: false, // Pets don't count towards occupancy
    },
  ];

  // Calculate totals
  const totalGuests = guestCounts.adults + guestCounts.children;
  const totalOccupants = totalGuests + guestCounts.infants + guestCounts.pets;

  // Update booking context when guest counts change
  useEffect(() => {
    const newGuestValue = String(totalGuests);
    if (guests !== newGuestValue) {
      setGuests(newGuestValue);
    }
  }, [totalGuests, setGuests, guests]);

  // Validation
  const isValid = totalGuests >= 1 && totalGuests <= maxGuests;

  // Handle counter changes
  const handleCounterChange = (guestType: 'adults' | 'children' | 'infants' | 'pets', change: number) => {
    setGuestCounts(prev => {
      const currentValue = prev[guestType];
      const guestTypeConfig = guestTypes.find(gt => gt.id === guestType)!;
      
      let newValue = currentValue + change;
      
      // Apply min/max constraints
      newValue = Math.max(guestTypeConfig.min, newValue);
      if (guestTypeConfig.max !== undefined) {
        newValue = Math.min(guestTypeConfig.max, newValue);
      }
      
      // Special validation for adults + children not exceeding max occupancy
      if (guestType === 'adults' || guestType === 'children') {
        const otherType = guestType === 'adults' ? 'children' : 'adults';
        const otherCount = guestType === 'adults' ? prev.children : prev.adults;
        const proposedTotal = newValue + otherCount;
        
        if (proposedTotal > maxGuests) {
          newValue = Math.max(guestTypeConfig.min, maxGuests - otherCount);
        }
      }

      const newCounts = { ...prev, [guestType]: newValue };
      const newTotal = newCounts.adults + newCounts.children;
      
      // Announce changes for screen readers
      const typeLabel = guestTypeConfig.label.toLowerCase();
      setAnnounceText(`${typeLabel}: ${newValue}. Total guests: ${newTotal}`);
      
      return newCounts;
    });
  };

  // Format display text for the trigger
  const formatGuestDisplay = (): string => {
    if (totalOccupants === 0) return "Add guests";
    
    const parts: string[] = [];
    
    if (totalGuests === 1) {
      parts.push("1 guest");
    } else if (totalGuests > 1) {
      parts.push(`${totalGuests} guests`);
    }
    
    if (guestCounts.infants > 0) {
      parts.push(`${guestCounts.infants} infant${guestCounts.infants > 1 ? 's' : ''}`);
    }
    
    if (guestCounts.pets > 0) {
      parts.push(`${guestCounts.pets} pet${guestCounts.pets > 1 ? 's' : ''}`);
    }
    
    return parts.join(', ') || "Add guests";
  };

  // Format helper text
  const formatHelperText = (): string => {
    const parts: string[] = [];
    
    if (guestCounts.adults > 0) {
      parts.push(`${guestCounts.adults} adult${guestCounts.adults > 1 ? 's' : ''}`);
    }
    
    if (guestCounts.children > 0) {
      parts.push(`${guestCounts.children} child${guestCounts.children > 1 ? 'ren' : ''}`);
    }
    
    if (guestCounts.infants > 0) {
      parts.push(`${guestCounts.infants} infant${guestCounts.infants > 1 ? 's' : ''}`);
    }
    
    if (guestCounts.pets > 0) {
      parts.push(`${guestCounts.pets} pet${guestCounts.pets > 1 ? 's' : ''}`);
    }
    
    return parts.join(', ');
  };

  const helperText = formatHelperText();

  return (
    <div className={cn("relative", className)}>
      {/* Screen reader announcements */}
      <div 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
        role="status"
      >
        {announceText}
      </div>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
            variant="outline"
            className={cn(
              "w-full h-14 px-4 justify-between text-left font-normal",
              "hover:bg-muted/50 focus:ring-2 focus:ring-offset-2 focus:ring-ring",
              "transition-all duration-200 bg-background border-border rounded-lg",
              error && "border-destructive focus:ring-destructive",
              isOpen && "bg-muted/50 ring-2 ring-ring ring-offset-0"
            )}
            data-testid="trigger-guests"
            aria-label="Select number of guests"
            aria-describedby="guests-help"
            aria-expanded={isOpen}
            aria-haspopup="true"
          >
            <div className="flex flex-col items-start w-full">
              <span className="text-xs font-serif font-normal text-muted-foreground uppercase tracking-luxury-tight mb-1">
                GUESTS *
              </span>
              <span className={cn(
                "text-luxury-sm font-serif font-normal mt-0.5",
                totalOccupants === 0 ? "text-muted-foreground" : "text-foreground"
              )}>
                {formatGuestDisplay()}
              </span>
            </div>
            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
          </Button>
        </PopoverTrigger>
        
        <div id="guests-help" className="sr-only">
          Select the number and type of guests for your stay.
        </div>

        <PopoverContent 
          className="w-80 p-0 border-0 shadow-2xl" 
          align="start"
          side="bottom"
          sideOffset={8}
          data-testid="guests-popover"
        >
          <div className="bg-popover rounded-2xl border border-border overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-border">
              <h3 className="text-luxury-lg font-serif font-normal text-foreground">Guests</h3>
              <p className="text-luxury-sm font-serif font-normal text-muted-foreground mt-1">
                Specify the ages of children and infants for the most accurate experience
              </p>
            </div>

            {/* Guest type counters */}
            <div className="p-4 space-y-6">
              {guestTypes.map((guestType) => {
                const count = guestCounts[guestType.id];
                const canDecrease = count > guestType.min;
                const canIncrease = guestType.max === undefined || count < guestType.max;

                return (
                  <div key={guestType.id} className="flex items-center justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="text-muted-foreground mt-1">
                        {guestType.icon}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">
                          {guestType.label}
                        </div>
                        <div className="text-luxury-sm font-serif font-normal text-muted-foreground">
                          {guestType.description}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        size="icon"
                        className={cn(
                          "h-8 w-8 rounded-full border-border",
                          canDecrease 
                            ? "hover:border-foreground hover:bg-muted/50" 
                            : "opacity-50 cursor-not-allowed"
                        )}
                        onClick={() => handleCounterChange(guestType.id, -1)}
                        disabled={!canDecrease}
                        data-testid={`button-decrease-${guestType.id}`}
                        aria-label={`Decrease ${guestType.label.toLowerCase()}`}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      
                      <span 
                        className="w-8 text-center font-medium text-foreground"
                        data-testid={`count-${guestType.id}`}
                        aria-label={`${count} ${guestType.label.toLowerCase()}`}
                      >
                        {count}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="icon"
                        className={cn(
                          "h-8 w-8 rounded-full border-border",
                          canIncrease 
                            ? "hover:border-foreground hover:bg-muted/50" 
                            : "opacity-50 cursor-not-allowed"
                        )}
                        onClick={() => handleCounterChange(guestType.id, 1)}
                        disabled={!canIncrease}
                        data-testid={`button-increase-${guestType.id}`}
                        aria-label={`Increase ${guestType.label.toLowerCase()}`}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer with summary and validation */}
            <div className="px-4 pb-4">
              {totalGuests > maxGuests && (
                <div className="mb-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <div className="text-sm text-destructive">
                    Maximum {maxGuests} guests allowed for this property.
                  </div>
                </div>
              )}
              
              <div className="text-xs text-muted-foreground">
                {totalGuests === 1 ? "1 guest" : `${totalGuests} guests`}
                {guestCounts.infants > 0 && (
                  <>, {guestCounts.infants} infant{guestCounts.infants > 1 ? 's' : ''}</>
                )}
                {guestCounts.pets > 0 && (
                  <>, {guestCounts.pets} pet{guestCounts.pets > 1 ? 's' : ''}</>
                )}
                {totalGuests < maxGuests && (
                  <> • Maximum {maxGuests} guests</>
                )}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Helper text showing breakdown */}
      {helperText && (
        <div 
          className="mt-1 text-xs text-muted-foreground"
          data-testid="guests-helper-text"
        >
          {helperText}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div 
          className="mt-1 text-sm text-destructive"
          role="alert"
          data-testid="guests-error"
        >
          Please select at least 1 guest
        </div>
      )}
    </div>
  );
}