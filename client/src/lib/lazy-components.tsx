import { lazy, Suspense, ComponentType } from 'react';
import { SkeletonCard, SkeletonText, LuxurySkeleton } from '@/components/ui/luxury-skeleton';

// Lazy loading wrapper with sophisticated loading states
interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  delay?: number;
}

export function LazyWrapper({ 
  children, 
  fallback = <LuxurySkeleton className="h-64 w-full" />,
  delay = 200 
}: LazyWrapperProps) {
  return (
    <Suspense fallback={
      <div className="animate-pulse" style={{ animationDelay: `${delay}ms` }}>
        {fallback}
      </div>
    }>
      {children}
    </Suspense>
  );
}

// Lazy load admin components (heavy and rarely used)
export const AdminDashboard = lazy(() => 
  import('@/pages/admin/admin-dashboard').then(module => ({ 
    default: module.default 
  }))
);

export const AdminBookings = lazy(() => 
  import('@/pages/admin/admin-bookings').then(module => ({ 
    default: module.default 
  }))
);

export const AdminCalendar = lazy(() => 
  import('@/pages/admin/admin-calendar').then(module => ({ 
    default: module.default 
  }))
);

export const AdminPricing = lazy(() => 
  import('@/pages/admin/admin-pricing').then(module => ({ 
    default: module.default 
  }))
);

export const AdminContent = lazy(() => 
  import('@/pages/admin/admin-content').then(module => ({ 
    default: module.default 
  }))
);

export const AdminContentManagement = lazy(() => 
  import('@/pages/admin/admin-content-management').then(module => ({ 
    default: module.default 
  }))
);

export const AdminReporting = lazy(() => 
  import('@/pages/admin/admin-reporting').then(module => ({ 
    default: module.default 
  }))
);

export const AdminSettings = lazy(() => 
  import('@/pages/admin/admin-settings').then(module => ({ 
    default: module.default 
  }))
);

export const AdminReviews = lazy(() => 
  import('@/pages/admin/admin-reviews').then(module => ({ 
    default: module.default 
  }))
);

export const AdminPageBuilder = lazy(() => 
  import('@/pages/admin/admin-page-builder').then(module => ({ 
    default: module.default 
  }))
);

// Lazy load secondary pages
export const ContactPage = lazy(() => 
  import('@/pages/contact-page').then(module => ({ 
    default: module.default 
  }))
);

export const PoliciesPage = lazy(() => 
  import('@/pages/policies-page').then(module => ({ 
    default: module.default 
  }))
);

export const CheckoutPage = lazy(() => 
  import('@/pages/checkout-page').then(module => ({ 
    default: module.default 
  }))
);

export const BookingConfirmationPage = lazy(() => 
  import('@/pages/booking-confirmation-page').then(module => ({ 
    default: module.default 
  }))
);

// Lazy load heavy components
export const LocationMap = lazy(() => 
  import('@/components/property/location-map').then(module => ({ 
    default: module.LocationMap 
  }))
);

export const ReviewsSection = lazy(() => 
  import('@/components/property/reviews-section')
);

export const ChatWidget = lazy(() => 
  import('@/components/chat/chat-widget').then(module => ({ 
    default: module.ChatWidget 
  }))
);

// Helper function to create lazy components with custom loading states
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  LoadingComponent?: ComponentType
) {
  const LazyComponent = lazy(importFn);
  
  return function LazyComponentWrapper(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={
        LoadingComponent ? <LoadingComponent /> : 
        <SkeletonCard hasImage={true} textLines={3} className="w-full" />
      }>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// Preload functions for performance
export const preloadAdminComponents = () => {
  // Preload admin components when user is authenticated
  const adminImports = [
    () => import('@/pages/admin/admin-dashboard'),
    () => import('@/pages/admin/admin-bookings'),
    () => import('@/pages/admin/admin-calendar'),
  ];
  
  adminImports.forEach(importFn => {
    importFn().catch(() => {
      // Fail silently for preloading
    });
  });
};

export const preloadSecondaryPages = () => {
  // Preload likely next pages
  const secondaryImports = [
    () => import('@/pages/contact-page'),
    () => import('@/pages/booking-page'),
  ];
  
  secondaryImports.forEach(importFn => {
    importFn().catch(() => {
      // Fail silently for preloading
    });
  });
};

// Custom hook for intelligent preloading
export function useIntelligentPreload() {
  const preloadOnHover = (componentName: string) => {
    const preloadMap: Record<string, () => Promise<any>> = {
      'contact': () => import('@/pages/contact-page'),
      'booking': () => import('@/pages/booking-page'),
      'checkout': () => import('@/pages/checkout-page'),
      'admin': () => import('@/pages/admin/admin-dashboard'),
      'reviews': () => import('@/components/property/reviews-section'),
      'map': () => import('@/components/property/location-map'),
    };
    
    const preloadFn = preloadMap[componentName];
    if (preloadFn) {
      preloadFn().catch(() => {
        // Fail silently
      });
    }
  };
  
  return { preloadOnHover };
}

// Intersection observer hook for lazy loading sections
export function useLazySection(threshold = 0.1) {
  const { elementRef, hasIntersected } = useIntersectionObserver({
    threshold,
    rootMargin: '100px', // Start loading before element is visible
    freezeOnceVisible: true,
  });
  
  return { ref: elementRef, shouldLoad: hasIntersected };
}

// Import the hook from existing file
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';