// SEO utilities for dynamic meta tags and structured data
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

export interface SEOProps {
  title?: string;
  description?: string;
  pageType?: string; // 'home' | 'booking' | 'stay' | 'contact' | 'policies' | 'checkout'
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  canonical?: string;
  keywords?: string;
  robots?: string;
  structuredData?: Record<string, any>[];
}

export interface SEOSettings {
  site_title: string;
  site_description: string;
  og_image_url: string;
  twitter_handle: string;
  page_titles: { [key: string]: string };
  meta_descriptions: { [key: string]: string };
}

export interface SiteInfoSettings {
  site_name: string;
  site_description: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  social_links: { [key: string]: string };
  license_number?: string;
}

// Hook to fetch SEO settings from API
export function useSEOSettings() {
  const { data: seoSettings, isLoading } = useQuery<SEOSettings>({
    queryKey: ['/api/seo-settings'],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return { seoSettings, isLoading };
}

// Enhanced hook for managing document head elements with database-driven content
export function useSEO(props: SEOProps) {
  const { data: seoSettings, isLoading } = useQuery<SEOSettings>({
    queryKey: ['/api/seo-settings'],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  useEffect(() => {
    if (!seoSettings || isLoading) return;

    // Get dynamic title based on pageType or fallback to provided title
    const pageTitle = props.title || 
      (props.pageType ? seoSettings.page_titles[props.pageType] : '') ||
      seoSettings.page_titles.home ||
      seoSettings.site_title || '';

    // Get dynamic description based on pageType or fallback to provided description
    const pageDescription = props.description || 
      (props.pageType ? seoSettings.meta_descriptions[props.pageType] : '') ||
      seoSettings.site_description;

    // Set page title with dynamic site title
    document.title = `${pageTitle} - ${seoSettings.site_title}`;

    // Update or create meta tags
    updateMetaTag('description', pageDescription);
    if (props.keywords) {
      updateMetaTag('keywords', props.keywords);
    }
    
    // Robots meta tag for route-level control
    updateMetaTag('robots', props.robots || 'index, follow');

    // Open Graph tags with dynamic defaults
    updateMetaProperty('og:title', props.ogTitle || pageTitle);
    updateMetaProperty('og:description', props.ogDescription || pageDescription);
    updateMetaProperty('og:image', props.ogImage || seoSettings.og_image_url);
    updateMetaProperty('og:type', props.ogType || 'website');
    updateMetaProperty('og:url', props.canonical || window.location.href);
    updateMetaProperty('og:site_name', seoSettings.site_title);

    // Twitter Card tags with dynamic defaults
    updateMetaName('twitter:card', props.twitterCard || 'summary_large_image');
    updateMetaName('twitter:title', props.ogTitle || pageTitle);
    updateMetaName('twitter:description', props.ogDescription || pageDescription);
    updateMetaName('twitter:image', props.ogImage || seoSettings.og_image_url);
    updateMetaName('twitter:site', seoSettings.twitter_handle);
    updateMetaName('twitter:creator', seoSettings.twitter_handle);

    // Canonical URL
    updateCanonical(props.canonical || window.location.href);

    // Structured data
    if (props.structuredData && props.structuredData.length > 0) {
      updateStructuredData(props.structuredData);
    }

  }, [props, seoSettings]);
}

// Helper function to update meta tags by name
function updateMetaTag(name: string, content: string) {
  let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = name;
    document.head.appendChild(meta);
  }
  meta.content = content;
}

// Helper function to update meta tags by property
function updateMetaProperty(property: string, content: string) {
  let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('property', property);
    document.head.appendChild(meta);
  }
  meta.content = content;
}

// Helper function to update meta tags by name attribute
function updateMetaName(name: string, content: string) {
  let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = name;
    document.head.appendChild(meta);
  }
  meta.content = content;
}

// Helper function to update canonical URL
function updateCanonical(url: string) {
  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = url;
}

// Helper function to update structured data
function updateStructuredData(data: Record<string, any>[]) {
  // Remove existing structured data scripts
  const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
  existingScripts.forEach(script => script.remove());

  // Add new structured data
  data.forEach(schemaData => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schemaData, null, 2);
    document.head.appendChild(script);
  });
}

// Generate Organization structured data with dynamic database settings
export function generateOrganizationSchema(seoSettings?: SEOSettings, siteInfoSettings?: SiteInfoSettings): Record<string, any> {
  const siteName = seoSettings?.site_title || siteInfoSettings?.site_name || "";
  const siteDescription = seoSettings?.site_description || siteInfoSettings?.site_description || "";
  
  // Parse address from site_info settings or use defaults
  const addressParts = siteInfoSettings?.address ? siteInfoSettings.address.split(',').map(s => s.trim()) : [];
  const addressLocality = addressParts[0] || "Honolulu";
  const addressRegion = addressParts[1] || "HI";
  const postalCode = addressParts[2] || "96815";
  
  // Build social media links array from site_info settings
  const socialLinks = [];
  if (siteInfoSettings?.social_links?.instagram) {
    socialLinks.push(siteInfoSettings.social_links.instagram);
  }
  if (siteInfoSettings?.social_links?.facebook) {
    socialLinks.push(siteInfoSettings.social_links.facebook);
  }
  if (siteInfoSettings?.social_links?.twitter) {
    socialLinks.push(siteInfoSettings.social_links.twitter);
  }
  
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": siteName,
    "description": siteDescription,
    "url": window.location.origin,
    "telephone": siteInfoSettings?.contact_phone || "+1-208-995-9516",
    "email": siteInfoSettings?.contact_email || "hello@vacationrentaloahu.co",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": addressLocality,
      "addressRegion": addressRegion,
      "postalCode": postalCode,
      "addressCountry": "US"
    },
    ...(socialLinks.length > 0 && { "sameAs": socialLinks })
  };
}

