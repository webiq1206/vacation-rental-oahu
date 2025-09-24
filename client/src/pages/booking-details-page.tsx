import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatCurrency, type PricingBreakdown } from "@/lib/pricing-utils";
import { Loader2, ArrowLeft, Star, Users, Calendar } from "lucide-react";

const guestInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(1, "Phone number is required"),
  specialRequests: z.string().optional(),
});

type GuestInfoForm = z.infer<typeof guestInfoSchema>;

interface BookingData {
  bookingId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  total: string;
  currency: string;
  nights: number;
  nightlyRate: string;
  breakdown: PricingBreakdown['breakdown'];
}

export default function BookingDetailsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const storedBooking = sessionStorage.getItem("pendingBooking");
    if (!storedBooking) {
      toast({
        title: "Booking Not Found",
        description: "No pending booking found. Please start a new booking.",
        variant: "destructive",
      });
      setLocation("/booking");
      return;
    }

    try {
      const data = JSON.parse(storedBooking);
      setBookingData(data);
    } catch (error) {
      toast({
        title: "Invalid Booking Data",
        description: "The booking data is corrupted. Please start a new booking.",
        variant: "destructive",
      });
      setLocation("/booking");
    }
  }, [setLocation, toast]);

  const form = useForm<GuestInfoForm>({
    resolver: zodResolver(guestInfoSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      specialRequests: "",
    },
  });

  const onSubmit = async (data: GuestInfoForm) => {
    if (!bookingData) return;

    setIsLoading(true);
    
    try {
      // Store guest info in session storage
      sessionStorage.setItem("guestInfo", JSON.stringify(data));
      
      // Navigate to checkout
      setLocation("/booking/checkout");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process guest information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-28 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const nights = Math.ceil((new Date(bookingData.checkOut).getTime() - new Date(bookingData.checkIn).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-28 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              className="mb-4" 
              onClick={() => setLocation("/booking")}
              data-testid="back-button"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to booking
            </Button>
            
            <h1 className="text-3xl md:text-4xl font-serif font-normal text-foreground mb-2">
              Confirm and pay
            </h1>
            <p className="text-muted-foreground">
              Review your booking details and complete your reservation.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Guest Information Form */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Your information</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First name *</Label>
                        <Input
                          id="firstName"
                          {...form.register("firstName")}
                          data-testid="input-first-name"
                        />
                        {form.formState.errors.firstName && (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.firstName.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last name *</Label>
                        <Input
                          id="lastName"
                          {...form.register("lastName")}
                          data-testid="input-last-name"
                        />
                        {form.formState.errors.lastName && (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.lastName.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email address *</Label>
                      <Input
                        id="email"
                        type="email"
                        {...form.register("email")}
                        data-testid="input-email"
                      />
                      {form.formState.errors.email && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        {...form.register("phone")}
                        data-testid="input-phone"
                      />
                      {form.formState.errors.phone && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.phone.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="specialRequests">Special requests (optional)</Label>
                      <textarea
                        id="specialRequests"
                        {...form.register("specialRequests")}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                        rows={3}
                        placeholder="Any special requests or accessibility needs?"
                        data-testid="input-special-requests"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full btn-bronze text-white font-semibold py-3"
                      disabled={isLoading}
                      data-testid="continue-button"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Continue to payment"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Policies */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Good to know</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Cancellation policy</h4>
                    <p className="text-muted-foreground">
                      Free cancellation for 48 hours after booking. Cancel before check-in for a partial refund.
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-medium text-foreground mb-2">House rules</h4>
                    <ul className="text-muted-foreground space-y-1">
                      <li>• Check-in: 4:00 PM or later</li>
                      <li>• Check-out: 11:00 AM</li>
                      <li>• No smoking, parties, or events</li>
                      <li>• Maximum 8 guests</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Booking Summary */}
            <div>
              <div className="sticky top-24">
                <Card>
                  <CardHeader>
                    <CardTitle>Booking summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Property Info */}
                    <div className="flex space-x-4">
                      <img
                        src="https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=100"
                        alt="Beach House preview"
                        className="w-20 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">Luxury Ocean View Beach House</h3>
                        <div className="flex items-center mt-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                          <span className="text-sm font-medium">Not yet rated</span>
                        </div>
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 mt-1">
                          Superhost
                        </Badge>
                      </div>
                    </div>

                    <Separator />

                    {/* Booking Details */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-muted-foreground mr-2" />
                          <span className="text-sm text-foreground">Dates</span>
                        </div>
                        <span className="text-sm text-foreground">
                          {formatDate(bookingData.checkIn)} - {formatDate(bookingData.checkOut)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 text-muted-foreground mr-2" />
                          <span className="text-sm text-foreground">Guests</span>
                        </div>
                        <span className="text-sm text-foreground">
                          {bookingData.guests} {bookingData.guests === 1 ? "guest" : "guests"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground">Nights</span>
                        <span className="text-sm text-foreground">{nights}</span>
                      </div>
                    </div>

                    <Separator />

                    {/* Price Breakdown */}
                    <div className="space-y-2">
                      {bookingData.breakdown && bookingData.breakdown.length > 0 ? (
                        bookingData.breakdown.map((item) => (
                          <div key={item.label} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{item.label}</span>
                            <span className="text-foreground">{item.amount}</span>
                          </div>
                        ))
                      ) : (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              {formatCurrency(bookingData.nightlyRate || '450')} x {nights} nights
                            </span>
                            <span className="text-foreground">
                              {formatCurrency((parseFloat(bookingData.nightlyRate || '450') * nights).toFixed(2))}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Cleaning fee</span>
                            <span className="text-foreground">$150</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Service fee</span>
                            <span className="text-foreground">$50</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Taxes</span>
                            <span className="text-foreground">$125</span>
                          </div>
                        </>
                      )}
                    </div>

                    <Separator />

                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total ({bookingData.currency})</span>
                      <span data-testid="total-amount">{formatCurrency(bookingData.total)}</span>
                    </div>
                  </CardContent>
                </Card>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  By continuing, you agree to our Terms of Service and Privacy Policy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
