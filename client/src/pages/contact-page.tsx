import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Mail, Phone, MapPin, Clock, Send, Loader2, MessageCircle } from "lucide-react";
import { useSEO, useSEOSettings, generateOrganizationSchema, generateBreadcrumbSchema } from "@/lib/seo-utils";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactForm = z.infer<typeof contactSchema>;

export default function ContactPage() {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Get SEO settings for schema generation
  const { seoSettings } = useSEOSettings();

  // Get site settings for dynamic content
  const { data: siteSettings } = useQuery<any>({
    queryKey: ['/api/settings/site_info'],
    retry: false,
  });

  // SEO implementation for contact page using database-driven content
  useSEO({
    pageType: "contact",
    // keywords and canonical will be handled dynamically by SEO settings
    twitterCard: "summary_large_image",
    structuredData: seoSettings ? [
      generateOrganizationSchema(seoSettings, siteSettings as any),
      generateBreadcrumbSchema([
        { name: "Home", url: "/" },
        { name: "Contact", url: "/contact" }
      ])
    ] : []
  });

  const form = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const contactMutation = useMutation({
    mutationFn: async (data: ContactForm) => {
      const response = await apiRequest("POST", "/api/contact", data);
      return response.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      form.reset();
      toast({
        title: "Message Sent!",
        description: "Thank you for contacting us. We'll get back to you soon.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Send Message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContactForm) => {
    contactMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main id="main-content" className="pt-28 pb-16">
        {/* Hero Section */}
        <section className="py-16 bg-tropical-gradient text-white">
          <div className="container mx-auto mobile-container-padding text-center">
            <h1 className="text-luxury-4xl md:text-luxury-5xl font-serif font-normal mb-6 leading-tight tracking-luxury-tight">
              Get in Touch
            </h1>
            <p className="text-luxury-lg text-white/90 max-w-2xl mx-auto font-light leading-relaxed">
              Have questions about our Beach House Oahu property or need assistance with your booking? 
              We're here to help make your Hawaiian vacation perfect.
            </p>
          </div>
        </section>

        <div className="container mx-auto mobile-container-padding -mt-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-luxury-2xl font-serif font-normal tracking-luxury-tight">
                    <MessageCircle className="h-6 w-6 mr-3 text-coral-500" />
                    Send us a message
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isSubmitted ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Send className="h-8 w-8 text-emerald-600" />
                      </div>
                      <h3 className="text-luxury-xl font-serif font-normal text-foreground mb-2 tracking-luxury-tight">Message Sent!</h3>
                      <p className="text-muted-foreground mb-6">
                        Thank you for reaching out. We'll respond to your inquiry within 24 hours.
                      </p>
                      <Button 
                        onClick={() => setIsSubmitted(false)}
                        variant="bronze"
                        className="btn-bronze-enhanced font-serif font-normal tracking-luxury-tight"
                        data-testid="send-another-message"
                      >
                        Send another message
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Name *</Label>
                          <Input
                            id="name"
                            {...form.register("name")}
                            data-testid="input-name"
                          />
                          {form.formState.errors.name && (
                            <p className="text-sm text-destructive">
                              {form.formState.errors.name.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email">Email *</Label>
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
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                          id="subject"
                          placeholder="Booking inquiry, property question, etc."
                          {...form.register("subject")}
                          data-testid="input-subject"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">Message *</Label>
                        <Textarea
                          id="message"
                          rows={5}
                          placeholder="Tell us how we can help you..."
                          {...form.register("message")}
                          data-testid="input-message"
                        />
                        {form.formState.errors.message && (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.message.message}
                          </p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        variant="bronze"
                        className="w-full btn-bronze-enhanced font-serif font-normal tracking-luxury-tight"
                        disabled={contactMutation.isPending}
                        data-testid="submit-button"
                      >
                        {contactMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Sending message...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Send message
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-luxury-xl">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-coral-100 rounded-lg flex items-center justify-center">
                      <Mail className="h-5 w-5 text-coral-600" />
                    </div>
                    <div>
                      <h3 className="font-serif font-normal text-foreground">Email</h3>
                      <p className="text-muted-foreground">{siteSettings?.contact_email || 'hello@vacationrentaloahu.co'}</p>
                      <p className="text-sm text-muted-foreground">We respond within 24 hours</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Phone className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-serif font-normal text-foreground">Phone</h3>
                      <p className="text-muted-foreground">{siteSettings?.contact_phone || '(208) 995-9516'}</p>
                      <p className="text-sm text-muted-foreground">9 AM - 6 PM HST</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-ocean-100 rounded-lg flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-ocean-600" />
                    </div>
                    <div>
                      <h3 className="font-serif font-normal text-foreground">Location</h3>
                      <p className="text-muted-foreground">Kaneohe, Hawaii</p>
                      <p className="text-sm text-muted-foreground">Exact address after booking</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-luxury-xl">
                    <Clock className="h-5 w-5 mr-2 text-coral-500" />
                    Response Times
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Email inquiries</span>
                    <span className="font-serif font-normal text-foreground">&lt; 24 hours</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Booking questions</span>
                    <span className="font-serif font-normal text-foreground">&lt; 4 hours</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Emergency support</span>
                    <span className="font-serif font-normal text-foreground">&lt; 1 hour</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3 className="font-serif font-normal text-foreground mb-2">Aloha Properties</h3>
                    <div className="flex items-center justify-center mb-3">
                      <div className="flex text-yellow-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className="text-lg">★</span>
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-muted-foreground">4.98 · 247 reviews</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Superhost with 5+ years of experience providing exceptional 
                      Hawaiian vacation experiences.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-tropical-gradient text-white">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3 className="font-serif font-normal mb-2">Ready to book?</h3>
                    <p className="text-white/90 text-sm mb-4">
                      Skip the wait and secure your dates today. 
                      Our Beach House Oahu property books up quickly!
                    </p>
                    <Button variant="bronze" className="btn-bronze-enhanced font-serif font-normal tracking-luxury-tight" data-testid="book-now-cta">
                      Book Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
