import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Mail, Phone, Instagram, Facebook, Twitter } from "lucide-react";
import logoPath from "@assets/Vacation Rental Oahu Logo_1758651723145.png";
import type { SiteInfoSettings } from "@/lib/seo-utils";

export function Footer() {
  const currentYear = new Date().getFullYear();

  // Get site settings for dynamic footer content
  const { data: siteSettings } = useQuery<SiteInfoSettings>({
    queryKey: ['/api/settings/site_info'],
    retry: false,
  });

  return (
    <footer 
      id="footer"
      className="bg-card border-t border-border py-12"
      role="contentinfo"
      aria-label="Site footer"
    >
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <img 
                src={logoPath} 
                alt="Vacation Rental Oahu - Luxury Oceanfront Beach House" 
                className="h-10 w-auto" 
              />
            </div>
            <p className="text-luxury-sm font-serif text-muted-foreground tracking-luxury-tight">
              {siteSettings?.site_description || 'Your perfect vacation rental experience.'}
            </p>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="font-serif font-normal text-foreground mb-4 tracking-luxury-tight text-luxury-sm uppercase">Quick Links</h3>
            <ul className="space-y-2 text-luxury-sm font-serif tracking-luxury-tight">
              <li>
                <Link 
                  href="/" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                  data-testid="footer-home"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  href="/stay" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                  data-testid="footer-stay"
                >
                  Stay
                </Link>
              </li>
              <li>
                <Link 
                  href="/stay#gallery" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                  data-testid="footer-gallery"
                >
                  Gallery
                </Link>
              </li>
              <li>
                <Link 
                  href="/contact" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                  data-testid="footer-contact"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Policies */}
          <div>
            <h3 className="font-serif font-normal text-foreground mb-4 tracking-luxury-tight text-luxury-sm uppercase">Policies</h3>
            <ul className="space-y-2 text-luxury-sm font-serif tracking-luxury-tight">
              <li>
                <a 
                  href="/policies#cancellation" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                  data-testid="footer-cancellation"
                >
                  Cancellation Policy
                </a>
              </li>
              <li>
                <a 
                  href="/policies#terms" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                  data-testid="footer-terms"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a 
                  href="/policies#privacy" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                  data-testid="footer-privacy"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a 
                  href="/policies#house-rules" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                  data-testid="footer-house-rules"
                >
                  House Rules
                </a>
              </li>
            </ul>
          </div>
          
          {/* Connect */}
          <div>
            <h3 className="font-serif font-normal text-foreground mb-4 tracking-luxury-tight text-luxury-sm uppercase">Connect</h3>
            <div className="flex space-x-4 mb-4">
              {siteSettings?.social_links?.instagram && (
                <a 
                  href={siteSettings.social_links.instagram} 
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label="Instagram"
                  data-testid="footer-instagram"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {siteSettings?.social_links?.facebook && (
                <a 
                  href={siteSettings.social_links.facebook} 
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label="Facebook"
                  data-testid="footer-facebook"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {siteSettings?.social_links?.twitter && (
                <a 
                  href={siteSettings.social_links.twitter} 
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label="Twitter"
                  data-testid="footer-twitter"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Twitter className="h-5 w-5" />
                </a>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                {siteSettings?.contact_email || 'contact@example.com'}
              </p>
              <p className="text-muted-foreground flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                {siteSettings?.contact_phone || '+1 (555) 123-4567'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} {siteSettings?.site_name || 'Vacation Rental'}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
