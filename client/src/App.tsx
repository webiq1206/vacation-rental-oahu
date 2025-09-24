import { Switch, Route, useLocation } from "wouter";
import { queryClient, setupBackgroundRefresh, prefetchCriticalData } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { BookingProvider } from "@/hooks/use-booking-context";
import { ProtectedRoute } from "./lib/protected-route";
import { scrollToTop, shouldPreventScrollToTop } from "./lib/utils";
import { LazyWrapper, useIntelligentPreload } from "@/lib/lazy-components";
import { SkeletonCard } from "@/components/ui/luxury-skeleton";

// Critical pages loaded immediately (first paint optimization)
import HomePage from "@/pages/home-page";

// Lazy load main pages for better code splitting
const StayPage = lazy(() => import("@/pages/stay-page"));
const ExperiencesPage = lazy(() => import("@/pages/experiences-page"));
const BookingPage = lazy(() => import("@/pages/booking-page"));
const BookingDetailsPage = lazy(() => import("@/pages/booking-details-page"));
const AuthPage = lazy(() => import("@/pages/auth-page"));
const NotFound = lazy(() => import("@/pages/not-found"));

// Lazy load heavy components
import {
  ChatWidget,
  ContactPage,
  PoliciesPage,
  CheckoutPage,
  BookingConfirmationPage,
  AdminDashboard,
  AdminBookings,
  AdminCalendar,
  AdminPricing,
  AdminContent,
  AdminContentManagement,
  AdminPageBuilder,
  AdminReporting,
  AdminSettings,
  AdminReviews,
} from "@/lib/lazy-components";

// Component to handle scroll-to-top behavior on route changes
function ScrollToTop() {
  const [location] = useLocation();
  const { preloadOnHover } = useIntelligentPreload();
  
  useEffect(() => {
    // Only scroll to top if it's not a hash navigation
    if (!shouldPreventScrollToTop(location)) {
      scrollToTop('instant');
    }
    
    // Preload likely next routes based on current location
    if (location === '/') {
      preloadOnHover('booking');
      preloadOnHover('contact');
    } else if (location === '/booking') {
      preloadOnHover('checkout');
    }
  }, [location, preloadOnHover]);

  return null;
}

// Performance setup component
function PerformanceSetup() {
  useEffect(() => {
    // Setup background refresh for dynamic content
    setupBackgroundRefresh();
    
    // Prefetch critical data
    prefetchCriticalData();
    
    // Register service worker for caching
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('SW registered:', registration);
        })
        .catch(registrationError => {
          console.log('SW registration failed:', registrationError);
        });
    }
  }, []);
  
  return null;
}

// Enhanced loading fallback for main pages
function PageLoadingFallback() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <SkeletonCard hasImage={true} textLines={2} className="h-64" />
        <div className="grid md:grid-cols-2 gap-6">
          <SkeletonCard hasImage={true} textLines={3} />
          <SkeletonCard hasImage={true} textLines={3} />
        </div>
        <SkeletonCard textLines={4} />
      </div>
    </div>
  );
}

function Router() {
  return (
    <>
      <ScrollToTop />
      <Switch>
        {/* Critical route - loaded immediately for LCP optimization */}
        <Route path="/" component={HomePage} />
        
        {/* Main pages - lazy loaded for better code splitting */}
        <Route path="/stay" component={() => (
          <Suspense fallback={<PageLoadingFallback />}>
            <StayPage />
          </Suspense>
        )} />
        <Route path="/experiences" component={() => (
          <Suspense fallback={<PageLoadingFallback />}>
            <ExperiencesPage />
          </Suspense>
        )} />
        <Route path="/booking" component={() => (
          <Suspense fallback={<PageLoadingFallback />}>
            <BookingPage />
          </Suspense>
        )} />
        <Route path="/booking/details" component={() => (
          <Suspense fallback={<PageLoadingFallback />}>
            <BookingDetailsPage />
          </Suspense>
        )} />
        
        {/* Secondary pages - lazy loaded */}
        <Route path="/booking/checkout" component={() => (
          <LazyWrapper><CheckoutPage /></LazyWrapper>
        )} />
        <Route path="/booking/confirmation" component={() => (
          <LazyWrapper><BookingConfirmationPage /></LazyWrapper>
        )} />
        <Route path="/contact" component={() => (
          <LazyWrapper><ContactPage /></LazyWrapper>
        )} />
        <Route path="/policies" component={() => (
          <LazyWrapper><PoliciesPage /></LazyWrapper>
        )} />
        
        {/* Auth route - lazy loaded */}
        <Route path="/auth" component={() => (
          <Suspense fallback={<PageLoadingFallback />}>
            <AuthPage />
          </Suspense>
        )} />
        
        {/* Protected admin routes - lazy loaded */}
        <ProtectedRoute path="/admin" component={() => (
          <LazyWrapper fallback={<div className="p-8 space-y-6"><div className="h-8 bg-bronze-200 rounded animate-shimmer" /></div>}>
            <AdminDashboard />
          </LazyWrapper>
        )} />
        <ProtectedRoute path="/admin/bookings" component={() => (
          <LazyWrapper><AdminBookings /></LazyWrapper>
        )} />
        <ProtectedRoute path="/admin/calendar" component={() => (
          <LazyWrapper><AdminCalendar /></LazyWrapper>
        )} />
        <ProtectedRoute path="/admin/content-management" component={() => (
          <LazyWrapper><AdminContentManagement /></LazyWrapper>
        )} />
        <ProtectedRoute path="/admin/page-builder" component={() => (
          <LazyWrapper><AdminPageBuilder /></LazyWrapper>
        )} />
        <ProtectedRoute path="/admin/pricing" component={() => (
          <LazyWrapper><AdminPricing /></LazyWrapper>
        )} />
        <ProtectedRoute path="/admin/reporting" component={() => (
          <LazyWrapper><AdminReporting /></LazyWrapper>
        )} />
        <ProtectedRoute path="/admin/reviews" component={() => (
          <LazyWrapper><AdminReviews /></LazyWrapper>
        )} />
        <ProtectedRoute path="/admin/content" component={() => (
          <LazyWrapper><AdminContent /></LazyWrapper>
        )} />
        <ProtectedRoute path="/admin/settings" component={() => (
          <LazyWrapper><AdminSettings /></LazyWrapper>
        )} />
        
        {/* Fallback to 404 - lazy loaded */}
        <Route component={() => (
          <Suspense fallback={<PageLoadingFallback />}>
            <NotFound />
          </Suspense>
        )} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BookingProvider>
          <TooltipProvider>
            <PerformanceSetup />
            <Toaster />
            <LazyWrapper delay={100}>
              <ChatWidget />
            </LazyWrapper>
            <Router />
          </TooltipProvider>
        </BookingProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
