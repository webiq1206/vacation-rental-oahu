import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { PricingBreakdown } from "./pricing-breakdown";
import { useIsMobile } from "@/hooks/use-mobile";
import { useBooking } from "@/hooks/use-booking-context";
import { formatCurrency, type PricingBreakdown as PricingData } from "@/lib/pricing-utils";
import { calculateNights } from "@/lib/date-utils";
import type { PublicProperty } from "@shared/schema";
import { Link } from "wouter";
import { Star, ChevronUp, Calendar, Users, CreditCard, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MobileStickyCTAProps {
  isVisible?: boolean;
}

export function MobileStickyCTA({ isVisible = true }: MobileStickyCTAProps) {
  const isMobile = useIsMobile();
  const { checkIn, checkOut, guests } = useBooking();
  const [showPricing, setShowPricing] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  // Track scroll for glass effect intensity
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Get pricing data for transparent pricing display
  const { data: pricing, isLoading: pricingLoading } = useQuery<PricingData>({
    queryKey: [`/api/quote?start=${checkIn}&end=${checkOut}&guests=${guests}`],
    enabled: Boolean(checkIn && checkOut && guests),
    retry: false,
  });

  // Get property rating data
  const { data: property } = useQuery<PublicProperty>({
    queryKey: ["/api/property/public"],
  });

  const nights = calculateNights(checkIn, checkOut);
  const baseRate = pricing?.nightlyRate || "450";
  const total = pricing?.total || "950";

  // Don't render on desktop or if not visible
  if (!isMobile || !isVisible) {
    return null;
  }

  const glassIntensity = Math.min(scrollY / 300, 1);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 120 }}
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-border"
        style={{
          backdropFilter: `blur(${8 + glassIntensity * 12}px)`,
        }}
        data-testid="mobile-sticky-cta"
        role="region"
        aria-label="Mobile booking call to action"
      >
        {/* Screen reader announcements for price updates */}
        <div aria-live="polite" aria-atomic="true" className="sr-only" data-testid="pricing-status-announcer">
          {pricingLoading ? "Loading pricing information..." : ""}
        </div>
        {/* Enhanced glass border */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent opacity-30" data-testid="glass-border" />
        
        <div className="px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          {/* Main CTA Content */}
          <div className="flex items-center justify-between mb-2">
            {/* Pricing Display */}
            <div className="flex-1">
              <div className="flex items-baseline">
                <span className="text-luxury-xl font-serif font-normal text-foreground" data-testid="mobile-cta-price">
                  {formatCurrency(baseRate)}
                </span>
                <span className="text-luxury-sm font-serif font-normal text-muted-foreground ml-1">/ night</span>
              </div>
              
              {/* Rating & Reviews */}
              {property && (
                <div className="flex items-center text-luxury-xs font-serif font-normal text-muted-foreground mt-1" data-testid="property-rating-display">
                  <Star className="h-3 w-3 text-accent mr-1 fill-current" aria-hidden="true" />
                  {property.rating ? (
                    <>
                      <span data-testid="rating-value">{property.rating}</span>
                      <span className="mx-1">·</span>
                      <span data-testid="review-count">{property.review_count || 0} reviews</span>
                    </>
                  ) : (
                    <span className="text-luxury-xs font-serif font-normal" data-testid="no-rating">Not yet rated</span>
                  )}
                </div>
              )}
            </div>

            {/* Primary CTA Button */}
            <Link href="/booking" className="ml-4">
              <Button 
                variant="bronze" 
                size="lg"
                className="btn-bronze-enhanced font-serif font-normal tracking-luxury-tight px-8 py-3 touch-target-optimal"
                data-testid="mobile-cta-reserve"
                aria-label="Reserve this property now"
              >
                <CreditCard className="h-4 w-4 mr-2" aria-hidden="true" />
                Reserve
              </Button>
            </Link>
          </div>

          {/* Enhanced Transparent Pricing Preview */}
          <div className="flex items-center justify-between text-luxury-xs font-serif font-normal text-muted-foreground" data-testid="booking-summary-preview">
            <div className="flex items-center space-x-4">
              <div className="flex items-center" data-testid="nights-display">
                <Calendar className="h-3 w-3 mr-1" aria-hidden="true" />
                <span>{nights} nights</span>
              </div>
              <div className="flex items-center" data-testid="guests-display">
                <Users className="h-3 w-3 mr-1" aria-hidden="true" />
                <span>{guests} guests</span>
              </div>
              {/* Show breakdown preview if available */}
              {pricing && pricing.breakdown && (
                <div className="flex items-center text-luxury-xs font-serif font-normal text-accent" data-testid="fees-indicator">
                  <span>+fees</span>
                </div>
              )}
            </div>
            
            {/* Pricing Sheet Trigger */}
            <Sheet open={showPricing} onOpenChange={setShowPricing}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-luxury-xs font-serif font-normal text-accent hover:text-accent-foreground p-1 h-auto touch-target-optimal"
                  data-testid="mobile-cta-pricing-details"
                  aria-label="View detailed pricing breakdown"
                >
                  <span>Total {formatCurrency(total)}</span>
                  <ChevronUp className="h-3 w-3 ml-1" aria-hidden="true" />
                </Button>
              </SheetTrigger>
              
              <SheetContent side="bottom" className="h-[80vh] overflow-y-auto bg-card border-border" data-testid="pricing-details-sheet">
                <SheetHeader className="mb-6">
                  <SheetTitle className="text-left" data-testid="sheet-title">Pricing Details</SheetTitle>
                </SheetHeader>
                
                {/* Detailed Pricing Breakdown */}
                <div className="space-y-6">
                  {/* Property Preview */}
                  <div className="flex space-x-4 p-4 bg-muted/50 rounded-xl border border-border shadow-sm" data-testid="property-preview-section">
                    {property?.photos?.[0]?.url ? (
                      <img
                        src={property.photos[0].url}
                        alt={property.photos[0].alt || `${property.title} preview`}
                        className="w-20 h-16 rounded-xl object-cover"
                        data-testid="property-preview-image"
                      />
                    ) : (
                      <div className="w-20 h-16 rounded-xl bg-muted flex items-center justify-center" data-testid="property-preview-placeholder">
                        <span className="text-luxury-xs font-serif font-normal text-muted-foreground">No image</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-luxury-base font-serif font-normal text-foreground" data-testid="property-preview-title">
                        {property?.title || 'Property'}
                      </h3>
                      <p className="text-luxury-sm font-serif font-normal text-muted-foreground" data-testid="property-preview-location">
                        {property?.general_location || 'Location not available'}
                      </p>
                      <div className="flex items-center text-luxury-xs font-serif font-normal mt-1">
                        <Star className="h-3 w-3 text-accent mr-1 fill-current" aria-hidden="true" />
                        {property?.rating ? (
                          <span>{property.rating} · {property.review_count || 0} reviews</span>
                        ) : (
                          <span>Not yet rated</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Booking Summary */}
                  <div className="space-y-3 p-4 bg-card rounded-xl border border-border shadow-sm">
                    <h4 className="text-luxury-base font-serif font-normal text-foreground">Your Stay</h4>
                    <div className="grid grid-cols-2 gap-4 text-luxury-sm font-serif font-normal">
                      <div>
                        <p className="text-muted-foreground">Check-in</p>
                        <p className="font-serif font-normal">{new Date(checkIn).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Check-out</p>
                        <p className="font-serif font-normal">{new Date(checkOut).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Guests</p>
                        <p className="font-serif font-normal">{guests} guests</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Nights</p>
                        <p className="font-serif font-normal">{nights} nights</p>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Detailed Pricing with Complete Transparency */}
                  {pricing && !pricingLoading ? (
                    <div className="p-4 bg-card rounded-xl border border-border shadow-sm">
                      <h4 className="text-luxury-base font-serif font-normal text-foreground mb-4">Complete Price Breakdown</h4>
                      <div className="space-y-3">
                        {/* Nightly Rate */}
                        <div className="flex justify-between text-luxury-sm font-serif font-normal">
                          <span className="text-muted-foreground">
                            {formatCurrency(pricing.nightlyRate)} x {nights} nights
                          </span>
                          <span className="text-foreground">
                            {formatCurrency((parseFloat(pricing.nightlyRate) * nights).toFixed(2))}
                          </span>
                        </div>
                        
                        {/* All Fees and Charges */}
                        {pricing.breakdown && pricing.breakdown.length > 0 ? (
                          pricing.breakdown.map((item) => (
                            <div key={item.label} className="flex justify-between text-luxury-sm font-serif font-normal">
                              <span className="text-muted-foreground">{item.label}</span>
                              <span className="text-foreground">{item.amount}</span>
                            </div>
                          ))
                        ) : (
                          <>
                            <div className="flex justify-between text-luxury-sm font-serif font-normal">
                              <span className="text-muted-foreground">Cleaning fee</span>
                              <span className="text-foreground">{formatCurrency(pricing.cleaningFee)}</span>
                            </div>
                            <div className="flex justify-between text-luxury-sm font-serif font-normal">
                              <span className="text-muted-foreground">Service fee</span>
                              <span className="text-foreground">{formatCurrency(pricing.serviceFee)}</span>
                            </div>
                            <div className="flex justify-between text-luxury-sm font-serif font-normal">
                              <span className="text-muted-foreground">Taxes & fees</span>
                              <span className="text-foreground">{formatCurrency(pricing.taxes)}</span>
                            </div>
                            {parseFloat(pricing.discount) > 0 && (
                              <div className="flex justify-between text-luxury-sm font-serif font-normal text-success">
                                <span>Discount</span>
                                <span>-{formatCurrency(pricing.discount)}</span>
                              </div>
                            )}
                          </>
                        )}
                        
                        {/* Total */}
                        <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between text-luxury-base font-serif font-normal">
                            <span>Total</span>
                            <span>{formatCurrency(pricing.total)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-card rounded-xl border border-border shadow-sm">
                      <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-4 bg-muted rounded w-1/2"></div>
                        <div className="h-4 bg-muted rounded w-2/3"></div>
                        <div className="h-4 bg-muted rounded w-full"></div>
                        <div className="border-t pt-2 mt-2">
                          <div className="h-5 bg-muted rounded w-1/2 ml-auto"></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Enhanced CTA Buttons */}
                  <div className="sticky bottom-0 bg-card/95 backdrop-blur-md pt-4 pb-[calc(0.5rem+env(safe-area-inset-bottom))] border-t border-border space-y-3 shadow-lg">
                    <Link href="/booking" className="block">
                      <Button 
                        variant="bronze" 
                        size="lg" 
                        className="w-full btn-bronze-enhanced font-serif font-normal tracking-luxury-tight py-3 h-12 rounded-xl"
                        onClick={() => setShowPricing(false)}
                        data-testid="mobile-pricing-reserve"
                        aria-label="Reserve property from pricing details"
                      >
                        <CreditCard className="h-4 w-4 mr-2" aria-hidden="true" />
                        Reserve Now
                      </Button>
                    </Link>
                    
                    {/* Express Payment Options Teaser */}
                    <div className="flex items-center justify-center space-x-2 text-luxury-xs font-serif font-normal text-muted-foreground">
                      <Smartphone className="h-3 w-3" />
                      <span>Apple Pay & Google Pay available at checkout</span>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Enhanced shadow for depth */}
        <div className="absolute -top-8 left-0 right-0 h-8 bg-gradient-to-t from-foreground/5 to-transparent pointer-events-none" />
      </motion.div>
    </AnimatePresence>
  );
}