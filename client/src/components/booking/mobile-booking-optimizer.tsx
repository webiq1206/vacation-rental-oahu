import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { useBooking } from "@/hooks/use-booking-context";
import { formatCurrency, type PricingBreakdown } from "@/lib/pricing-utils";
import { calculateNights, formatDate } from "@/lib/date-utils";
import type { PublicProperty } from "@shared/schema";
import { Link } from "wouter";
import { Calendar, Users, Star, Zap, Shield, Heart, Edit } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MobileBookingOptimizerProps {
  className?: string;
}

interface MobileMarketingSettings {
  urgency_message?: string;
  trust_signal_message?: string;
  share_title?: string;
  share_text?: string;
}

export function MobileBookingOptimizer({ className }: MobileBookingOptimizerProps) {
  const isMobile = useIsMobile();
  const { checkIn, checkOut, guests, setCheckIn, setCheckOut, setGuests } = useBooking();
  const [showUrgency, setShowUrgency] = useState(false);
  const [showTrustSignals, setShowTrustSignals] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGuestSelector, setShowGuestSelector] = useState(false);
  const [editingDate, setEditingDate] = useState<'checkin' | 'checkout' | null>(null);

  // Get pricing data
  const { data: pricing } = useQuery<PricingBreakdown>({
    queryKey: [`/api/quote?start=${checkIn}&end=${checkOut}&guests=${guests}`],
    enabled: Boolean(checkIn && checkOut && guests),
    retry: false,
  });

  // Get property data
  const { data: property } = useQuery<PublicProperty>({
    queryKey: ["/api/property/public"],
  });

  // Get mobile marketing settings for dynamic text
  const { data: mobileSettings } = useQuery<MobileMarketingSettings>({
    queryKey: ['/api/settings/mobile_marketing'],
    retry: false,
  });

  // Show urgency after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowUrgency(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Show trust signals after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowTrustSignals(true), 10000);
    return () => clearTimeout(timer);
  }, []);

  // Don't render on desktop
  if (!isMobile) {
    return null;
  }

  const nights = calculateNights(checkIn, checkOut);
  const baseRate = pricing?.nightlyRate || "450";
  const total = pricing?.total || "950";

  return (
    <div className={`mobile-booking-optimizer ${className}`} data-testid="mobile-booking-optimizer" role="region" aria-label="Mobile booking optimization features">
      {/* Screen reader announcements for dynamic updates */}
      <div aria-live="polite" aria-atomic="true" className="sr-only" data-testid="booking-status-announcer">
        {showUrgency ? "Booking urgency notification displayed" : ""}
        {showTrustSignals ? "Trust signal notification displayed" : ""}
      </div>
      {/* Floating Urgency Badge */}
      <AnimatePresence>
        {showUrgency && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ type: "spring", damping: 15, stiffness: 200 }}
            className="fixed top-24 left-4 right-4 z-40 md:hidden"
          >
            <Card className="bg-destructive border-none text-destructive-foreground shadow-lg" data-testid="urgency-notification-card">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2" role="alert" aria-live="assertive">
                  <Zap className="h-4 w-4 animate-pulse" aria-hidden="true" />
                  <span className="text-luxury-sm font-serif font-normal tracking-luxury-tight">
                    {mobileSettings?.urgency_message || "Limited availability - Book now!"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trust Signals */}
      <AnimatePresence>
        {showTrustSignals && (
          <motion.div
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            transition={{ type: "spring", damping: 25, stiffness: 120 }}
            className="fixed bottom-24 left-4 z-40 md:hidden"
          >
            <Card className="bg-muted border-border shadow-lg" data-testid="trust-signal-card">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2" role="status" aria-live="polite">
                  <div className="flex items-center">
                    <Heart className="h-4 w-4 text-destructive mr-1" aria-hidden="true" />
                    <span className="text-luxury-xs font-serif font-normal tracking-luxury-tight text-foreground">
                      {mobileSettings?.trust_signal_message || "Recent booking activity"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Booking Floating Action Buttons */}
      <div className="fixed bottom-20 right-4 z-40 md:hidden space-y-3">
        {/* Share Button */}
        <motion.div
          className="gpu-accelerated"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 2, type: "spring", damping: 15, stiffness: 200 }}
          viewport={{ once: true, amount: 0.2 }}
        >
          <Button
            variant="outline"
            size="sm"
            className="w-12 h-12 rounded-full bg-card/95 backdrop-blur-sm border-border shadow-lg"
            data-testid="mobile-optimizer-share"
            aria-label="Share this property with friends"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: property?.title || mobileSettings?.share_title || 'Vacation Rental',
                  text: property?.marketing_description || mobileSettings?.share_text || 'Check out this amazing property!',
                  url: window.location.href,
                });
              }
            }}
          >
            <Heart className="h-4 w-4 text-accent" aria-hidden="true" />
          </Button>
        </motion.div>

        {/* Quick Book Button */}
        <motion.div
          className="gpu-accelerated"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.5, type: "spring", damping: 15, stiffness: 200 }}
          viewport={{ once: true, amount: 0.2 }}
        >
          <Link href="/booking">
            <Button
              variant="bronze"
              size="sm"
              className="w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 border-0"
              data-testid="mobile-optimizer-quick-book"
              aria-label="Quick book this property"
            >
              <Zap className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* Mobile Booking Preview Cards with Editable Fields */}
      <div className="fixed top-32 left-4 right-4 z-30 md:hidden pointer-events-none">
        <motion.div
          className="gpu-accelerated grid grid-cols-1 gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3, duration: 0.5 }}
          viewport={{ once: true, amount: 0.2 }}
        >
          {/* Editable Booking Summary */}
          <Card className="bg-card/95 backdrop-blur-sm border-border pointer-events-auto shadow-sm" data-testid="booking-summary-card">
            <CardContent className="p-3">
              <div className="space-y-2" data-testid="booking-summary-content">
                {/* Dates Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-accent" aria-hidden="true" />
                    <Popover open={showDatePicker && editingDate === 'checkin'} onOpenChange={(open) => {
                      setShowDatePicker(open);
                      if (!open) setEditingDate(null);
                    }} data-testid="checkin-date-popover">
                      <PopoverTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="text-luxury-xs font-serif font-normal tracking-luxury-tight p-1 h-auto text-foreground hover:bg-muted/50"
                          onClick={() => {
                            setEditingDate('checkin');
                            setShowDatePicker(true);
                          }}
                          data-testid="edit-checkin-date"
                          aria-label="Edit check-in date"
                        >
                          {formatDate(checkIn)}
                          <Edit className="h-3 w-3 ml-1" aria-hidden="true" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start" data-testid="checkin-calendar-content">
                        <CalendarComponent
                          mode="single"
                          selected={new Date(checkIn)}
                          onSelect={(date) => {
                            if (date) {
                              const newCheckIn = date.toISOString().split('T')[0];
                              setCheckIn(newCheckIn);
                              // Set checkout to next day at minimum
                              const nextDay = new Date(date);
                              nextDay.setDate(nextDay.getDate() + 1);
                              setCheckOut(nextDay.toISOString().split('T')[0]);
                            }
                            setShowDatePicker(false);
                            setEditingDate(null);
                          }}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          data-testid="checkin-calendar"
                          aria-label="Select check-in date"
                        />
                      </PopoverContent>
                    </Popover>
                    <span className="text-luxury-xs font-serif font-normal text-muted-foreground">to</span>
                    <Popover open={showDatePicker && editingDate === 'checkout'} onOpenChange={(open) => {
                      setShowDatePicker(open);
                      if (!open) setEditingDate(null);
                    }} data-testid="checkout-date-popover">
                      <PopoverTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="text-luxury-xs font-serif font-normal tracking-luxury-tight p-1 h-auto text-foreground hover:bg-muted/50"
                          onClick={() => {
                            setEditingDate('checkout');
                            setShowDatePicker(true);
                          }}
                          data-testid="edit-checkout-date"
                          aria-label="Edit check-out date"
                        >
                          {formatDate(checkOut)}
                          <Edit className="h-3 w-3 ml-1" aria-hidden="true" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={new Date(checkOut)}
                          onSelect={(date) => {
                            if (date) {
                              setCheckOut(date.toISOString().split('T')[0]);
                            }
                            setShowDatePicker(false);
                            setEditingDate(null);
                          }}
                          disabled={(date) => date <= new Date(checkIn)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                {/* Guests and Rate Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-accent" aria-hidden="true" />
                    <Popover open={showGuestSelector} onOpenChange={setShowGuestSelector} data-testid="guest-selector-popover">
                      <PopoverTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="text-luxury-xs font-serif font-normal tracking-luxury-tight p-1 h-auto text-foreground hover:bg-muted/50"
                          data-testid="edit-guest-count"
                          aria-label="Edit guest count"
                        >
                          {guests} guest{guests !== "1" ? 's' : ''}
                          <Edit className="h-3 w-3 ml-1" aria-hidden="true" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-48" align="start" data-testid="guest-selector-content">
                        <Select value={guests} onValueChange={(value) => {
                          setGuests(value);
                          setShowGuestSelector(false);
                        }} data-testid="guest-selector">
                          <SelectTrigger data-testid="guest-selector-trigger" aria-label="Select number of guests">
                            <SelectValue placeholder="Select guests" />
                          </SelectTrigger>
                          <SelectContent data-testid="guest-selector-options">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                              <SelectItem key={num} value={num.toString()} data-testid={`guest-option-${num}`}>
                                {num} guest{num !== 1 ? 's' : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </PopoverContent>
                    </Popover>
                    <span className="text-luxury-xs font-serif font-normal text-muted-foreground">•</span>
                    <span className="text-luxury-xs font-serif font-normal tracking-luxury-tight text-foreground">
                      {nights} night{nights !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-luxury-sm font-serif font-normal tracking-luxury-tight text-foreground">
                      {formatCurrency(baseRate)}/night
                    </div>
                    <div className="text-luxury-xs font-serif font-normal tracking-luxury-tight text-primary">
                      Total: {formatCurrency(total)}
                    </div>
                  </div>
                </div>
                
                {/* Ratings */}
                <div className="flex items-center justify-center pt-1" data-testid="property-rating-section">
                  <Star className="h-4 w-4 text-accent mr-1 fill-current" aria-hidden="true" />
                  {property?.rating ? (
                    <span className="text-luxury-xs font-serif font-normal tracking-luxury-tight text-foreground">
                      {property.rating} ({property?.review_count || 0} reviews)
                    </span>
                  ) : (
                    <span className="text-luxury-xs font-serif font-normal text-muted-foreground">No reviews yet</span>
                  )}
                  {property?.is_superhost && (
                    <Badge variant="secondary" className="ml-2 text-luxury-xs font-serif font-normal">
                      Superhost
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Security & Trust Indicators */}
      <div className="fixed bottom-4 left-4 right-4 z-20 md:hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 4, duration: 0.5 }}
          className="flex justify-center space-x-2"
        >
          <Badge variant="outline" className="bg-card/95 backdrop-blur-sm text-luxury-xs font-serif font-normal pointer-events-auto border-border" data-testid="security-badge">
            <Shield className="h-3 w-3 mr-1" aria-hidden="true" />
            Secure
          </Badge>
          <Badge variant="outline" className="bg-card/95 backdrop-blur-sm text-luxury-xs font-serif font-normal pointer-events-auto border-border" data-testid="instant-badge">
            <Zap className="h-3 w-3 mr-1" aria-hidden="true" />
            Instant
          </Badge>
          {(property?.rating && parseFloat(property.rating) >= 4.5) && (
            <Badge variant="outline" className="bg-card/95 backdrop-blur-sm text-luxury-xs font-serif font-normal pointer-events-auto border-border" data-testid="rating-badge">
              <Heart className="h-3 w-3 mr-1" aria-hidden="true" />
              {property.rating}★ Host
            </Badge>
          )}
        </motion.div>
      </div>

    </div>
  );
}