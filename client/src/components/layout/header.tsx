import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import logoDarkPath from "@assets/Vacation Rental Oahu Logo_1758651723145.png";
import logoWhitePath from "@assets/Vacation Rental Oahu Logo (3)_1758653857813.png";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Scroll detection for transparent-to-solid header transition (homepage only)
  useEffect(() => {
    const handleScroll = () => {
      // Only apply scroll behavior on homepage
      if (location !== '/') {
        setIsScrolled(true); // Always solid on non-homepage
        return;
      }
      
      const scrollTop = window.scrollY;
      const scrollThreshold = 80; // Trigger transition at 80px scroll
      setIsScrolled(scrollTop > scrollThreshold);
    };

    // Set initial state based on current scroll position and page
    handleScroll();

    // Add scroll event listener
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Cleanup event listener on unmount
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location]);

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Stay", href: "/stay" },
    { name: "Experiences", href: "/experiences" },
    { name: "Contact", href: "/contact" },
  ];

  const isActive = (href: string) => {
    if (href === "/" && location === "/") return true;
    if (href !== "/" && location.startsWith(href)) return true;
    return false;
  };

  // Handle escape key and focus management for mobile menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isMenuOpen) return;

      if (e.key === 'Escape') {
        setIsMenuOpen(false);
        menuButtonRef.current?.focus();
        return;
      }

      // Focus trap implementation for Tab/Shift+Tab
      if (e.key === 'Tab') {
        const focusableElements = mobileMenuRef.current?.querySelectorAll(
          'a, button, [tabindex]:not([tabindex="-1"])'
        );
        
        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        // If Shift+Tab and we're on the first element, go to last
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
        // If Tab and we're on the last element, go to first
        else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    if (isMenuOpen) {
      document.addEventListener('keydown', handleKeyDown);
      
      // Focus first focusable element when menu opens
      const firstFocusable = mobileMenuRef.current?.querySelector('a, button, [tabindex]:not([tabindex="-1"])');
      if (firstFocusable instanceof HTMLElement) {
        firstFocusable.focus();
      }

      // Prevent scrolling on background when menu is open
      document.body.style.overflow = 'hidden';
    } else {
      // Restore scrolling when menu is closed
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = ''; // Cleanup on unmount
    };
  }, [isMenuOpen]);

  return (
    <>
      {/* Skip Links */}
      <a 
        href="#main-content" 
        className="skip-link"
        data-testid="skip-to-main"
      >
        Skip to main content
      </a>
      <a 
        href="#footer" 
        className="skip-link"
        data-testid="skip-to-footer"
      >
        Skip to footer
      </a>
      
      <header 
        className={`fixed top-0 left-0 right-0 header-transition ${
          isMenuOpen ? 'z-50' : 'z-40'
        } ${
          isScrolled 
            ? 'header-solid' 
            : 'header-transparent'
        }`}
        role="banner"
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-bronze focus:ring-offset-2 focus:ring-offset-background rounded-lg" 
            data-testid="logo-link"
            aria-label="VacationRentalOahu.co - Return to homepage"
          >
            <img 
              src={isScrolled ? logoDarkPath : logoWhitePath} 
              alt="Vacation Rental Oahu - Luxury Oceanfront Beach House" 
              className="h-12 w-auto" 
              aria-hidden="true" 
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <nav 
              className="flex items-center space-x-6" 
              role="navigation" 
              aria-label="Main navigation"
            >
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`text-luxury-base font-serif font-normal tracking-luxury-tight uppercase transition-colors hover:text-accent focus:outline-none focus:ring-2 focus:ring-bronze focus:ring-offset-2 focus:ring-offset-background rounded px-3 py-2 ${
                  isActive(item.href) 
                    ? "text-accent" 
                    : isScrolled 
                      ? "text-foreground" 
                      : "text-white"
                }`}
                data-testid={`nav-${item.name.toLowerCase()}`}
                aria-current={isActive(item.href) ? 'page' : undefined}
              >
                {item.name}
              </Link>
            ))}
            </nav>
            
            {/* Book Now CTA */}
            <Link href="/booking">
              <Button 
                size="lg"
                variant="bronze"
                className="btn-bronze-enhanced font-serif font-normal tracking-luxury-tight touch-target-optimal"
                data-testid="book-now-cta"
              >
                Book Now
              </Button>
            </Link>
            
            {user && (
              <div className="flex items-center space-x-3">
                <Link
                  href="/admin"
                  className={`text-luxury-xs font-serif font-normal tracking-luxury-tight uppercase hover:text-accent transition-colors focus:outline-none focus:ring-2 focus:ring-bronze focus:ring-offset-2 focus:ring-offset-background rounded px-2 py-1 ${
                    isScrolled ? "text-muted-foreground" : "text-white/80"
                  }`}
                  data-testid="admin-link"
                >
                  Admin
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                  data-testid="logout-button"
                >
                  Logout
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            ref={menuButtonRef}
            variant="ghost"
            size="sm"
            className={`md:hidden touch-target focus:outline-none focus:ring-2 focus:ring-bronze focus:ring-offset-2 focus:ring-offset-background ${
              isScrolled ? "text-foreground" : "text-white"
            }`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            data-testid="mobile-menu-button"
          >
            {isMenuOpen ? <X className={`h-5 w-5 ${isScrolled ? "text-foreground" : "text-white"}`} aria-hidden="true" /> : <Menu className={`h-5 w-5 ${isScrolled ? "text-foreground" : "text-white"}`} aria-hidden="true" />}
          </Button>
        </div>
        
        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav 
            ref={mobileMenuRef}
            id="mobile-navigation"
            className={`md:hidden border-t transition-all duration-300 ease-in-out z-50 ${
              isScrolled 
                ? 'border-border bg-white/98 backdrop-blur-md' 
                : 'border-white/20 bg-white/90 backdrop-blur-sm'
            }`}
            role="navigation"
            aria-label="Mobile navigation"
          >
            <div className="px-4 py-6 space-y-6">
              {/* Mobile Book Now CTA */}
              <Link 
                href="/booking"
                onClick={() => setIsMenuOpen(false)}
              >
                <Button 
                  size="lg"
                  variant="bronze"
                  className="w-full btn-bronze-enhanced font-serif font-normal tracking-luxury-tight py-3 touch-target-optimal"
                  data-testid="mobile-book-now-cta"
                >
                  Book Now
                </Button>
              </Link>
              
              {/* Navigation Links */}
              <div className="space-y-3">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`block text-luxury-lg font-serif font-normal tracking-luxury-tight uppercase transition-colors hover:text-accent focus:outline-none focus:ring-2 focus:ring-bronze focus:ring-offset-2 focus:ring-offset-background rounded px-3 py-3 touch-target ${
                      isActive(item.href) ? "text-accent" : "text-foreground"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                    data-testid={`mobile-nav-${item.name.toLowerCase()}`}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
              
              {user && (
                <div className="pt-4 border-t border-border space-y-3">
                  <Link
                    href="/admin"
                    className="block text-luxury-base font-serif font-normal tracking-luxury-tight text-muted-foreground hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-bronze focus:ring-offset-2 focus:ring-offset-background rounded px-3 py-2 touch-target"
                    onClick={() => setIsMenuOpen(false)}
                    data-testid="mobile-admin-link"
                  >
                    Admin
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      logoutMutation.mutate();
                      setIsMenuOpen(false);
                    }}
                    disabled={logoutMutation.isPending}
                    className="w-full"
                    data-testid="mobile-logout-button"
                  >
                    Logout
                  </Button>
                </div>
              )}
            </div>
          </nav>
        )}
      </header>
    </>
  );
}
