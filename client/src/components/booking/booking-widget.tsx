import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, Star, AlertCircle, CheckCircle } from "lucide-react";
import { PricingBreakdownLink } from "./pricing-breakdown-link";
import { DateRangeField } from "./date-range-field";
import { GuestsField } from "./guests-field";
import { useBooking } from "@/hooks/use-booking-context";
import { formatCurrency, type PricingBreakdown as PricingData } from "@/lib/pricing-utils";
import { calculateNights, isDateInPast } from "@/lib/date-utils";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface BookingWidgetProps {
  className?: string;
}

interface Property {
  id: string;
  title: string;
  description: string;
  general_location: string;
  check_in_time: string;
  check_out_time: string;
  max_guests: number;
  bedrooms: number;
  bathrooms: number;
  rating: string;
  review_count: number;
  created_at: string;
  photos: any[];
  amenities: any[];
}

export function BookingWidget({ className }: BookingWidgetProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { checkIn, checkOut, guests, hasValidDates } = useBooking();
  
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [announceText, setAnnounceText] = useState("");
  
  // Refs for focus management
  const formRef = useRef<HTMLFormElement>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  // Validation functions
  const validateForm = useCallback(() => {
    const errors: { [key: string]: string } = {};
    
    if (!checkIn) {
      errors.checkIn = 'Check-in date is required';
    } else if (isDateInPast(checkIn)) {
      errors.checkIn = 'Check-in date cannot be in the past';
    }
    
    if (!checkOut) {
      errors.checkOut = 'Check-out date is required';
    } else if (checkOut <= checkIn) {
      errors.checkOut = 'Check-out date must be after check-in date';
    }
    
    if (!guests) {
      errors.guests = 'Number of guests is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [checkIn, checkOut, guests]);
  
  // Clear validation errors when form changes
  useEffect(() => {
    if (Object.keys(formErrors).length > 0) {
      validateForm();
    }
  }, [checkIn, checkOut, formErrors, validateForm]);

  // Get property data (public details for privacy)
  const { data: property, isLoading: propertyLoading } = useQuery<Property>({
    queryKey: ["/api/property/public"],
    enabled: true,
  });

  // Get pricing quote
  const { data: pricing, isLoading: pricingLoading, error: pricingError } = useQuery<PricingData>({
    queryKey: ['/api/quote', { start: checkIn, end: checkOut, guests }],
    queryFn: async () => {
      const params = new URLSearchParams({
        start: checkIn || '',
        end: checkOut || '',
        guests: guests || ''
      });
      const response = await fetch(`/api/quote?${params.toString()}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: Boolean(checkIn && checkOut && guests && checkIn < checkOut && !isDateInPast(checkIn)),
    retry: false,
  });
  
  // Announce pricing updates for screen readers
  useEffect(() => {
    if (pricing && !pricingLoading && !pricingError) {
      const nights = calculateNights(checkIn, checkOut);
      setAnnounceText(`Pricing updated: ${nights} nights at ${formatCurrency(pricing.nightlyRate)} per night, total ${formatCurrency(pricing.total)}`);
    } else if (pricingError) {
      setAnnounceText('Pricing unavailable for selected dates. Please choose different dates.');
    }
  }, [pricing, pricingLoading, pricingError, checkIn, checkOut]);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Validate form
    if (!validateForm()) {
      setIsSubmitting(false);
      setAnnounceText('Please fix the errors in the form before submitting.');
      
      // Focus on first error field with improved Select support
      const firstErrorField = formRef.current?.querySelector('[aria-invalid="true"]') as HTMLElement;
      if (firstErrorField) {
        // For Radix Select components, focus the button inside the SelectTrigger
        const selectButton = firstErrorField.querySelector('button[role="combobox"]') as HTMLElement;
        if (selectButton) {
          selectButton.focus();
        } else {
          firstErrorField.focus();
        }
      }
      
      // Focus on error summary for screen readers
      setTimeout(() => {
        if (errorSummaryRef.current) {
          errorSummaryRef.current.focus();
        }
      }, 100);
      
      return;
    }

    if (!pricing) {
      setIsSubmitting(false);
      const errorMessage = 'Unable to calculate pricing. Please try again.';
      setAnnounceText(errorMessage);
      toast({
        title: "Pricing Error",
        description: errorMessage,
        variant: "destructive",
      });
      return;
    }

    try {
      // Store booking data in session storage and navigate to guest details page
      const bookingData = {
        bookingId: `booking-${Date.now()}`, // Temporary ID for the session
        checkIn,
        checkOut,
        guests: parseInt(guests),
        total: pricing.total,
        currency: "USD",
        nights: calculateNights(checkIn, checkOut),
        nightlyRate: pricing.nightlyRate,
        breakdown: pricing.breakdown
      };

      sessionStorage.setItem("pendingBooking", JSON.stringify(bookingData));
      setAnnounceText('Booking details saved. Redirecting to guest information page.');
      setLocation("/booking/details");
    } catch (error) {
      setIsSubmitting(false);
      const errorMessage = 'An error occurred while processing your booking. Please try again.';
      setAnnounceText(errorMessage);
      toast({
        title: "Booking Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  if (propertyLoading) {
    return (
      <section 
        className={`bg-card rounded-xl border border-border shadow-xl transition-shadow duration-200 hover:shadow-2xl p-6 ${className}`}
        aria-label="Booking widget"
        aria-busy="true"
        data-testid="booking-widget"
      >
        <div className="flex items-center justify-center h-48" role="status" aria-live="polite">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
          <span className="sr-only">Loading booking information...</span>
        </div>
      </section>
    );
  }

  const nights = checkIn && checkOut ? calculateNights(checkIn, checkOut) : 0;
  const baseRate = pricing?.nightlyRate || "450";

  // Error summary for screen readers with anchor links
  const errorSummary = Object.keys(formErrors).length > 0 && (
    <div 
      ref={errorSummaryRef}
      className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg"
      role="alert"
      aria-live="assertive"
      tabIndex={-1}
      id="error-summary"
      aria-labelledby="error-summary-title"
    >
      <div id="error-summary-title" className="flex items-center gap-2 text-destructive font-serif font-normal tracking-luxury-tight mb-2">
        <AlertCircle className="h-4 w-4" aria-hidden="true" />
        <span>Please correct the following errors:</span>
      </div>
      <ul className="text-luxury-sm font-serif font-normal text-destructive space-y-1" role="list">
        {Object.entries(formErrors).map(([field, message]) => (
          <li key={field}>
            <a 
              href={`#${field === 'checkIn' ? 'checkin' : field === 'checkOut' ? 'checkout' : field}`}
              className="text-destructive underline hover:text-destructive/80 focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2 rounded"
              onClick={(e) => {
                e.preventDefault();
                const fieldId = field === 'checkIn' ? 'checkin' : field === 'checkOut' ? 'checkout' : field;
                const fieldElement = document.getElementById(fieldId);
                if (fieldElement) {
                  fieldElement.focus();
                  fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
              data-testid={`error-link-${field}`}
            >
              {field === 'checkIn' && 'Check-in date: '}
              {field === 'checkOut' && 'Check-out date: '}
              {field === 'guests' && 'Number of guests: '}
              {message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <section 
      className={`bg-card rounded-xl border border-border shadow-xl transition-shadow duration-200 hover:shadow-2xl p-6 ${className}`} 
      data-testid="booking-widget"
      aria-labelledby="booking-widget-title"
      role="region"
    >
      {/* Screen reader announcements */}
      <div 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
        role="status"
      >
        {announceText}
      </div>
      
      {/* Header: Price and ratings */}
      <header className="pb-0">
        <h2 id="booking-widget-title" className="sr-only">Property Booking</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-luxury-2xl font-serif font-normal tracking-luxury-tight text-foreground" data-testid="price-per-night">
              {formatCurrency(baseRate)}
            </span>
            <span className="text-muted-foreground font-serif font-normal tracking-luxury-tight">night</span>
            {pricingLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ml-2" aria-label="Loading pricing" />
            )}
          </div>
          {property && (
            <div className="flex items-center text-luxury-sm font-serif font-normal text-muted-foreground" role="group" aria-label="Property rating">
              <Star className="h-4 w-4 text-accent mr-1 fill-current" aria-hidden="true" />
              {property.rating ? (
                <>
                  <span data-testid="property-rating" aria-label={`Rating: ${property.rating} out of 5 stars`}>
                    {property.rating}
                  </span>
                  <span className="mx-1" aria-hidden="true">·</span>
                  <span data-testid="review-count" aria-label={`${property.review_count || 0} guest reviews`}>
                    {property.review_count || 0} reviews
                  </span>
                </>
              ) : (
                <span className="text-luxury-xs font-serif font-normal text-muted-foreground">Not yet rated</span>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Body: Form with date range and guests */}
      <div>
        {errorSummary}

        <form 
          ref={formRef}
          onSubmit={handleSubmit} 
          className="space-y-4"
          role="form"
          aria-label="Hotel booking form"
          noValidate
        >
          <div className="space-y-4">
            <DateRangeField
              error={!!(formErrors.checkIn || formErrors.checkOut)}
            />
            
            <GuestsField
              error={!!formErrors.guests}
            />
          </div>

          <Button
            type="submit"
            variant="bronze"
            className="w-full font-serif font-normal tracking-luxury-tight py-3 h-12 rounded-lg transition-all duration-200"
            disabled={!checkIn || !checkOut || pricingLoading || isSubmitting}
            data-testid="button-reserve"
            aria-describedby="reserve-button-help"
            aria-label={`Reserve property for ${nights > 0 ? nights + ' nights' : 'selected dates'}${pricing ? ' at ' + formatCurrency(pricing.total) + ' total' : ''}`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
                Processing...
              </>
            ) : (
              'Reserve'
            )}
          </Button>
          <div id="reserve-button-help" className="sr-only">
            Click to proceed to guest details and payment. You will not be charged until you complete your booking.
          </div>
        </form>
      </div>

      {/* Footer: Payment notice */}
      <div className="pb-0">
        <div className="text-center text-luxury-sm font-serif font-normal text-muted-foreground" role="note" aria-label="Payment notice">
          <CheckCircle className="h-4 w-4 inline mr-1 text-success" aria-hidden="true" />
          You won't be charged yet
        </div>
      </div>

      {/* Pricing Breakdown Link */}
      {pricing && pricing.breakdown && !pricingError && (
        <div className="pb-0">
          <Separator className="mb-4" />
          <PricingBreakdownLink pricing={pricing} />
        </div>
      )}

      {pricingError && nights > 0 && (
        <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-lg text-luxury-sm font-serif font-normal border border-destructive/20">
          Unable to calculate pricing or dates are not available. Please try different dates.
        </div>
      )}
    </section>
  );
}
