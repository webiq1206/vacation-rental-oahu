# VacationRentalOahu.co - Beach House Vacation Rental Platform

## Overview

VacationRentalOahu.co is a production-ready beach house vacation rental website for a single property in Oahu, Hawaii. The platform provides a modern Airbnb-style booking experience with comprehensive guest management, secure payment processing, and robust admin tools. The system features real-time availability checking, dynamic pricing, automated email communications, and a full-featured content management system for property owners.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React 18 with TypeScript**: Modern component-based architecture using functional components and hooks
- **Wouter for Routing**: Lightweight client-side routing solution for single-page application navigation
- **Tailwind CSS**: Utility-first CSS framework for responsive design with custom tropical color palette
- **Shadcn/ui Components**: Consistent UI component library built on Radix primitives for accessibility
- **TanStack Query**: Server state management for API data fetching, caching, and synchronization
- **React Hook Form**: Form handling with Zod validation for type-safe user input management

### Backend Architecture
- **Node.js with Express**: RESTful API server handling business logic and data operations
- **TypeScript**: Type safety across the entire backend stack
- **Session-based Authentication**: Passport.js with secure session management for admin access
- **Rate Limiting**: Express rate limiting for API endpoint protection
- **Input Validation**: Zod schemas for request validation and data sanitization

### Database Architecture
- **PostgreSQL**: Primary database for all application data
- **Drizzle ORM**: Type-safe database operations with schema migrations
- **Relational Schema**: Normalized design with proper foreign key relationships
  - Users, Property, Photos, Amenities, Bookings, Guests, Messages, Pricing Rules
  - Audit logging for administrative actions
  - Flexible pricing system with seasonal rates and coupons

### Authentication & Security
- **Admin-only Authentication**: Secure session-based login for property management
- **Password Hashing**: Scrypt-based password encryption with salt
- **CSRF Protection**: Cross-site request forgery prevention
- **Rate Limiting**: Endpoint-specific limits for contact forms and booking attempts
- **Input Sanitization**: Comprehensive validation on all user inputs

### Payment Processing
- **Stripe Integration**: Complete payment flow with test/live mode support
- **Webhook Handling**: Secure payment confirmation and booking status updates
- **PCI Compliance**: Client-side tokenization for secure payment processing
- **Multi-currency Support**: Configurable currency handling for international guests

### Email System
- **Multi-provider Support**: Resend, Postmark, or Mailgun integration
- **Automated Workflows**: Booking confirmations, contact replies, and notifications
- **HTML Templates**: Responsive email templates for professional communication
- **Event Tracking**: Email delivery status monitoring and logging

### Content Management
- **Dynamic Property Management**: Real-time updates to property details, photos, and amenities
- **Photo Gallery System**: Multi-image upload with featured image designation
- **Amenities Management**: Categorized amenities with icon mapping
- **Pricing Rules Engine**: Complex pricing with seasonal rates, weekend premiums, and discounts

## External Dependencies

### Core Services
- **Neon Database**: PostgreSQL hosting for production database operations
- **Stripe**: Payment processing service for secure booking transactions
- **Resend/Postmark/Mailgun**: Email delivery services for automated communications

### Frontend Libraries
- **@stripe/stripe-js & @stripe/react-stripe-js**: Client-side Stripe integration
- **@tanstack/react-query**: Server state management and caching
- **@hookform/resolvers**: Form validation integration
- **wouter**: Lightweight React router
- **date-fns**: Date manipulation and formatting utilities
- **react-hook-form**: Form state management and validation

### UI Components
- **@radix-ui/react-***: Comprehensive accessible component primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe CSS class composition
- **cmdk**: Command palette component for admin interface

### Development Tools
- **Vite**: Fast development server and build tool
- **ESBuild**: Production bundling for server-side code
- **TypeScript**: Type safety across frontend and backend
- **Drizzle Kit**: Database schema management and migrations

### Monitoring & Analytics
- **Built-in Audit Logging**: Administrative action tracking
- **Rate Limiting**: Request monitoring and throttling
- **Error Handling**: Comprehensive error capture and user feedback
- **Performance Monitoring**: Query optimization and response time tracking