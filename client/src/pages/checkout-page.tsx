import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobilePaymentForm } from "@/components/booking/mobile-payment-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatDate, formatCurrency, type PricingBreakdown } from "@/lib/pricing-utils";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, ArrowLeft } from "lucide-react";

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || "");

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

interface GuestInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialRequests?: string;
}

interface CheckoutFormProps {
  clientSecret: string;
  backendBookingId: string;
}

function CheckoutForm({ clientSecret, backendBookingId }: CheckoutFormProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [guestInfo, setGuestInfo] = useState<GuestInfo | null>(null);

  useEffect(() => {
    const storedBooking = sessionStorage.getItem("pendingBooking");
    const storedGuest = sessionStorage.getItem("guestInfo");

    if (!storedBooking || !storedGuest) {
      toast({
        title: "Missing Information",
        description: "Please complete the booking details first.",
        variant: "destructive",
      });
      setLocation("/booking");
      return;
    }

    try {
      setBookingData(JSON.parse(storedBooking));
      setGuestInfo(JSON.parse(storedGuest));
    } catch (error) {
      toast({
        title: "Invalid Data",
        description: "The booking data is corrupted. Please start over.",
        variant: "destructive",
      });
      setLocation("/booking");
    }
  }, [setLocation, toast]);

  const handlePaymentSuccess = () => {
    // Clear session storage
    sessionStorage.removeItem("pendingBooking");
    sessionStorage.removeItem("guestInfo");
    
    // Store booking ID for confirmation page
    sessionStorage.setItem("confirmedBookingId", backendBookingId);
    
    // Payment successful, redirect to confirmation page
    setLocation("/booking/confirmation");
  };

  if (!bookingData || !guestInfo) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const nights = Math.ceil((new Date(bookingData.checkOut).getTime() - new Date(bookingData.checkIn).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="container mx-auto px-4 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Button 
          variant="ghost" 
          className="mb-4" 
          onClick={() => setLocation("/booking/details")}
          data-testid="back-button"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to details
        </Button>
        
        <h1 className="text-3xl md:text-4xl font-serif font-normal text-foreground mb-2">
          Complete your payment
        </h1>
        <p className="text-muted-foreground">
          {isMobile ? "Choose your preferred payment method below" : "Secure payment processed by Stripe. Your booking will be confirmed immediately."}
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Enhanced Payment Form with Apple Pay & Google Pay */}
        <div className="space-y-6">
          <MobilePaymentForm 
            onPaymentSuccess={handlePaymentSuccess}
            total={bookingData.total}
            currency={bookingData.currency}
          />

          {/* Security Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2" />
                  <div>
                    <p className="font-serif font-normal text-foreground">Secure payment</p>
                    <p className="text-muted-foreground">Your payment information is encrypted and secure.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-coral-500 rounded-full mt-2" />
                  <div>
                    <p className="font-serif font-normal text-foreground">Instant confirmation</p>
                    <p className="text-muted-foreground">You'll receive a confirmation email immediately after payment.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-ocean-500 rounded-full mt-2" />
                  <div>
                    <p className="font-serif font-normal text-foreground">Flexible cancellation</p>
                    <p className="text-muted-foreground">Free cancellation up to 48 hours before check-in.</p>
                  </div>
                </div>
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
                {/* Guest Info */}
                <div>
                  <h3 className="font-serif font-normal text-foreground mb-2">Guest information</h3>
                  <p className="text-sm text-foreground">{guestInfo.firstName} {guestInfo.lastName}</p>
                  <p className="text-sm text-muted-foreground">{guestInfo.email}</p>
                  <p className="text-sm text-muted-foreground">{guestInfo.phone}</p>
                </div>

                <Separator />

                {/* Property */}
                <div className="flex space-x-4">
                  <img
                    src="https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=100"
                    alt="Beach House preview"
                    className="w-20 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-serif font-normal text-foreground">Luxury Ocean View Beach House</h3>
                    <p className="text-sm text-muted-foreground">Honolulu, Hawaii</p>
                  </div>
                </div>

                <Separator />

                {/* Booking Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Check-in</span>
                    <span className="text-foreground">{formatDate(bookingData.checkIn)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Check-out</span>
                    <span className="text-foreground">{formatDate(bookingData.checkOut)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Guests</span>
                    <span className="text-foreground">{bookingData.guests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nights</span>
                    <span className="text-foreground">{nights}</span>
                  </div>
                </div>

                <Separator />

                {/* Price Breakdown */}
                <div className="space-y-2 text-sm">
                  {bookingData.breakdown && bookingData.breakdown.length > 0 ? (
                    bookingData.breakdown.map((item) => (
                      <div key={item.label} className="flex justify-between">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="text-foreground">{item.amount}</span>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {formatCurrency(bookingData.nightlyRate || '450')} x {nights} nights
                        </span>
                        <span className="text-foreground">
                          {formatCurrency((parseFloat(bookingData.nightlyRate || '450') * nights).toFixed(2))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cleaning fee</span>
                        <span className="text-foreground">$150</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Service fee</span>
                        <span className="text-foreground">$50</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Taxes</span>
                        <span className="text-foreground">$125</span>
                      </div>
                    </>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between font-serif font-normal text-lg">
                  <span>Total ({bookingData.currency})</span>
                  <span data-testid="final-total">{formatCurrency(bookingData.total)}</span>
                </div>

                {guestInfo.specialRequests && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-serif font-normal text-foreground mb-1">Special requests</h4>
                      <p className="text-sm text-muted-foreground">{guestInfo.specialRequests}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const [clientSecret, setClientSecret] = useState("");
  const [backendBookingId, setBackendBookingId] = useState("");
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const createBookingAndPaymentIntent = async () => {
      setIsCreatingBooking(true);
      
      try {
        const storedBooking = sessionStorage.getItem("pendingBooking");
        const storedGuest = sessionStorage.getItem("guestInfo");
        
        if (!storedBooking || !storedGuest) {
          toast({
            title: "Missing Information",
            description: "Please complete the booking details first.",
            variant: "destructive",
          });
          setLocation("/booking");
          return;
        }

        const bookingData = JSON.parse(storedBooking);
        const guestInfo = JSON.parse(storedGuest);

        // First create the booking in the backend
        let booking_id;
        try {
          const bookingResponse = await apiRequest('POST', '/api/bookings', {
            start_date: bookingData.checkIn,
            end_date: bookingData.checkOut,
            guests: bookingData.guests,
            guest_info: {
              first_name: guestInfo.firstName,
              last_name: guestInfo.lastName,
              email: guestInfo.email,
              phone: guestInfo.phone,
            },
          });
          const bookingResult = await bookingResponse.json();
          booking_id = bookingResult.booking_id;
        } catch (error) {
          // apiRequest throws on non-OK responses, try to get error message
          throw new Error(error instanceof Error ? error.message : 'Failed to create booking');
        }

        setBackendBookingId(booking_id);

        // Then create the payment intent
        let client_secret;
        try {
          const paymentResponse = await apiRequest('POST', '/api/create-payment-intent', { booking_id });
          const paymentResult = await paymentResponse.json();
          client_secret = paymentResult.client_secret;
        } catch (error) {
          // apiRequest throws on non-OK responses, try to get error message
          throw new Error(error instanceof Error ? error.message : 'Failed to create payment intent');
        }
        setClientSecret(client_secret);
      } catch (error) {
        console.error('Error creating booking and payment intent:', error);
        toast({
          title: "Payment Setup Failed",
          description: error instanceof Error ? error.message : "Unable to initialize payment. Please try again.",
          variant: "destructive",
        });
        setLocation("/booking/details");
      } finally {
        setIsCreatingBooking(false);
      }
    };

    createBookingAndPaymentIntent();
  }, [setLocation, toast]);

  if (isCreatingBooking || !clientSecret || !backendBookingId) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-20 flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-bronze-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="h-8 w-8 animate-spin text-bronze-600" />
            </div>
            <p className="text-lg text-muted-foreground font-serif font-normal">Setting up secure payment...</p>
            <p className="text-sm text-bronze-600">Creating your booking and preparing payment</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-16">
        <Elements 
          stripe={stripePromise} 
          options={{
            clientSecret,
            appearance: {
              theme: 'stripe',
              variables: {
                colorPrimary: 'hsl(43, 65%, 49%)',
                colorBackground: 'hsl(60, 9%, 98%)',
                colorText: 'hsl(195, 100%, 15%)',
                colorDanger: 'hsl(0, 84.2%, 60.2%)',
                borderRadius: '8px',
              }
            }
          }}
        >
          <CheckoutForm clientSecret={clientSecret} backendBookingId={backendBookingId} />
        </Elements>
      </main>

      <Footer />
    </div>
  );
}
