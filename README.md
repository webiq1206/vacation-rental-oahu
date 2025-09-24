# VacationRentalOahu.co - Beach House Vacation Rental Platform

A sophisticated vacation rental website for a beachfront property in Oahu, Hawaii, featuring modern Four Seasons/Cappa-level typography and comprehensive booking functionality.

## 🏝️ Features

- **Beautiful Frontend**: Playfair Display typography with tropical color palette
- **Booking System**: Real-time availability checking and secure payments via Stripe
- **Admin Panel**: Comprehensive property and booking management
- **Email Automation**: Automated guest communications via Resend/SendGrid
- **SEO Optimized**: Targeting "Beach House Oahu" and "Vacation Rental Oahu" keywords

## 🛠️ Technology Stack

### Frontend
- **React 18 + TypeScript**: Modern component architecture
- **Tailwind CSS**: Responsive design with custom tropical theme
- **Shadcn/ui**: Consistent component library
- **TanStack Query**: Server state management
- **Wouter**: Lightweight routing

### Backend
- **Node.js + Express**: RESTful API server
- **PostgreSQL**: Primary database with Neon hosting
- **Drizzle ORM**: Type-safe database operations
- **Stripe**: Secure payment processing
- **Passport.js**: Session-based authentication

### External Services
- **Replit**: Development and hosting platform
- **Neon**: PostgreSQL database hosting
- **Stripe**: Payment processing
- **Resend/SendGrid**: Email delivery

## 🚀 Development

This project is primarily developed and hosted on Replit with GitHub for version control and backup.

### Local Development
```bash
npm install
npm run dev
```

### Database Migrations
```bash
npm run db:generate
npm run db:push
```

## 📦 Deployment

The application is deployed on Replit with automatic builds and deployment pipeline.

### Environment Variables Required:
- `DATABASE_URL`: PostgreSQL connection string
- `STRIPE_SECRET_KEY`: Stripe payment processing
- `RESEND_API_KEY`: Email delivery service
- `SESSION_SECRET`: Session security
- `GOOGLE_MAPS_API_KEY`: Maps integration

## 🔒 Security Features

- Session-based authentication for admin access
- Rate limiting on API endpoints
- Input validation with Zod schemas
- CSRF protection
- Secure payment tokenization

## 📊 Database Schema

The application uses a normalized PostgreSQL schema with tables for:
- Users & Authentication
- Property Management
- Booking System
- Payment Processing
- Email Templates
- Audit Logging

## 🎨 Design

The site features sophisticated typography using Playfair Display serif fonts, creating an elegant Four Seasons/Cappa-level aesthetic that reflects the luxury nature of the beachfront vacation rental.

## 📞 Support

For technical support or inquiries, please use the GitHub Issues tab.

---

*Last updated: 2025-09-24*
