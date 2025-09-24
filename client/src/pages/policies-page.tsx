import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileText, Shield, Calendar, Home } from "lucide-react";
import { useSEO, useSEOSettings, generateOrganizationSchema, generateBreadcrumbSchema } from "@/lib/seo-utils";

export default function PoliciesPage() {
  // Get SEO settings for schema generation
  const { seoSettings } = useSEOSettings();

  // SEO implementation for policies page using database-driven content
  useSEO({
    pageType: "policies",
    keywords: "vacation rental policies Oahu, booking terms Hawaii, house rules Beach House rental, cancellation policy, rental agreement terms",
    twitterCard: "summary",
    canonical: "https://vacationrentaloahu.co/policies",
    structuredData: seoSettings ? [
      generateOrganizationSchema(seoSettings),
      generateBreadcrumbSchema([
        { name: "Home", url: "/" },
        { name: "Policies & Terms", url: "/policies" }
      ])
    ] : []
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main id="main-content" className="pt-28 pb-16">
        {/* Hero Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-luxury-4xl md:text-luxury-5xl font-serif font-normal text-foreground mb-6 leading-tight tracking-luxury-tight">
              Policies & Terms
            </h1>
            <p className="text-luxury-lg text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
              Important information about booking policies, terms of service, and house rules 
              for your stay at our Beach House Oahu property.
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 -mt-8">
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Cancellation Policy */}
            <Card id="cancellation" className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-luxury-2xl font-serif font-normal tracking-luxury-tight">
                  <Calendar className="h-6 w-6 mr-3 text-coral-500" />
                  Cancellation Policy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-serif font-normal text-foreground mb-3">Free Cancellation</h3>
                  <p className="text-muted-foreground mb-4">
                    Cancel your booking for free within 48 hours of confirmation, provided your check-in 
                    date is at least 14 days away.
                  </p>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-serif font-normal text-foreground mb-3">Moderate Cancellation</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Full refund for cancellations made 5+ days before check-in</li>
                    <li>• 50% refund for cancellations made 2-4 days before check-in</li>
                    <li>• No refund for cancellations made within 1 day of check-in</li>
                    <li>• No refund for no-shows</li>
                  </ul>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-serif font-normal text-foreground mb-3">Extenuating Circumstances</h3>
                  <p className="text-muted-foreground">
                    We understand that unexpected events can occur. In cases of extenuating circumstances 
                    such as natural disasters, medical emergencies, or government travel restrictions, 
                    we may offer additional flexibility on a case-by-case basis.
                  </p>
                </div>

                <div className="bg-coral-50 p-4 rounded-lg">
                  <p className="text-sm text-coral-800">
                    <strong>Note:</strong> Cancellation policies may vary during peak seasons and holidays. 
                    Always review the specific policy for your dates during booking.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* House Rules */}
            <Card id="house-rules" className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-2xl">
                  <Home className="h-6 w-6 mr-3 text-emerald-500" />
                  House Rules
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="font-serif font-normal text-foreground mb-2">Check-in / Check-out</h3>
                    <p className="text-muted-foreground text-sm">Check-in: 3:00 PM or later</p>
                    <p className="text-muted-foreground text-sm">Check-out: 10:00 AM or earlier</p>
                  </div>
                  
                  <div>
                    <h3 className="font-serif font-normal text-foreground mb-2">Maximum Guests</h3>
                    <p className="text-muted-foreground text-sm">8 guests maximum</p>
                    <p className="text-muted-foreground text-sm">No additional visitors without permission</p>
                  </div>
                  
                  <div>
                    <h3 className="font-serif font-normal text-foreground mb-2">No Smoking</h3>
                    <p className="text-muted-foreground text-sm">Smoking prohibited</p>
                    <p className="text-muted-foreground text-sm">Anywhere on the property</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-serif font-normal text-foreground mb-3">Additional Rules</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• No parties or events without prior written approval</li>
                    <li>• Quiet hours from 10:00 PM to 8:00 AM</li>
                    <li>• Pets allowed with prior approval and additional cleaning fee</li>
                    <li>• Outdoor areas must be secured when not supervised</li>
                    <li>• Respect neighbors and comply with local noise ordinances</li>
                    <li>• Report any damages or issues immediately</li>
                    <li>• Follow all posted safety guidelines for beach access</li>
                  </ul>
                </div>

                <div className="bg-emerald-50 p-4 rounded-lg">
                  <h4 className="font-serif font-normal text-emerald-800 mb-2">Beach Safety</h4>
                  <ul className="text-sm text-emerald-700 space-y-1">
                    <li>• Children must be supervised at all times near water</li>
                    <li>• Use provided safety equipment when at the beach</li>
                    <li>• Be aware of ocean conditions and posted warnings</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Terms of Service */}
            <Card id="terms" className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-2xl">
                  <FileText className="h-6 w-6 mr-3 text-ocean-500" />
                  Terms of Service
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-serif font-normal text-foreground mb-3">Booking Agreement</h3>
                  <p className="text-muted-foreground mb-4">
                    By making a reservation, you agree to these terms and conditions. The guest who makes 
                    the booking is responsible for all guests in the party and for ensuring all rules are followed.
                  </p>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-serif font-normal text-foreground mb-3">Payment Terms</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Full payment is required at time of booking</li>
                    <li>• All payments are processed securely through Stripe</li>
                    <li>• Rates are quoted in US Dollars (USD)</li>
                    <li>• Additional fees may apply for extended stays or special services</li>
                  </ul>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-serif font-normal text-foreground mb-3">Liability and Insurance</h3>
                  <p className="text-muted-foreground mb-4">
                    Guests acknowledge that they use the property at their own risk. We recommend 
                    purchasing travel insurance. The property owner and management company are not 
                    liable for accidents, injuries, or loss of personal belongings.
                  </p>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-serif font-normal text-foreground mb-3">Damage and Security Deposit</h3>
                  <p className="text-muted-foreground">
                    Guests are responsible for any damage beyond normal wear and tear. While we don't 
                    require a security deposit upfront, we reserve the right to charge for damages 
                    after your stay. Please report any pre-existing damage upon arrival.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Privacy Policy */}
            <Card id="privacy" className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-2xl">
                  <Shield className="h-6 w-6 mr-3 text-coral-500" />
                  Privacy Policy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-serif font-normal text-foreground mb-3">Information We Collect</h3>
                  <p className="text-muted-foreground mb-4">
                    We collect information necessary to process your booking and provide our services, including:
                  </p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Name, email address, and phone number</li>
                    <li>• Payment information (processed securely by Stripe)</li>
                    <li>• Communication preferences and special requests</li>
                    <li>• Usage data to improve our services</li>
                  </ul>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-serif font-normal text-foreground mb-3">How We Use Your Information</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• To process bookings and provide customer service</li>
                    <li>• To send booking confirmations and important updates</li>
                    <li>• To improve our website and services</li>
                    <li>• To comply with legal requirements</li>
                  </ul>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-serif font-normal text-foreground mb-3">Data Security</h3>
                  <p className="text-muted-foreground">
                    We implement appropriate security measures to protect your personal information. 
                    Payment data is processed by Stripe and never stored on our servers. We do not 
                    sell, trade, or share your personal information with third parties except as 
                    necessary to provide our services.
                  </p>
                </div>

                <div className="bg-ocean-50 p-4 rounded-lg">
                  <p className="text-sm text-ocean-800">
                    <strong>Contact Us:</strong> If you have questions about these policies, please contact us at 
                    <a href="mailto:hello@vacationrentaloahu.co" className="text-ocean-600 hover:underline ml-1">
                      hello@vacationrentaloahu.co
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="bg-tropical-gradient text-white">
              <CardContent className="pt-6">
                <div className="text-center">
                  <h3 className="text-xl font-serif font-normal mb-4">Questions About Our Policies?</h3>
                  <p className="text-white/90 mb-6">
                    We're here to help clarify any questions you may have about our policies, 
                    terms, or booking process.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a 
                      href="mailto:hello@vacationrentaloahu.co"
                      className="bg-white text-ocean-600 hover:bg-white/90 px-6 py-2 rounded-lg font-serif font-normal transition-colors"
                    >
                      Email Us
                    </a>
                    <a 
                      href="tel:+12089959516"
                      className="bg-white/20 text-white hover:bg-white/30 px-6 py-2 rounded-lg font-serif font-normal transition-colors border border-white/30"
                    >
                      Call (208) 995-9516
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="container mx-auto px-4 mt-12">
          <div className="text-center text-sm text-muted-foreground max-w-2xl mx-auto">
            <p className="mb-2">
              <strong>Last updated:</strong> September 17, 2024
            </p>
            <p>
              VacationRentalOahu.co | All policies subject to change with notice
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