// Generate LodgingBusiness structured data for vacation rental with dynamic database settings
export function generateLodgingBusinessSchema(property: any, seoSettings?: SEOSettings, siteInfoSettings?: SiteInfoSettings): Record<string, any> {
  const siteName = seoSettings?.site_title || siteInfoSettings?.site_name || "";
  const siteDescription = seoSettings?.site_description || siteInfoSettings?.site_description || "";
  
  // Parse address from site_info settings or use defaults
  const addressParts = siteInfoSettings?.address ? siteInfoSettings.address.split(',').map(s => s.trim()) : [];
  const addressLocality = addressParts[0] || "Honolulu";
  const addressRegion = addressParts[1] || "HI";
  const postalCode = addressParts[2] || "96815";
  
  return {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    "name": property?.title || seoSettings?.page_titles?.stay || siteName,
    "description": siteDescription,
    "url": `${window.location.origin}/stay`,
    "telephone": siteInfoSettings?.contact_phone || "+1-208-995-9516",
    "email": siteInfoSettings?.contact_email || "hello@vacationrentaloahu.co",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": addressLocality,
      "addressRegion": addressRegion,
      "postalCode": postalCode,
      "addressCountry": "US"
    },
    ...(property?.lat && property?.lng && {
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": parseFloat(property.lat),
        "longitude": parseFloat(property.lng)
      }
    }),
    "image": [
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800",
      "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800"
    ],
    ...(property?.rating && {
      "starRating": {
        "@type": "Rating",
        "ratingValue": property.rating,
        "bestRating": "5"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": property.rating,
        "reviewCount": property.review_count || "0",
        "bestRating": "5"
      }
    }),
    ...(property?.bedrooms && { "numberOfRooms": property.bedrooms }),
    ...(property?.max_guests && {
      "occupancy": {
        "@type": "QuantitativeValue",
        "maxValue": property.max_guests
      }
    }),
    "amenityFeature": [
      {
        "@type": "LocationFeatureSpecification", 
        "name": "Beach Access",
        "value": true
      },
      {
        "@type": "LocationFeatureSpecification",
        "name": "Ocean View",
        "value": true
      },
      {
        "@type": "LocationFeatureSpecification",
        "name": "WiFi",
        "value": true
      },
      {
        "@type": "LocationFeatureSpecification",
        "name": "Kitchen",
        "value": true
      },
      {
        "@type": "LocationFeatureSpecification",
        "name": "Parking",
        "value": true
      }
    ],
    ...(property?.check_in_time && { "checkinTime": property.check_in_time }),
    ...(property?.check_out_time && { "checkoutTime": property.check_out_time }),
    ...(property?.pets_allowed !== undefined && { "petsAllowed": property.pets_allowed }),
    ...(property?.smoking_allowed !== undefined && { "smokingAllowed": property.smoking_allowed }),
    ...(property?.price_range && { "priceRange": property.price_range })
  };
}

// Generate Review structured data
export function generateReviewsSchema(reviews: any[], property?: any, seoSettings?: SEOSettings): Record<string, any>[] {
  if (!reviews || reviews.length === 0) {
    return [];
  }

  return reviews.slice(0, 5).map(review => ({
    "@context": "https://schema.org",
    "@type": "Review",
    "reviewBody": review.content,
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": review.rating.toString(),
      "bestRating": "5"
    },
    "author": {
      "@type": "Person",
      "name": review.guest_name
    },
    "datePublished": review.created_at.split('T')[0],
    "itemReviewed": {
      "@type": "LodgingBusiness",
      "name": property?.title || seoSettings?.site_title || "Vacation Rental"
    }
  }));
}

// Generate BreadcrumbList structured data
export function generateBreadcrumbSchema(breadcrumbs: Array<{name: string, url: string}>): Record<string, any> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": `https://vacationrentaloahu.co${crumb.url}`
    }))
  };
}

// Generate Product structured data for booking page
export function generateProductSchema(property: any, pricing: any, seoSettings?: SEOSettings): Record<string, any> {
  const siteName = seoSettings?.site_title || "VacationRentalOahu.co";
  const siteDescription = seoSettings?.site_description || "Luxury vacation rental in Oahu, Hawaii offering oceanfront beach house with beach access and luxury amenities.";
  
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": property?.title || seoSettings?.page_titles?.booking || "Luxury Ocean View Beach House Vacation Rental",
    "description": seoSettings?.meta_descriptions?.booking || siteDescription,
    "image": [
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800"
    ],
    "brand": {
      "@type": "Brand",
      "name": "VacationRentalOahu.co"
    },
    "offers": {
      "@type": "Offer",
      "url": "https://vacationrentaloahu.co/booking",
      "priceCurrency": "USD",
      "price": pricing?.base_price || "0",
      "priceValidUntil": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      "availability": "https://schema.org/InStock",
      "validFrom": new Date().toISOString().split('T')[0]
    },
    ...(property?.rating && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": property.rating,
        "reviewCount": property.review_count || "0",
        "bestRating": "5"
      }
    })
  };
}

// Default SEO values
export const DEFAULT_SEO = {
  siteName: 'VacationRentalOahu.co',
  defaultImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=630',
  twitterHandle: '@vacationrentaloahu',
  facebookAppId: ''
};