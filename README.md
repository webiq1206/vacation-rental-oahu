# VacationRentalOahu.co - Beach House Vacation Rental System

A complete, production-ready Beach House vacation rental website for Oahu, Hawaii, featuring modern booking systems, payment processing, and comprehensive admin management tools. Built with React, Node.js, PostgreSQL, and Stripe.

## 🌟 Features

### 🏝️ **Guest Experience**
- **Modern Airbnb-Style Interface** - Clean, intuitive design with tropical color palette
- **Interactive Booking System** - Real-time availability, pricing calculator, and instant reservations
- **Secure Payment Processing** - Stripe integration with PCI-compliant checkout
- **Photo Gallery** - High-quality property images with lightbox viewing
- **Mobile-Responsive Design** - Optimized experience across all devices
- **SEO Optimized** - Server-side rendering, meta tags, JSON-LD schema

### 🛡️ **Admin Management**
- **Comprehensive Dashboard** - Overview of bookings, revenue, and performance metrics
- **Booking Management** - View, edit, and manage all reservations
- **Calendar Control** - Set blackout dates and manage availability
- **Dynamic Pricing** - Seasonal rates, weekend pricing, and discount rules
- **Content Management** - Update property details, photos, and amenities
- **Settings Panel** - Configure payments, email, and system preferences

### 💼 **Business Features**
- **Multi-tier Pricing** - Base rates, seasonal pricing, weekend rates, cleaning fees
- **Coupon System** - Percentage and fixed-amount promotional codes
- **Email Automation** - Booking confirmations, reminders, and receipts
- **Contact Management** - Guest inquiries with automated responses
- **Analytics Ready** - GA4, Meta Pixel integration hooks

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Wouter (routing)
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Payments**: Stripe (checkout, webhooks, test/live modes)
- **Email**: Resend/Postmark/Mailgun support
- **Authentication**: Passport.js with session management
- **UI Components**: Shadcn/ui with Radix primitives

### Database Schema (Mermaid ERD)
```mermaid
erDiagram
    users ||--o{ audit_logs : creates
    property ||--o{ photos : has
    property ||--o{ property_amenities : has
    property ||--o{ pricing_rules : has
    property ||--o{ blackout_dates : has
    property ||--o{ bookings : receives
    amenities ||--o{ property_amenities : belongs_to
    bookings ||--o{ guests : includes
    bookings ||--o{ email_events : triggers
    coupons ||--o{ bookings : applies_to
    
    users {
        uuid id PK
        text email UK
        text password
        text role
        text twofa_secret
        timestamp created_at
    }
    
    property {
        uuid id PK
        text title
        text description
        text address
        decimal lat
        decimal lng
        text check_in_time
        text check_out_time
        int max_guests
        int bedrooms
        int bathrooms
        decimal rating
        int review_count
    }
    
    bookings {
        uuid id PK
        uuid property_id FK
        text status
        date start_date
        date end_date
        int nights
        int guests
        decimal subtotal
        decimal taxes
        decimal fees
        decimal total
        text currency
        text payment_intent_id
        text idempotency_key UK
    }
