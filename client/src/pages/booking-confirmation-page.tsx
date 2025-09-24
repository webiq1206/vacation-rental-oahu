import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Calendar, Users, MapPin, Phone, Mail, Download, Share2 } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/pricing-utils";
import { Link } from "wouter";

interface BookingConfirmation {
  id: string;
  status: string;
  start_date: string;
  end_date: string;
  guests: number;
  nights: number;
  total: string;
  currency: string;
  guests_info?: Array<{
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    is_primary: boolean;
  }>;
  property?: {
    title: string;
    address: string;
    check_in_time: string;
    check_out_time: string;
  };
}

export default function BookingConfirmationPage() {
  const [, setLocation] = useLocation();
  const [bookingId, setBookingId] = useState<string | null>(null);

  useEffect(() => {
    // Get booking ID from URL params or session storage
    const urlParams = new URLSearchParams(window.location.search);
    const paymentIntentId = urlParams.get('payment_intent');
    
    if (paymentIntentId) {
      // In a real implementation, you'd fetch the booking ID from the payment intent
      const storedBooking = sessionStorage.getItem("pendingBooking");
      if (storedBooking) {
        const bookingData = JSON.parse(storedBooking);
        setBookingId(bookingData.bookingId);
        // Clear session storage after successful booking
        sessionStorage.removeItem("pendingBooking");
        sessionStorage.removeItem("guestInfo");
      }
    } else {
      setLocation("/");
    }
  }, [setLocation]);

  const { data: booking, isLoading } = useQuery<BookingConfirmation>({
    queryKey: ["/api/bookings", bookingId],
    enabled: !!bookingId,
  });

  if (isLoading || !booking) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-28 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <p className="text-lg text-foreground">Loading your confirmation...</p>
          </div>
        </div>
      </div>
    );
  }

  const primaryGuest = booking.guests_info?.find(g => g.is_primary);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-28 pb-16">
        <div className="container mx-auto mobile-container-padding max-w-4xl">
          {/* Success Header */}
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-emerald-600" />
            </div>
            <h1 className="text-luxury-3xl md:text-luxury-4xl font-serif font-normal text-foreground mb-4 tracking-luxury-tight">
              Booking Confirmed!
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              Aloha {primaryGuest?.first_name}! Your tropical paradise awaits.
            </p>
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 text-sm px-3 py-1">
              Confirmation #{booking.id.slice(0, 8).toUpperCase()}
            </Badge>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Booking Details */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-luxury-xl">
                    <Calendar className="h-5 w-5 mr-2 text-coral-600" />
                    Your stay details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-serif font-normal text-foreground mb-1">Check-in</h4>
                      <p className="text-lg text-foreground">{formatDate(booking.start_date)}</p>
                      <p className="text-sm text-muted-foreground">
                        {booking.property?.check_in_time ? `After ${booking.property.check_in_time}` : 'Check-in time TBD'}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-serif font-normal text-foreground mb-1">Check-out</h4>
                      <p className="text-lg text-foreground">{formatDate(booking.end_date)}</p>
                      <p className="text-sm text-muted-foreground">
                        {booking.property?.check_out_time ? `Before ${booking.property.check_out_time}` : 'Check-out time TBD'}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-serif font-normal text-foreground mb-1">Guests</h4>
                      <p className="text-lg text-foreground">
                        {booking.guests} {booking.guests === 1 ? "guest" : "guests"}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-serif font-normal text-foreground mb-1">Nights</h4>
                      <p className="text-lg text-foreground">{booking.nights}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-luxury-xl">
                    <MapPin className="h-5 w-5 mr-2 text-emerald-600" />
                    Property location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <h3 className="font-semibold text-foreground mb-2">
                    {booking.property?.title || "Beach House Ocean View Vacation Rental"}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {booking.property?.address || "1234 Tropical Paradise Lane, Honolulu, HI 96815"}
                  </p>
                  <div className="bg-emerald-50 p-4 rounded-lg">
                    <h4 className="font-medium text-emerald-800 mb-2">Check-in instructions</h4>
                    <p className="text-sm text-emerald-700">
                      You'll receive detailed check-in instructions via email 24 hours before your arrival. 
                      The property features self check-in with a smart lock for your convenience.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-luxury-xl">
                    <Users className="h-5 w-5 mr-2 text-ocean-600" />
                    Guest information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {primaryGuest && (
                    <div className="space-y-2">
                      <p className="font-medium text-foreground">
                        {primaryGuest.first_name} {primaryGuest.last_name}
                      </p>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Mail className="h-4 w-4 mr-2" />
                        <span>{primaryGuest.email}</span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Phone className="h-4 w-4 mr-2" />
                        <span>{primaryGuest.phone}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Payment Summary & Actions */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-luxury-xl">Payment summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="text-foreground">{formatCurrency(450 * booking.nights)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Cleaning fee</span>
                      <span className="text-foreground">{formatCurrency(150)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Service fee</span>
                      <span className="text-foreground">{formatCurrency(450 * booking.nights * 0.15)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Taxes</span>
                      <span className="text-foreground">{formatCurrency((450 * booking.nights + 150 + 450 * booking.nights * 0.15) * 0.1216)}</span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total paid</span>
                      <span className="text-emerald-600" data-testid="total-paid">
                        {formatCurrency(booking.total)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-emerald-50 rounded-lg text-center">
                    <p className="text-sm text-emerald-700 font-medium">
                      ✓ Payment successful - Receipt sent to {primaryGuest?.email}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-luxury-xl">Next steps</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-coral-500 rounded-full mt-2" />
                      <div>
                        <p className="font-medium text-foreground">Confirmation email sent</p>
                        <p className="text-muted-foreground">Check your inbox for booking details and receipt.</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2" />
                      <div>
                        <p className="font-medium text-foreground">Check-in instructions</p>
                        <p className="text-muted-foreground">You'll receive detailed instructions 24 hours before arrival.</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-ocean-500 rounded-full mt-2" />
                      <div>
                        <p className="font-medium text-foreground">Host contact</p>
                        <p className="text-muted-foreground">Your host will reach out with local recommendations.</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" size="sm" data-testid="download-receipt">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button variant="outline" size="sm" data-testid="share-booking">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="text-center space-y-4">
                <Link href="/">
                  <Button className="btn-bronze text-white" data-testid="back-home">
                    Back to Home
                  </Button>
                </Link>
                <p className="text-sm text-muted-foreground">
                  Questions? Contact us at{" "}
                  <a href="mailto:hello@vacationrentaloahu.co" className="text-primary hover:underline">
                    hello@vacationrentaloahu.co
                  </a>
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
