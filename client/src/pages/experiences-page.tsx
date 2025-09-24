import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { useSEO } from "@/lib/seo-utils";

export default function ExperiencesPage() {
  useSEO({
    title: "Hawaiian Experiences & Activities - VacationRentalOahu.co",
    description: "Discover amazing experiences and activities in Oahu. From snorkeling adventures to cultural tours, book your perfect Hawaiian experience.",
    keywords: "Oahu experiences, Hawaiian activities, Oahu adventures, Hawaii excursions, island tours"
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-28">
        {/* Hero Section */}
        <section className="section-padding-responsive bg-tropical-gradient text-white">
          <div className="container mx-auto mobile-container-padding text-center">
            <ScrollReveal>
              <h1 className="text-luxury-3xl sm:text-luxury-4xl lg:text-luxury-5xl font-serif font-normal mb-4 md:mb-6 tracking-luxury-tight">
                Hawaiian{" "}
                <span className="paradise-text text-white">
                  Experiences
                </span>
              </h1>
              <p className="text-luxury-xl text-white/90 mb-6 md:mb-8 max-w-3xl mx-auto leading-relaxed">
                Discover the magic of Oahu with unforgettable adventures, cultural experiences, 
                and breathtaking tours. From ocean adventures to island exploration, create memories that will last a lifetime.
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* Experiences Widget Section */}
        <section className="section-padding-responsive bg-background">
          <div className="container mx-auto mobile-container-padding">
            <ScrollReveal className="text-center mb-8 md:mb-12">
              <h2 className="text-luxury-2xl sm:text-luxury-3xl font-serif font-normal text-foreground mb-3 md:mb-4 tracking-luxury-tight">
                Book Your Adventure
              </h2>
              <p className="text-luxury-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Choose from hundreds of activities and experiences. All bookings are secure and backed by our customer guarantee.
              </p>
            </ScrollReveal>

            <ScrollReveal className="max-w-6xl mx-auto">
              <div className="luxury-card p-6 md:p-8 rounded-xl">
                <div 
                  data-vi-partner-id="P00269401" 
                  data-vi-widget-ref="W-a3edc128-6a3f-4f68-9491-52bf79666fa5"
                  className="min-h-[600px] w-full"
                ></div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Features Section */}
        <section className="section-padding-responsive bg-muted/30">
          <div className="container mx-auto mobile-container-padding">
            <ScrollReveal className="text-center mb-8 md:mb-12">
              <h2 className="text-luxury-2xl sm:text-luxury-3xl font-serif font-normal text-foreground mb-3 md:mb-4 tracking-luxury-tight">
                Why Book With Us
              </h2>
            </ScrollReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mobile-grid-gap-normal max-w-5xl mx-auto">
              <div className="text-center luxury-card p-6 rounded-xl">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-bronze-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <svg className="h-6 w-6 sm:h-8 sm:w-8 text-bronze-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-luxury-lg font-serif font-normal text-foreground mb-2 tracking-luxury-tight">Secure Booking</h3>
                <p className="text-luxury-base text-muted-foreground leading-relaxed">
                  All bookings are protected with secure payment processing and customer guarantee.
                </p>
              </div>

              <div className="text-center luxury-card p-6 rounded-xl">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-bronze-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <svg className="h-6 w-6 sm:h-8 sm:w-8 text-bronze-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-luxury-lg font-serif font-normal text-foreground mb-2 tracking-luxury-tight">Flexible Booking</h3>
                <p className="text-luxury-base text-muted-foreground leading-relaxed">
                  Many experiences offer free cancellation and flexible scheduling options.
                </p>
              </div>

              <div className="text-center luxury-card p-6 rounded-xl">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-bronze-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <svg className="h-6 w-6 sm:h-8 sm:w-8 text-bronze-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <h3 className="text-luxury-lg font-serif font-normal text-foreground mb-2 tracking-luxury-tight">Top Rated Tours</h3>
                <p className="text-luxury-base text-muted-foreground leading-relaxed">
                  Choose from thousands of verified reviews and top-rated local tour operators.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}