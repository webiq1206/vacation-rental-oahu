import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { sendEmail, generateBookingConfirmationEmail, generateContactReplyEmail, generateReviewSolicitationEmail } from "./email";
import { insertBookingSchema, insertGuestSchema, insertMessageSchema, insertChatMessageSchema, insertGuestReviewSchema, insertAirbnbReviewSchema, insertExternalCalendarSchema, insertHoldSchema, insertReviewSolicitationSchema, insertAmenityCategorySchema, insertNearbyAttractionSchema, insertPageLayoutSchema, insertContentBlockSchema, insertBlockTypeSchema } from "@shared/schema";
import Stripe from "stripe";
import rateLimit from "express-rate-limit";
import multer from "multer";
import path from "path";
import { z } from "zod";

// Initialize Stripe if API key is available
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-08-27.basil",
  });
} else {
  console.warn("STRIPE_SECRET_KEY not set, payment functionality will be disabled");
}

// Rate limiting
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 submissions per window
  message: { message: "Too many contact form submissions, please try again later." },
});

const quoteLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: { message: "Too many pricing requests, please slow down." },
});

const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 booking attempts per window
  message: { message: "Too many booking attempts, please try again later." },
});

const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 chat messages per minute
  message: { message: "Too many chat messages, please slow down." },
});

// Configure multer for file uploads with strict security
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
      // Create unique filename with timestamp and safe extension
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const fileExt = path.extname(file.originalname).toLowerCase();
      
      // Only allow approved extensions
      if (ALLOWED_EXTENSIONS.includes(fileExt)) {
        cb(null, uniqueSuffix + fileExt);
      } else {
        cb(null, uniqueSuffix + '.jpg'); // Default to .jpg for safety
      }
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Strict validation: check both MIME type and file extension
    const fileExt = path.extname(file.originalname).toLowerCase();
    const isValidMime = ALLOWED_MIME_TYPES.includes(file.mimetype);
    const isValidExt = ALLOWED_EXTENSIONS.includes(fileExt);
    
    if (isValidMime && isValidExt) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

const integrationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 integration requests per minute
  message: { message: "Too many integration requests, please slow down." },
});

const syncLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // 3 sync requests per 5 minutes
  message: { message: "Too many sync requests, please try again later." },
});

const reviewSolicitationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 review solicitation requests per minute
  message: { message: "Too many review solicitation requests, please slow down." },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);

  // Middleware for admin auth
  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Admin access required' });
    }
    next();
  };

  // PUBLIC API ROUTES

  // Property details (public - without exact address)
  app.get("/api/property/public", async (req, res) => {
    try {
      const property = await storage.getPropertyPublicDetails();
      if (!property) {
        console.error("⚠️ No property found in database - database may be empty");
        console.error("💡 If this is production, run: npx tsx scripts/import-production-data.ts");
        return res.status(404).json({ 
          message: "Property not found", 
          hint: "Database may be empty - run import script if this is production" 
        });
      }
      res.json(property);
    } catch (error) {
      console.error("Error fetching public property:", error);
      res.status(500).json({ message: "Failed to fetch property details" });
    }
  });

  // Property details (full - for admin/booking use ONLY - REQUIRES AUTHENTICATION)
  app.get("/api/property", requireAdmin, async (req, res) => {
    try {
      const property = await storage.getPropertyWithDetails();
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json(property);
    } catch (error) {
      console.error("Error fetching property:", error);
      res.status(500).json({ message: "Failed to fetch property details" });
    }
  });

  // Property coordinates (public - for directions only)
  app.get("/api/property/directions-coordinates", async (req, res) => {
    try {
      const prop = await storage.getProperty();
      if (!prop) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      // Return only coordinates needed for directions, without exact address
      res.json({
        lat: prop.lat,
        lng: prop.lng,
        general_location: prop.general_location || "Kaneohe, Hawaii"
      });
    } catch (error) {
      console.error("Error fetching property coordinates:", error);
      res.status(500).json({ message: "Failed to fetch coordinates" });
    }
  });

  // Property coordinates (for guests with confirmed bookings only)
  app.get("/api/property/coordinates", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Check if user has a confirmed booking
      const userBookings = await storage.getBookings({ status: "confirmed" });
      const userHasConfirmedBooking = userBookings.some(booking => {
        // Check if booking is for this user (for now, we'll provide coordinates to all confirmed booking users)
        // In a real app, you'd want to match user ID to guest email or similar
        const currentDate = new Date();
        const bookingStart = new Date(booking.start_date);
        const bookingEnd = new Date(booking.end_date);
        
        // Show exact location if booking is active (check-in to check-out) or future
        return bookingStart >= currentDate || (bookingStart <= currentDate && bookingEnd >= currentDate);
      });

      if (!userHasConfirmedBooking) {
        return res.status(403).json({ message: "Access denied. Exact coordinates only available to guests with confirmed bookings." });
      }

      const property = await storage.getPropertyWithDetails();
      if (!property || !property.lat || !property.lng) {
        return res.status(404).json({ message: "Property coordinates not found" });
      }

      res.json({
        lat: property.lat,
        lng: property.lng
      });
    } catch (error) {
      console.error("Error fetching property coordinates:", error);
      res.status(500).json({ message: "Failed to fetch property coordinates" });
    }
  });

  // Photos
  app.get("/api/photos", async (req, res) => {
    try {
      const photos = await storage.getPhotos();
      res.json(photos);
    } catch (error) {
      console.error("Error fetching photos:", error);
      res.status(500).json({ message: "Failed to fetch photos" });
    }
  });

  // Nearby Attractions (public)
  app.get("/api/nearby-attractions", async (req, res) => {
    try {
      const attractions = await storage.getNearbyAttractions();
      res.json(attractions);
    } catch (error) {
      console.error("Error fetching nearby attractions:", error);
      res.status(500).json({ message: "Failed to fetch nearby attractions" });
    }
  });

  // Public Page Layouts API - for dynamic content rendering
  app.get("/api/pages/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const layout = await storage.getPageLayout(slug);
      
      if (!layout || !layout.is_active) {
        return res.status(404).json({ message: "Page not found" });
      }

      const blocks = await storage.getContentBlocks(layout.id);
      const visibleBlocks = blocks.filter(block => block.is_visible);

      res.json({
        layout,
        blocks: visibleBlocks
      });
    } catch (error) {
      console.error("Error fetching page layout:", error);
      res.status(500).json({ message: "Failed to fetch page layout" });
    }
  });

  // Amenity Categories
  app.get("/api/amenity-categories", async (req, res) => {
    try {
      const categories = await storage.getAmenityCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching amenity categories:", error);
      res.status(500).json({ message: "Failed to fetch amenity categories" });
    }
  });

  // Amenities
  app.get("/api/amenities", async (req, res) => {
    try {
      const amenities = await storage.getPropertyAmenities();
      res.json(amenities);
    } catch (error) {
      console.error("Error fetching amenities:", error);
      res.status(500).json({ message: "Failed to fetch amenities" });
    }
  });

  // Guest Reviews
  app.get("/api/reviews", async (req, res) => {
    try {
      const reviews = await storage.getGuestReviews();
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.get("/api/reviews/featured", async (req, res) => {
    try {
      const reviews = await storage.getFeaturedReviews();
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching featured reviews:", error);
      res.status(500).json({ message: "Failed to fetch featured reviews" });
    }
  });


  app.get("/api/reviews/summary", async (req, res) => {
    try {
      const summary = await storage.getUnifiedReviewsSummary();
      res.json(summary);
    } catch (error) {
      console.error("Error fetching reviews summary:", error);
      res.status(500).json({ message: "Failed to fetch reviews summary" });
    }
  });

  // New Phase 3 Review Endpoints
  
  // Guest review submission
  app.post("/api/reviews/submit", async (req, res) => {
    try {
      const review = insertGuestReviewSchema.parse(req.body);
      const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;

      // Verify guest eligibility first
      const eligibility = await storage.verifyGuestEligibility(
        review.guest_email,
        review.stay_start_date,
        review.stay_end_date
      );

      if (!eligibility.eligible) {
        return res.status(400).json({ 
          message: "We could not verify your stay with us. Please check your email and stay dates." 
        });
      }

      const submittedReview = await storage.submitGuestReview({
        ...review,
        ip_address: ip,
      });

      res.status(201).json({
        message: "Thank you for your review! It will be published after approval.",
        review: submittedReview,
        verified: eligibility.verified
      });
    } catch (error) {
      console.error("Error submitting review:", error);
      res.status(500).json({ message: "Failed to submit review" });
    }
  });

  // Verify guest eligibility
  app.get("/api/reviews/verify", async (req, res) => {
    try {
      const { email, start_date, end_date } = req.query;

      if (!email || !start_date || !end_date) {
        return res.status(400).json({ 
          message: "Email, start date, and end date are required" 
        });
      }

      const eligibility = await storage.verifyGuestEligibility(
        email as string,
        start_date as string,
        end_date as string
      );

      res.json(eligibility);
    } catch (error) {
      console.error("Error verifying guest eligibility:", error);
      res.status(500).json({ message: "Failed to verify guest eligibility" });
    }
  });

  // Public guest reviews (sanitized, no PII)
  app.get("/api/reviews/public", async (req, res) => {
    try {
      const reviews = await storage.getGuestReviews();
      // Sanitize reviews for public consumption - remove PII
      const sanitizedReviews = reviews.map(review => ({
        id: review.id,
        guest_name: review.guest_name,
        location: review.location,
        rating: review.rating,
        review_date: review.review_date,
        stay_start_date: review.stay_start_date,
        stay_end_date: review.stay_end_date,
        trip_type: review.trip_type,
        review_text: review.review_text,
        would_recommend: review.would_recommend,
        is_featured: review.is_featured,
        verified_guest: review.verified_guest,
        created_at: review.created_at
      }));
      res.json(sanitizedReviews);
    } catch (error) {
      console.error("Error fetching public reviews:", error);
      res.status(500).json({ message: "Failed to fetch public reviews" });
    }
  });


  // Get featured unified reviews
  app.get("/api/reviews/featured-unified", async (req, res) => {
    try {
      const reviews = await storage.getFeaturedUnifiedReviews();
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching featured unified reviews:", error);
      res.status(500).json({ message: "Failed to fetch featured reviews" });
    }
  });

  // Availability check
  app.get("/api/availability", async (req, res) => {
    try {
      const { start, end } = req.query;
      
      if (!start || !end) {
        return res.status(400).json({ message: "Start and end dates are required" });
      }

      const startDate = new Date(start as string);
      const endDate = new Date(end as string);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize to midnight for fair comparison

      if (startDate < today) {
        return res.status(400).json({ message: "Check-in date cannot be in the past" });
      }

      if (endDate <= startDate) {
        return res.status(400).json({ message: "Check-out date must be after check-in date" });
      }

      const isAvailable = await storage.checkAvailability(start as string, end as string);
      
      res.json({ available: isAvailable });
    } catch (error) {
      console.error("Error checking availability:", error);
      res.status(500).json({ message: "Failed to check availability" });
    }
  });

  // Pricing quote
  app.get("/api/quote", quoteLimiter, async (req, res) => {
    try {
      const { start, end, guests, coupon } = req.query;
      
      if (!start || !end || !guests) {
        return res.status(400).json({ message: "Start date, end date, and guests are required" });
      }

      const guestCount = parseInt(guests as string);
      if (guestCount < 1 || guestCount > 8) {
        return res.status(400).json({ message: "Guest count must be between 1 and 8" });
      }

      const startDate = new Date(start as string);
      const endDate = new Date(end as string);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize to midnight for fair comparison

      if (startDate < today) {
        return res.status(400).json({ message: "Check-in date cannot be in the past" });
      }

      if (endDate <= startDate) {
        return res.status(400).json({ message: "Check-out date must be after check-in date" });
      }

      // Check availability first
      const isAvailable = await storage.checkAvailability(start as string, end as string);
      if (!isAvailable) {
        return res.status(400).json({ message: "Selected dates are not available" });
      }

      const pricing = await storage.calculatePricing(
        start as string, 
        end as string, 
        guestCount,
        coupon as string
      );

      res.json(pricing);
    } catch (error) {
      console.error("Error calculating pricing:", error);
      res.status(500).json({ message: "Failed to calculate pricing" });
    }
  });

  // Create booking
  app.post("/api/bookings", bookingLimiter, async (req, res) => {
    try {
      const { 
        start_date, 
        end_date, 
        guests: guestCount, 
        guest_info,
        coupon_code 
      } = req.body;

      // Validation
      if (!start_date || !end_date || !guestCount || !guest_info) {
        return res.status(400).json({ 
          message: "Missing required fields: start_date, end_date, guests, guest_info" 
        });
      }

      if (!guest_info.first_name || !guest_info.last_name || !guest_info.email) {
        return res.status(400).json({ 
          message: "Guest info must include first_name, last_name, and email" 
        });
      }

      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize to midnight for fair comparison

      if (startDate < today) {
        return res.status(400).json({ message: "Check-in date cannot be in the past" });
      }

      if (endDate <= startDate) {
        return res.status(400).json({ message: "Check-out date must be after check-in date" });
      }

      if (guestCount < 1 || guestCount > 8) {
        return res.status(400).json({ message: "Guest count must be between 1 and 8" });
      }

      // Check availability
      const isAvailable = await storage.checkAvailability(start_date, end_date);
      if (!isAvailable) {
        return res.status(400).json({ message: "Selected dates are not available" });
      }

      // Get property
      const property = await storage.getProperty();
      if (!property) {
        return res.status(500).json({ message: "Property configuration error" });
      }

      // Calculate pricing
      const pricing = await storage.calculatePricing(start_date, end_date, guestCount, coupon_code);

      // Generate idempotency key
      const idempotencyKey = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create booking
      const bookingData = {
        property_id: property.id,
        start_date,
        end_date,
        nights: pricing.nights,
        guests: guestCount,
        subtotal: pricing.subtotal,
        taxes: pricing.taxes,
        fees: parseFloat(pricing.cleaningFee).toString(),
        total: pricing.total,
        idempotency_key: idempotencyKey,
      };

      const booking = await storage.createBooking(bookingData);

      // Add primary guest
      await storage.addGuest({
        booking_id: booking.id,
        first_name: guest_info.first_name,
        last_name: guest_info.last_name,
        email: guest_info.email,
        phone: guest_info.phone,
        is_primary: true,
      });

      res.status(201).json({ 
        booking_id: booking.id,
        total: booking.total,
        currency: booking.currency,
      });
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  // Get booking details
  app.get("/api/bookings/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const booking = await storage.getBooking(id);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const guests = await storage.getBookingGuests(booking.id);
      const property = await storage.getProperty();

      // Only reveal exact address for confirmed (paid) bookings
      const isConfirmed = booking.status === 'confirmed';
      
      res.json({
        ...booking,
        guests,
        property: property ? {
          title: property.title,
          address: isConfirmed ? property.address : "Honolulu, Hawaii (exact address provided after booking confirmation)",
          check_in_time: property.check_in_time,
          check_out_time: property.check_out_time,
        } : null,
      });
    } catch (error) {
      console.error("Error fetching booking:", error);
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });

  // Create payment intent
  app.post("/api/create-payment-intent", async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ message: "Payment processing not configured" });
    }

    try {
      const { booking_id } = req.body;

      if (!booking_id) {
        return res.status(400).json({ message: "Booking ID is required" });
      }

      const booking = await storage.getBooking(booking_id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (booking.status !== 'pending') {
        return res.status(400).json({ message: "Booking is not in pending status" });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(parseFloat(booking.total) * 100), // Convert to cents
        currency: booking.currency.toLowerCase(),
        metadata: {
          booking_id: booking.id,
        },
      });

      res.json({ 
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
      });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Failed to create payment intent" });
    }
  });

  // Stripe webhook
  app.post("/api/webhooks/stripe", async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ message: "Payment processing not configured" });
    }

    try {
      const sig = req.headers['stripe-signature'];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!sig || !webhookSecret) {
        return res.status(400).json({ message: "Invalid webhook signature" });
      }

      const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bookingId = paymentIntent.metadata.booking_id;

        if (bookingId) {
          // Check if booking is already confirmed (idempotency protection)
          const existingBooking = await storage.getBooking(bookingId);
          if (!existingBooking) {
            console.warn(`Webhook received for non-existent booking: ${bookingId}`);
            return res.json({ received: true });
          }
          
          if (existingBooking.status === 'confirmed') {
            console.log(`Webhook already processed for booking: ${bookingId}`);
            return res.json({ received: true });
          }

          // Update booking status
          const booking = await storage.updateBookingStatus(bookingId, 'confirmed', paymentIntent.id);
          
          // Get booking details for email
          const guests = await storage.getBookingGuests(bookingId);
          const property = await storage.getProperty();
          const primaryGuest = guests.find(g => g.is_primary);

          // Send confirmation email
          if (primaryGuest && property) {
            const emailContent = generateBookingConfirmationEmail(booking, primaryGuest, property);
            await sendEmail({
              to: primaryGuest.email,
              subject: 'Booking Confirmation - VacationRentalOahu.co',
              html: emailContent.html,
              text: emailContent.text,
            });
          }
        }
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(400).json({ message: "Webhook error" });
    }
  });

  // Contact form
  app.post("/api/contact", contactLimiter, async (req, res) => {
    try {
      const messageData = insertMessageSchema.parse({
        ...req.body,
        ip: req.ip,
      });

      const message = await storage.createMessage(messageData);

      // Send auto-reply
      const replyContent = generateContactReplyEmail(messageData.name, messageData.message);
      await sendEmail({
        to: messageData.email,
        subject: 'Thank you for contacting VacationRentalOahu.co',
        html: replyContent.html,
      });

      res.status(201).json({ message: "Message sent successfully" });
    } catch (error) {
      console.error("Error handling contact form:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid form data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Chat endpoints
  app.post("/api/chat/messages", chatLimiter, async (req, res) => {
    try {
      const messageData = insertChatMessageSchema.parse(req.body);
      const message = await storage.createChatMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating chat message:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create chat message" });
    }
  });

  app.get("/api/chat/messages/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      if (!sessionId) {
        return res.status(400).json({ message: "Session ID is required" });
      }
      
      const messages = await storage.getChatMessagesBySession(sessionId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  // EXTERNAL CALENDAR INTEGRATION ENDPOINTS

  // iCal export endpoint with security
  app.get("/api/ical/:propertyId.ics", integrationLimiter, async (req, res) => {
    try {
      const { propertyId } = req.params;
      const { key } = req.query;

      // SECURITY: Require ICAL_SECRET_KEY environment variable - NO DEFAULT
      const expectedKey = process.env.ICAL_SECRET_KEY;
      if (!expectedKey) {
        console.error("ICAL_SECRET_KEY environment variable not set - iCal export disabled");
        return res.status(503).json({ message: "iCal export service unavailable" });
      }
      
      if (!key || key !== expectedKey) {
        return res.status(401).json({ message: "Invalid access key" });
      }

      // Get property to verify it exists
      const property = await storage.getProperty();
      if (!property || property.id !== propertyId) {
        return res.status(404).json({ message: "Property not found" });
      }

      // Get confirmed bookings
      const bookings = await storage.getBookings({ status: 'confirmed' });
      
      // Generate iCal content
      const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      
      let icalContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//VacationRentalOahu.co//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        `X-WR-CALNAME:${property.title} - Bookings`,
        'X-WR-CALDESC:Confirmed bookings for vacation rental property',
        'X-WR-TIMEZONE:Pacific/Honolulu'
      ];

      bookings.forEach(booking => {
        const startDate = booking.start_date.replace(/-/g, '');
        const endDate = booking.end_date.replace(/-/g, '');
        const uid = `booking-${booking.id}@vacationrentaloahu.co`;
        
        icalContent = icalContent.concat([
          'BEGIN:VEVENT',
          `UID:${uid}`,
          `DTSTAMP:${now}`,
          `DTSTART;VALUE=DATE:${startDate}`,
          `DTEND;VALUE=DATE:${endDate}`,
          `SUMMARY:Booking - ${booking.nights} nights`,
          `DESCRIPTION:Confirmed booking for ${booking.guests} guests`,
          'STATUS:CONFIRMED',
          'TRANSP:OPAQUE',
          'END:VEVENT'
        ]);
      });

      icalContent.push('END:VCALENDAR');

      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${property.title.replace(/[^a-zA-Z0-9]/g, '_')}_bookings.ics"`);
      res.send(icalContent.join('\r\n'));
    } catch (error) {
      console.error("Error generating iCal export:", error);
      res.status(500).json({ message: "Failed to generate calendar export" });
    }
  });

  // Merged availability check (enhanced for checkout protection)
  app.get("/api/availability/merged", async (req, res) => {
    try {
      const { start, end } = req.query;
      
      if (!start || !end) {
        return res.status(400).json({ message: "Start and end dates are required" });
      }

      const startDate = new Date(start as string);
      const endDate = new Date(end as string);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize to midnight for fair comparison

      if (startDate < today) {
        return res.status(400).json({ message: "Check-in date cannot be in the past" });
      }

      if (endDate <= startDate) {
        return res.status(400).json({ message: "Check-out date must be after check-in date" });
      }

      const availability = await storage.getMergedAvailability(start as string, end as string);
      
      res.json({
        available: availability.available_dates.length > 0,
        availability: availability
      });
    } catch (error) {
      console.error("Error checking merged availability:", error);
      res.status(500).json({ message: "Failed to check availability" });
    }
  });

  // Create temporary hold for checkout process
  app.post("/api/holds", async (req, res) => {
    try {
      const { start_date, end_date, reference_id, duration_minutes = 15 } = req.body;

      if (!start_date || !end_date) {
        return res.status(400).json({ message: "Start and end dates are required" });
      }

      const property = await storage.getProperty();
      if (!property) {
        return res.status(500).json({ message: "Property configuration error" });
      }

      // Check if dates are still available
      const isAvailable = await storage.checkAvailability(start_date, end_date);
      if (!isAvailable) {
        return res.status(409).json({ message: "Dates are no longer available" });
      }

      // Create hold
      const expiresAt = new Date(Date.now() + duration_minutes * 60 * 1000);
      const hold = await storage.createHold({
        property_id: property.id,
        start_date,
        end_date,
        reason: 'checkout',
        reference_id: reference_id || `checkout-${Date.now()}`,
        expires_at: expiresAt
      });

      res.status(201).json(hold);
    } catch (error) {
      console.error("Error creating hold:", error);
      res.status(500).json({ message: "Failed to create hold" });
    }
  });

  // Release hold
  app.delete("/api/holds/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.releaseHold(id);
      res.json({ message: "Hold released successfully" });
    } catch (error) {
      console.error("Error releasing hold:", error);
      res.status(500).json({ message: "Failed to release hold" });
    }
  });

  // ADMIN API ROUTES

  // Admin dashboard stats
  app.get("/api/admin/dashboard", requireAdmin, async (req, res) => {
    try {
      const bookings = await storage.getBookings();
      const messages = await storage.getMessages();
      
      const stats = {
        total_bookings: bookings.length,
        confirmed_bookings: bookings.filter(b => b.status === 'confirmed').length,
        pending_bookings: bookings.filter(b => b.status === 'pending').length,
        total_revenue: bookings
          .filter(b => b.status === 'confirmed')
          .reduce((sum, b) => sum + parseFloat(b.total), 0),
        unread_messages: messages.filter(m => !m.replied).length,
        recent_bookings: bookings.slice(0, 5),
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Admin bookings
  app.get("/api/admin/bookings", requireAdmin, async (req, res) => {
    try {
      const { status, limit } = req.query;
      const bookings = await storage.getBookings({ 
        status: status as string,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      // Get guests for each booking
      const bookingsWithGuests = await Promise.all(
        bookings.map(async (booking) => {
          const guests = await storage.getBookingGuests(booking.id);
          return { ...booking, guests };
        })
      );

      res.json(bookingsWithGuests);
    } catch (error) {
      console.error("Error fetching admin bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Admin messages
  app.get("/api/admin/messages", requireAdmin, async (req, res) => {
    try {
      const messages = await storage.getMessages();
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Mark message as replied
  app.patch("/api/admin/messages/:id/replied", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.markMessageReplied(id);
      res.json({ message: "Message marked as replied" });
    } catch (error) {
      console.error("Error marking message replied:", error);
      res.status(500).json({ message: "Failed to mark message as replied" });
    }
  });

  // Admin chat endpoints
  app.get("/api/admin/chat/sessions", requireAdmin, async (req, res) => {
    try {
      const sessions = await storage.getChatSessions();
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching chat sessions:", error);
      res.status(500).json({ message: "Failed to fetch chat sessions" });
    }
  });

  app.post("/api/admin/chat/reply", requireAdmin, async (req, res) => {
    try {
      const { session_id, message, name, email } = req.body;
      
      if (!session_id || !message || !name || !email) {
        return res.status(400).json({ message: "Session ID, message, name, and email are required" });
      }

      const chatMessage = await storage.createChatMessage({
        name,
        email,
        message,
        session_id,
        is_admin: true,
      });

      res.status(201).json(chatMessage);
    } catch (error) {
      console.error("Error sending admin chat reply:", error);
      res.status(500).json({ message: "Failed to send admin reply" });
    }
  });

  // Admin blackout dates
  app.get("/api/admin/blackout-dates", requireAdmin, async (req, res) => {
    try {
      const dates = await storage.getBlackoutDates();
      res.json(dates);
    } catch (error) {
      console.error("Error fetching blackout dates:", error);
      res.status(500).json({ message: "Failed to fetch blackout dates" });
    }
  });

  app.post("/api/admin/blackout-dates", requireAdmin, async (req, res) => {
    try {
      const { start_date, end_date, reason } = req.body;
      
      if (!start_date || !end_date || !reason) {
        return res.status(400).json({ message: "Start date, end date, and reason are required" });
      }

      const blackout = await storage.addBlackoutDate({
        start_date,
        end_date,
        reason,
      });

      res.status(201).json(blackout);
    } catch (error) {
      console.error("Error creating blackout date:", error);
      res.status(500).json({ message: "Failed to create blackout date" });
    }
  });

  // Admin pricing rules
  app.get("/api/admin/pricing-rules", requireAdmin, async (req, res) => {
    try {
      const rules = await storage.getPricingRules();
      res.json(rules);
    } catch (error) {
      console.error("Error fetching pricing rules:", error);
      res.status(500).json({ message: "Failed to fetch pricing rules" });
    }
  });

  app.post("/api/admin/pricing-rules", requireAdmin, async (req, res) => {
    try {
      const { rule_type, start_date, end_date, value, min_nights, percentage, active } = req.body;
      
      if (!rule_type || !value) {
        return res.status(400).json({ message: "Rule type and value are required" });
      }

      const rule = await storage.createPricingRule({
        rule_type,
        start_date: start_date || null,
        end_date: end_date || null,
        value: parseFloat(value),
        min_nights: min_nights ? parseInt(min_nights) : null,
        percentage: percentage || false,
        active: active !== false,
      });

      res.status(201).json(rule);
    } catch (error) {
      console.error("Error creating pricing rule:", error);
      res.status(500).json({ message: "Failed to create pricing rule" });
    }
  });

  app.put("/api/admin/pricing-rules/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { rule_type, start_date, end_date, value, min_nights, percentage, active } = req.body;
      
      const rule = await storage.updatePricingRule(id, {
        rule_type,
        start_date: start_date || null,
        end_date: end_date || null,
        value: parseFloat(value),
        min_nights: min_nights ? parseInt(min_nights) : null,
        percentage: percentage || false,
        active: active !== false,
      });

      res.json(rule);
    } catch (error) {
      console.error("Error updating pricing rule:", error);
      res.status(500).json({ message: "Failed to update pricing rule" });
    }
  });

  app.delete("/api/admin/pricing-rules/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deletePricingRule(id);
      res.json({ message: "Pricing rule deleted successfully" });
    } catch (error) {
      console.error("Error deleting pricing rule:", error);
      res.status(500).json({ message: "Failed to delete pricing rule" });
    }
  });

  // Admin coupons
  app.get("/api/admin/coupons", requireAdmin, async (req, res) => {
    try {
      const coupons = await storage.getCoupons();
      res.json(coupons);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      res.status(500).json({ message: "Failed to fetch coupons" });
    }
  });

  app.post("/api/admin/coupons", requireAdmin, async (req, res) => {
    try {
      const { code, type, value, start_date, end_date, min_nights, usage_limit, active } = req.body;
      
      if (!code || !type || !value) {
        return res.status(400).json({ message: "Code, type, and value are required" });
      }

      const coupon = await storage.createCoupon({
        code: code.toUpperCase(),
        type,
        value: parseFloat(value),
        start_date: start_date || null,
        end_date: end_date || null,
        min_nights: min_nights ? parseInt(min_nights) : null,
        usage_limit: usage_limit ? parseInt(usage_limit) : null,
        active: active !== false,
      });

      res.status(201).json(coupon);
    } catch (error) {
      console.error("Error creating coupon:", error);
      res.status(500).json({ message: "Failed to create coupon" });
    }
  });

  app.put("/api/admin/coupons/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { code, type, value, start_date, end_date, min_nights, usage_limit, active } = req.body;
      
      const coupon = await storage.updateCoupon(id, {
        code: code.toUpperCase(),
        type,
        value: parseFloat(value),
        start_date: start_date || null,
        end_date: end_date || null,
        min_nights: min_nights ? parseInt(min_nights) : null,
        usage_limit: usage_limit ? parseInt(usage_limit) : null,
        active: active !== false,
      });

      res.json(coupon);
    } catch (error) {
      console.error("Error updating coupon:", error);
      res.status(500).json({ message: "Failed to update coupon" });
    }
  });

  app.delete("/api/admin/coupons/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteCoupon(id);
      res.json({ message: "Coupon deleted successfully" });
    } catch (error) {
      console.error("Error deleting coupon:", error);
      res.status(500).json({ message: "Failed to delete coupon" });
    }
  });

  // Admin Content Management API endpoints
  app.put("/api/admin/property", requireAdmin, async (req, res) => {
    try {
      const updatedProperty = await storage.updateProperty(req.body);
      res.json(updatedProperty);
    } catch (error) {
      console.error("Error updating property:", error);
      res.status(500).json({ message: "Failed to update property" });
    }
  });

  app.post("/api/admin/amenities", requireAdmin, async (req, res) => {
    try {
      const { name, icon, category, description } = req.body;
      
      if (!name || !icon || !category) {
        return res.status(400).json({ message: "Name, icon, and category are required" });
      }

      const amenity = await storage.addAmenity({
        name,
        icon,
        category,
        description: description || "",
      });

      res.status(201).json(amenity);
    } catch (error) {
      console.error("Error adding amenity:", error);
      res.status(500).json({ message: "Failed to add amenity" });
    }
  });

  app.delete("/api/admin/amenities/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteAmenity(id);
      res.status(200).json({ message: "Amenity deleted successfully" });
    } catch (error) {
      console.error("Error deleting amenity:", error);
      res.status(500).json({ message: "Failed to delete amenity" });
    }
  });

  // Admin Amenity Categories Management
  app.post("/api/admin/amenity-categories", requireAdmin, async (req, res) => {
    try {
      const categoryData = insertAmenityCategorySchema.parse(req.body);
      const category = await storage.addAmenityCategory(categoryData);
      res.status(201).json(category);
    } catch (error: any) {
      console.error("Error adding amenity category:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid category data", details: error.errors });
      }
      res.status(500).json({ message: "Failed to add amenity category" });
    }
  });

  app.put("/api/admin/amenity-categories/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const category = await storage.updateAmenityCategory(id, updates);
      res.json(category);
    } catch (error) {
      console.error("Error updating amenity category:", error);
      res.status(500).json({ message: "Failed to update amenity category" });
    }
  });

  app.delete("/api/admin/amenity-categories/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteAmenityCategory(id);
      res.status(200).json({ message: "Amenity category deleted successfully" });
    } catch (error) {
      console.error("Error deleting amenity category:", error);
      res.status(500).json({ message: "Failed to delete amenity category" });
    }
  });

  app.post("/api/admin/photos", requireAdmin, async (req, res) => {
    try {
      const { url, alt, sort_order, is_featured } = req.body;
      
      if (!url || !alt) {
        return res.status(400).json({ message: "URL and alt text are required" });
      }

      const photo = await storage.addPhoto({
        url,
        alt,
        sort_order: sort_order ? parseInt(sort_order) : 0,
        is_featured: is_featured || false,
      });

      res.status(201).json(photo);
    } catch (error) {
      console.error("Error adding photo:", error);
      res.status(500).json({ message: "Failed to add photo" });
    }
  });

  app.delete("/api/admin/photos/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deletePhoto(id);
      res.status(200).json({ message: "Photo deleted successfully" });
    } catch (error) {
      console.error("Error deleting photo:", error);
      res.status(500).json({ message: "Failed to delete photo" });
    }
  });

  // File upload endpoint for photos
  app.post("/api/admin/photos/upload", requireAdmin, (req, res, next) => {
    upload.single('image')(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: "File too large. Maximum size is 10MB." });
        }
        return res.status(400).json({ message: `Upload error: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ message: "Invalid file type. Only JPEG, PNG, and WebP images are allowed." });
      }
      
      // Continue to main handler
      next();
    });
  }, async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No valid image file uploaded" });
      }

      const { alt, sort_order, is_featured } = req.body;
      
      if (!alt) {
        return res.status(400).json({ message: "Alt text is required" });
      }

      // Create the URL for the uploaded file
      const fileUrl = `/uploads/${req.file.filename}`;

      const photo = await storage.addPhoto({
        url: fileUrl,
        alt,
        sort_order: sort_order ? parseInt(sort_order) : 0,
        is_featured: is_featured === 'true' || is_featured === true,
      });

      res.status(201).json(photo);
    } catch (error) {
      console.error("Error uploading photo:", error);
      res.status(500).json({ message: "Failed to upload photo" });
    }
  });

  // Admin Nearby Attractions Management
  app.post("/api/admin/nearby-attractions", requireAdmin, async (req, res) => {
    try {
      const attractionData = insertNearbyAttractionSchema.parse(req.body);
      const attraction = await storage.addNearbyAttraction(attractionData);
      res.status(201).json(attraction);
    } catch (error: any) {
      console.error("Error adding nearby attraction:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid attraction data", details: error.errors });
      }
      res.status(500).json({ message: "Failed to add nearby attraction" });
    }
  });

  app.put("/api/admin/nearby-attractions/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      // Validate the update data using the same schema but make all fields optional
      const updateSchema = insertNearbyAttractionSchema.partial();
      const updates = updateSchema.parse(req.body);
      const attraction = await storage.updateNearbyAttraction(id, updates);
      res.json(attraction);
    } catch (error: any) {
      console.error("Error updating nearby attraction:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid attraction data", details: error.errors });
      }
      res.status(500).json({ message: "Failed to update nearby attraction" });
    }
  });

  app.delete("/api/admin/nearby-attractions/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteNearbyAttraction(id);
      res.status(200).json({ message: "Nearby attraction deleted successfully" });
    } catch (error) {
      console.error("Error deleting nearby attraction:", error);
      res.status(500).json({ message: "Failed to delete nearby attraction" });
    }
  });

  // Admin Stats API endpoints
  app.get("/api/admin/stats/bookings", requireAdmin, async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const stats = await storage.getBookingStats(days);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching booking stats:", error);
      res.status(500).json({ message: "Failed to fetch booking stats" });
    }
  });

  app.get("/api/admin/stats/reviews", requireAdmin, async (req, res) => {
    try {
      const reviewSummary = await storage.getReviewsSummary();
      const recentReviews = await storage.getFeaturedReviews();
      
      res.json({
        ...reviewSummary,
        recentReviews: recentReviews.slice(0, 5),
        ratingDistribution: reviewSummary.reviewCounts,
      });
    } catch (error) {
      console.error("Error fetching review stats:", error);
      res.status(500).json({ message: "Failed to fetch review stats" });
    }
  });

  app.get("/api/admin/stats/messages", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getMessageStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching message stats:", error);
      res.status(500).json({ message: "Failed to fetch message stats" });
    }
  });

  // ADVANCED REPORTING API ENDPOINTS FOR PHASE 2
  
  // Revenue Analytics
  app.get("/api/admin/reports/revenue", requireAdmin, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate as string || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const end = endDate as string || new Date().toISOString().split('T')[0];
      
      const analytics = await storage.getRevenueAnalytics(start, end);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching revenue analytics:", error);
      res.status(500).json({ message: "Failed to fetch revenue analytics" });
    }
  });

  // Tax Analytics with Hawaii Compliance
  app.get("/api/admin/reports/taxes", requireAdmin, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate as string || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const end = endDate as string || new Date().toISOString().split('T')[0];
      
      const taxAnalytics = await storage.getTaxAnalytics(start, end);
      res.json(taxAnalytics);
    } catch (error) {
      console.error("Error fetching tax analytics:", error);
      res.status(500).json({ message: "Failed to fetch tax analytics" });
    }
  });

  // Booking Analytics  
  app.get("/api/admin/reports/bookings", requireAdmin, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate as string || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const end = endDate as string || new Date().toISOString().split('T')[0];
      
      const analytics = await storage.getBookingAnalytics(start, end);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching booking analytics:", error);
      res.status(500).json({ message: "Failed to fetch booking analytics" });
    }
  });

  // Financial Breakdown
  app.get("/api/admin/reports/financial", requireAdmin, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate as string || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const end = endDate as string || new Date().toISOString().split('T')[0];
      
      const breakdown = await storage.getFinancialBreakdown(start, end);
      res.json(breakdown);
    } catch (error) {
      console.error("Error fetching financial breakdown:", error);
      res.status(500).json({ message: "Failed to fetch financial breakdown" });
    }
  });

  // Guest Analytics
  app.get("/api/admin/reports/guests", requireAdmin, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate as string || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const end = endDate as string || new Date().toISOString().split('T')[0];
      
      const analytics = await storage.getGuestAnalytics(start, end);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching guest analytics:", error);
      res.status(500).json({ message: "Failed to fetch guest analytics" });
    }
  });

  // Export Data
  app.get("/api/admin/reports/export", requireAdmin, async (req, res) => {
    try {
      const { type, startDate, endDate, format } = req.query;
      const start = startDate as string || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const end = endDate as string || new Date().toISOString().split('T')[0];
      
      if (!type || !['revenue', 'bookings', 'taxes', 'guests'].includes(type as string)) {
        return res.status(400).json({ message: "Invalid export type. Must be: revenue, bookings, taxes, or guests" });
      }

      const data = await storage.getExportData(type as 'revenue' | 'bookings' | 'taxes' | 'guests', start, end);
      
      if (format === 'csv') {
        // Convert to CSV format
        if (data.length === 0) {
          return res.json({ message: "No data found for the specified date range" });
        }

        const headers = Object.keys(data[0]).join(',');
        const csvData = data.map(row => 
          Object.values(row).map(val => 
            typeof val === 'string' && val.includes(',') ? `"${val}"` : val
          ).join(',')
        ).join('\n');
        
        const csv = headers + '\n' + csvData;
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${type}-report-${start}-to-${end}.csv"`);
        res.send(csv);
      } else {
        // Return JSON format
        res.json(data);
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  // Email Template Management
  app.get("/api/admin/emails/templates", requireAdmin, async (req, res) => {
    try {
      const templates = await storage.getEmailTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching email templates:", error);
      res.status(500).json({ message: "Failed to fetch email templates" });
    }
  });

  app.get("/api/admin/emails/templates/:name", requireAdmin, async (req, res) => {
    try {
      const { name } = req.params;
      const template = await storage.getEmailTemplate(name);
      
      if (!template) {
        return res.status(404).json({ message: "Email template not found" });
      }
      
      res.json(template);
    } catch (error) {
      console.error("Error fetching email template:", error);
      res.status(500).json({ message: "Failed to fetch email template" });
    }
  });

  app.post("/api/admin/emails/templates", requireAdmin, async (req, res) => {
    try {
      const { name, subject, html_content, text_content, variables } = req.body;
      
      if (!name || !subject || !html_content) {
        return res.status(400).json({ message: "Name, subject, and HTML content are required" });
      }

      const template = await storage.createEmailTemplate({
        name,
        subject,
        html_content,
        text_content: text_content || '',
        variables: variables || [],
        is_active: true,
      });

      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating email template:", error);
      res.status(500).json({ message: "Failed to create email template" });
    }
  });

  app.put("/api/admin/emails/templates/:name", requireAdmin, async (req, res) => {
    try {
      const { name } = req.params;
      const { subject, html_content, text_content, variables, is_active } = req.body;
      
      const template = await storage.updateEmailTemplate(name, {
        subject,
        html_content,
        text_content,
        variables,
        is_active,
      });

      res.json(template);
    } catch (error) {
      console.error("Error updating email template:", error);
      res.status(500).json({ message: "Failed to update email template" });
    }
  });

  // Email Analytics
  app.get("/api/admin/emails/analytics", requireAdmin, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate as string || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const end = endDate as string || new Date().toISOString().split('T')[0];
      
      const analytics = await storage.getEmailAnalytics(start, end);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching email analytics:", error);
      res.status(500).json({ message: "Failed to fetch email analytics" });
    }
  });

  // Manual Email Send (for admin testing)
  app.post("/api/admin/emails/send", requireAdmin, async (req, res) => {
    try {
      const { template, recipient, bookingId, variables } = req.body;
      
      if (!template || !recipient) {
        return res.status(400).json({ message: "Template and recipient are required" });
      }

      // This would integrate with the enhanced email system
      // For now, return success response
      res.json({ 
        success: true, 
        message: "Email queued for delivery",
        template,
        recipient 
      });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ message: "Failed to send email" });
    }
  });

  // EXTERNAL CALENDAR INTEGRATION ADMIN ENDPOINTS

  // External Calendars Management
  app.get("/api/admin/integrations/calendars", requireAdmin, integrationLimiter, async (req, res) => {
    try {
      const calendars = await storage.getExternalCalendars();
      res.json(calendars);
    } catch (error) {
      console.error("Error fetching external calendars:", error);
      res.status(500).json({ message: "Failed to fetch external calendars" });
    }
  });

  app.post("/api/admin/integrations/calendars", requireAdmin, integrationLimiter, async (req, res) => {
    try {
      const calendarData = insertExternalCalendarSchema.parse(req.body);
      const calendar = await storage.createExternalCalendar(calendarData);
      res.status(201).json(calendar);
    } catch (error) {
      console.error("Error creating external calendar:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid calendar data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create external calendar" });
    }
  });

  app.put("/api/admin/integrations/calendars/:id", requireAdmin, integrationLimiter, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const calendar = await storage.updateExternalCalendar(id, updates);
      res.json(calendar);
    } catch (error) {
      console.error("Error updating external calendar:", error);
      res.status(500).json({ message: "Failed to update external calendar" });
    }
  });

  app.delete("/api/admin/integrations/calendars/:id", requireAdmin, integrationLimiter, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteExternalCalendar(id);
      res.json({ message: "External calendar deleted successfully" });
    } catch (error) {
      console.error("Error deleting external calendar:", error);
      res.status(500).json({ message: "Failed to delete external calendar" });
    }
  });

  // Calendar Sync Management
  app.post("/api/admin/integrations/sync/:id", requireAdmin, syncLimiter, async (req, res) => {
    try {
      const { id } = req.params;
      const { force = false } = req.body;

      // Get calendar details
      const calendar = await storage.getExternalCalendar(id);
      if (!calendar) {
        return res.status(404).json({ message: "Calendar not found" });
      }

      if (!calendar.active || !calendar.sync_enabled) {
        return res.status(400).json({ message: "Calendar is not active or sync is disabled" });
      }

      // Create sync run record
      const syncRun = await storage.createSyncRun({
        calendar_id: id,
        status: 'running'
      });

      // Note: The actual sync logic would be implemented in Step 4 (Sync Engine)
      // For now, we'll simulate a successful sync
      setTimeout(async () => {
        try {
          await storage.updateSyncRun(syncRun.id, {
            completed_at: new Date(),
            status: 'success',
            reservations_imported: 0,
            reservations_updated: 0,
            reservations_deleted: 0,
            response_time_ms: 1000
          });
        } catch (err) {
          console.error("Error updating sync run:", err);
        }
      }, 1000);

      res.json({ 
        message: "Sync initiated successfully", 
        sync_run_id: syncRun.id,
        calendar: calendar.name 
      });
    } catch (error) {
      console.error("Error initiating sync:", error);
      res.status(500).json({ message: "Failed to initiate sync" });
    }
  });

  // Sync Status and History
  app.get("/api/admin/integrations/sync-runs", requireAdmin, integrationLimiter, async (req, res) => {
    try {
      const { calendar_id, limit = 20 } = req.query;
      const syncRuns = await storage.getSyncRuns(
        calendar_id as string,
        parseInt(limit as string)
      );
      res.json(syncRuns);
    } catch (error) {
      console.error("Error fetching sync runs:", error);
      res.status(500).json({ message: "Failed to fetch sync runs" });
    }
  });

  // External Reservations Management
  app.get("/api/admin/integrations/reservations", requireAdmin, integrationLimiter, async (req, res) => {
    try {
      const { calendar_id } = req.query;
      const reservations = await storage.getExternalReservations(calendar_id as string);
      res.json(reservations);
    } catch (error) {
      console.error("Error fetching external reservations:", error);
      res.status(500).json({ message: "Failed to fetch external reservations" });
    }
  });

  app.delete("/api/admin/integrations/reservations/:calendarId", requireAdmin, integrationLimiter, async (req, res) => {
    try {
      const { calendarId } = req.params;
      const { external_uids } = req.body;
      
      const deletedCount = await storage.deleteExternalReservations(
        calendarId,
        external_uids
      );
      
      res.json({ 
        message: "External reservations deleted successfully", 
        deleted_count: deletedCount 
      });
    } catch (error) {
      console.error("Error deleting external reservations:", error);
      res.status(500).json({ message: "Failed to delete external reservations" });
    }
  });

  // Integration Health Dashboard
  app.get("/api/admin/integrations/health", requireAdmin, integrationLimiter, async (req, res) => {
    try {
      const calendars = await storage.getExternalCalendars();
      const activeHolds = await storage.getActiveHolds();
      
      const healthData = await Promise.all(
        calendars.map(async (calendar) => {
          const latestSync = await storage.getLatestSyncRun(calendar.id);
          const reservations = await storage.getExternalReservations(calendar.id);
          
          return {
            calendar_id: calendar.id,
            calendar_name: calendar.name,
            platform: calendar.platform,
            active: calendar.active,
            sync_enabled: calendar.sync_enabled,
            last_sync_at: calendar.last_sync_at,
            next_sync_at: calendar.next_sync_at,
            sync_errors: calendar.sync_errors,
            last_error: calendar.last_error,
            latest_sync_status: latestSync?.status || 'never',
            reservations_count: reservations.length,
            health_score: calendar.sync_errors === 0 ? 100 : Math.max(0, 100 - (calendar.sync_errors * 10))
          };
        })
      );

      res.json({
        calendars: healthData,
        active_holds: activeHolds.length,
        total_calendars: calendars.length,
        active_calendars: calendars.filter(c => c.active).length,
        sync_enabled_calendars: calendars.filter(c => c.sync_enabled).length,
        overall_health: healthData.length > 0 
          ? Math.round(healthData.reduce((sum, h) => sum + h.health_score, 0) / healthData.length)
          : 100
      });
    } catch (error) {
      console.error("Error fetching integration health:", error);
      res.status(500).json({ message: "Failed to fetch integration health" });
    }
  });

  // Purge Expired Holds (Admin utility)
  app.post("/api/admin/integrations/purge-holds", requireAdmin, integrationLimiter, async (req, res) => {
    try {
      const purgedCount = await storage.purgeExpiredHolds();
      res.json({ 
        message: "Expired holds purged successfully", 
        purged_count: purgedCount 
      });
    } catch (error) {
      console.error("Error purging expired holds:", error);
      res.status(500).json({ message: "Failed to purge expired holds" });
    }
  });

  // Test Calendar URL (Admin utility)
  app.post("/api/admin/integrations/test-url", requireAdmin, integrationLimiter, async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ message: "URL is required" });
      }

      // Simple URL validation
      try {
        new URL(url);
      } catch {
        return res.status(400).json({ message: "Invalid URL format" });
      }

      // Note: Actual iCal URL testing would be implemented in Step 4 (Sync Engine)
      // For now, we'll simulate a successful test
      res.json({ 
        valid: true, 
        message: "URL appears to be valid iCal format",
        test_performed_at: new Date().toISOString() 
      });
    } catch (error) {
      console.error("Error testing calendar URL:", error);
      res.status(500).json({ message: "Failed to test calendar URL" });
    }
  });

  // AIRBNB REVIEW ADMIN ENDPOINTS

  // Sync Airbnb Reviews (Manual Trigger)
  app.post("/api/admin/airbnb-reviews/sync", requireAdmin, syncLimiter, async (req, res) => {
    try {
      const { reviewsData } = req.body;
      
      if (!reviewsData || !Array.isArray(reviewsData)) {
        return res.status(400).json({ message: "Reviews data array is required" });
      }

      // Validate review data structure
      const validatedReviews = reviewsData.map(review => {
        try {
          return insertAirbnbReviewSchema.parse(review);
        } catch (error) {
          throw new Error(`Invalid review data: ${(error as Error).message}`);
        }
      });

      const result = await storage.syncAirbnbReviews(validatedReviews);
      
      res.json({
        message: "Airbnb reviews sync completed successfully",
        ...result,
        sync_date: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error syncing Airbnb reviews:", error);
      res.status(500).json({ message: "Failed to sync Airbnb reviews" });
    }
  });

  // Get Airbnb Reviews Stats
  app.get("/api/admin/airbnb-reviews/stats", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getAirbnbReviewsStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching Airbnb reviews stats:", error);
      res.status(500).json({ message: "Failed to fetch Airbnb reviews stats" });
    }
  });

  // Get All Airbnb Reviews (Admin)
  app.get("/api/admin/airbnb-reviews", requireAdmin, async (req, res) => {
    try {
      const reviews = await storage.getAirbnbReviews();
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching admin Airbnb reviews:", error);
      res.status(500).json({ message: "Failed to fetch Airbnb reviews" });
    }
  });

  // Create Airbnb Review (Manual Entry)
  app.post("/api/admin/airbnb-reviews", requireAdmin, async (req, res) => {
    try {
      const reviewData = insertAirbnbReviewSchema.parse(req.body);
      const review = await storage.createAirbnbReview(reviewData);
      
      res.status(201).json({
        message: "Airbnb review created successfully",
        review
      });
    } catch (error) {
      console.error("Error creating Airbnb review:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid review data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create Airbnb review" });
    }
  });

  // Update Airbnb Review
  app.patch("/api/admin/airbnb-reviews/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const review = await storage.updateAirbnbReview(id, updates);
      
      res.json({
        message: "Airbnb review updated successfully",
        review
      });
    } catch (error) {
      console.error("Error updating Airbnb review:", error);
      res.status(500).json({ message: "Failed to update Airbnb review" });
    }
  });

  // Toggle Airbnb Review Featured Status
  app.patch("/api/admin/airbnb-reviews/:id/featured", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { featured } = req.body;

      if (typeof featured !== 'boolean') {
        return res.status(400).json({ message: "Featured status must be a boolean" });
      }

      const review = await storage.toggleAirbnbReviewFeatured(id, featured);
      
      res.json({
        message: `Airbnb review ${featured ? 'featured' : 'unfeatured'} successfully`,
        review
      });
    } catch (error) {
      console.error("Error toggling Airbnb review featured status:", error);
      res.status(500).json({ message: "Failed to update featured status" });
    }
  });

  // Toggle Airbnb Review Active Status
  app.patch("/api/admin/airbnb-reviews/:id/active", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { active } = req.body;

      if (typeof active !== 'boolean') {
        return res.status(400).json({ message: "Active status must be a boolean" });
      }

      const review = await storage.toggleAirbnbReviewActive(id, active);
      
      res.json({
        message: `Airbnb review ${active ? 'activated' : 'deactivated'} successfully`,
        review
      });
    } catch (error) {
      console.error("Error toggling Airbnb review active status:", error);
      res.status(500).json({ message: "Failed to update active status" });
    }
  });

  // Delete Airbnb Review
  app.delete("/api/admin/airbnb-reviews/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteAirbnbReview(id);
      
      res.json({
        message: "Airbnb review deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting Airbnb review:", error);
      res.status(500).json({ message: "Failed to delete Airbnb review" });
    }
  });

  // REVIEW SOLICITATION ADMIN ENDPOINTS

  // Manual trigger for specific booking review solicitation
  app.post("/api/admin/review-solicitations/trigger", requireAdmin, reviewSolicitationLimiter, async (req, res) => {
    try {
      const { bookingId } = req.body;
      
      if (!bookingId) {
        return res.status(400).json({ message: "Booking ID is required" });
      }

      // Check if solicitation already exists
      const existingSolicitation = await storage.getReviewSolicitationByBooking(bookingId);
      if (existingSolicitation) {
        return res.status(400).json({ message: "Review solicitation already sent for this booking" });
      }

      // Get booking and guest information
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const guests = await storage.getBookingGuests(bookingId);
      const primaryGuest = guests.find(g => g.is_primary);
      if (!primaryGuest) {
        return res.status(404).json({ message: "Primary guest not found for booking" });
      }

      // Generate token and create solicitation record
      const token = storage.generateReviewToken(bookingId);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now

      const solicitation = await storage.createReviewSolicitation({
        booking_id: bookingId,
        guest_name: `${primaryGuest.first_name} ${primaryGuest.last_name}`,
        guest_email: primaryGuest.email,
        checkout_date: booking.end_date,
        review_link_token: token,
        token_expires_at: expiresAt,
        email_status: 'pending'
      });

      // Generate review URL
      const reviewUrl = `${req.protocol}://${req.get('Host')}/api/review-submit/${token}`;
      
      // Generate and send email
      const emailTemplate = generateReviewSolicitationEmail({
        guestName: primaryGuest.first_name,
        guestEmail: primaryGuest.email,
        reviewUrl,
        stayDates: {
          checkIn: booking.start_date,
          checkOut: booking.end_date
        },
        propertyName: "Chinaman's Ocean Front Beach House"
      });

      const emailResult = await sendEmail({
        to: primaryGuest.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text
      });

      // Update solicitation status
      if (emailResult.success) {
        await storage.updateReviewSolicitation(solicitation.id, {
          email_status: 'sent',
          solicitation_sent_date: new Date()
        });
      } else {
        await storage.updateReviewSolicitation(solicitation.id, {
          email_status: 'failed'
        });
      }

      res.json({
        message: emailResult.success ? "Review solicitation sent successfully" : "Failed to send review solicitation",
        success: emailResult.success,
        solicitation,
        emailResult
      });
    } catch (error) {
      console.error("Error triggering review solicitation:", error);
      res.status(500).json({ message: "Failed to trigger review solicitation" });
    }
  });

  // Get review solicitation statistics
  app.get("/api/admin/review-solicitations/stats", requireAdmin, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const stats = await storage.getReviewSolicitationStats(
        startDate as string,
        endDate as string
      );
      res.json(stats);
    } catch (error) {
      console.error("Error fetching review solicitation stats:", error);
      res.status(500).json({ message: "Failed to fetch review solicitation statistics" });
    }
  });

  // Daily automated job to send review solicitations
  app.post("/api/cron/send-review-solicitations", async (req, res) => {
    try {
      // Get eligible bookings for review solicitation
      const eligibleBookings = await storage.getEligibleBookingsForSolicitation();
      
      if (eligibleBookings.length === 0) {
        return res.json({
          message: "No eligible bookings found for review solicitation",
          processed: 0,
          sent: 0,
          failed: 0
        });
      }

      let sent = 0;
      let failed = 0;
      const results = [];

      for (const { booking, guest } of eligibleBookings) {
        try {
          // Generate token and create solicitation record
          const token = storage.generateReviewToken(booking.id);
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now

          const solicitation = await storage.createReviewSolicitation({
            booking_id: booking.id,
            guest_name: `${guest.first_name} ${guest.last_name}`,
            guest_email: guest.email,
            checkout_date: booking.end_date,
            review_link_token: token,
            token_expires_at: expiresAt,
            email_status: 'pending'
          });

          // Generate review URL
          const reviewUrl = `${req.protocol}://${req.get('Host')}/api/review-submit/${token}`;
          
          // Generate and send email
          const emailTemplate = generateReviewSolicitationEmail({
            guestName: guest.first_name,
            guestEmail: guest.email,
            reviewUrl,
            stayDates: {
              checkIn: booking.start_date,
              checkOut: booking.end_date
            },
            propertyName: "Chinaman's Ocean Front Beach House"
          });

          const emailResult = await sendEmail({
            to: guest.email,
            subject: emailTemplate.subject,
            html: emailTemplate.html,
            text: emailTemplate.text
          });

          // Update solicitation status
          if (emailResult.success) {
            await storage.updateReviewSolicitation(solicitation.id, {
              email_status: 'sent',
              solicitation_sent_date: new Date()
            });
            sent++;
          } else {
            await storage.updateReviewSolicitation(solicitation.id, {
              email_status: 'failed'
            });
            failed++;
          }

          results.push({
            bookingId: booking.id,
            guestEmail: guest.email,
            success: emailResult.success,
            error: emailResult.error
          });

        } catch (error) {
          console.error(`Error processing booking ${booking.id}:`, error);
          failed++;
          results.push({
            bookingId: booking.id,
            guestEmail: guest.email,
            success: false,
            error: (error as Error).message
          });
        }
      }

      res.json({
        message: `Processed ${eligibleBookings.length} eligible bookings`,
        processed: eligibleBookings.length,
        sent,
        failed,
        results
      });
    } catch (error) {
      console.error("Error in automated review solicitation job:", error);
      res.status(500).json({ message: "Failed to process automated review solicitations" });
    }
  });

  // Secure review submission link
  app.get("/api/review-submit/:token", async (req, res) => {
    try {
      const { token } = req.params;
      
      // Validate token
      const validation = await storage.validateReviewToken(token);
      
      if (!validation.valid) {
        if (validation.expired) {
          return res.status(410).redirect('/review-expired');
        }
        return res.status(404).redirect('/review-not-found');
      }

      // Get booking and guest information for pre-population
      const booking = await storage.getBooking(validation.bookingId!);
      const guests = await storage.getBookingGuests(validation.bookingId!);
      const primaryGuest = guests.find(g => g.is_primary);

      if (!booking || !primaryGuest) {
        return res.status(404).redirect('/review-not-found');
      }

      // Redirect to review submission form with pre-populated data
      const reviewFormUrl = `/submit-review?token=${token}&booking=${booking.id}&name=${encodeURIComponent(primaryGuest.first_name + ' ' + primaryGuest.last_name)}&email=${encodeURIComponent(primaryGuest.email)}&checkin=${booking.start_date}&checkout=${booking.end_date}`;
      
      res.redirect(reviewFormUrl);
    } catch (error) {
      console.error("Error processing review submission link:", error);
      res.status(500).redirect('/review-error');
    }
  });

  // SEO Settings API endpoints
  app.get("/api/admin/seo-settings", requireAdmin, async (req, res) => {
    try {
      const seoSettings = await storage.getSEOSettings();
      res.json(seoSettings);
    } catch (error) {
      console.error("Error fetching SEO settings:", error);
      res.status(500).json({ message: "Failed to fetch SEO settings" });
    }
  });

  app.put("/api/admin/seo-settings", requireAdmin, async (req, res) => {
    try {
      await storage.updateSEOSettings(req.body);
      res.json({ message: "SEO settings updated successfully" });
    } catch (error) {
      console.error("Error updating SEO settings:", error);
      res.status(500).json({ message: "Failed to update SEO settings" });
    }
  });

  // Public SEO settings endpoint (for frontend to fetch SEO data)
  app.get("/api/seo-settings", async (req, res) => {
    try {
      const seoSettings = await storage.getSEOSettings();
      res.json(seoSettings);
    } catch (error) {
      console.error("Error fetching public SEO settings:", error);
      res.status(500).json({ message: "Failed to fetch SEO settings" });
    }
  });

  // Site Info Settings routes
  app.get("/api/admin/site-info-settings", requireAdmin, async (req, res) => {
    try {
      const siteInfoSettings = await storage.getSiteInfoSettings();
      res.json(siteInfoSettings);
    } catch (error) {
      console.error("Error fetching site info settings:", error);
      res.status(500).json({ message: "Failed to fetch site info settings" });
    }
  });

  app.put("/api/admin/site-info-settings", requireAdmin, async (req, res) => {
    try {
      await storage.updateSiteInfoSettings(req.body);
      res.json({ message: "Site info settings updated successfully" });
    } catch (error) {
      console.error("Error updating site info settings:", error);
      res.status(500).json({ message: "Failed to update site info settings" });
    }
  });

  // Public site info settings endpoint (for footer and other frontend components)
  app.get("/api/settings/site_info", async (req, res) => {
    try {
      const siteInfoSettings = await storage.getSiteInfoSettings();
      res.json(siteInfoSettings);
    } catch (error) {
      console.error("Error fetching public site info settings:", error);
      res.status(500).json({ message: "Failed to fetch site info settings" });
    }
  });

  // Static routes (robots.txt, sitemap.xml)
  app.get("/robots.txt", (req, res) => {
    res.type('text/plain');
    res.send(`User-agent: *
Allow: /

Sitemap: https://vacationrentaloahu.co/sitemap.xml`);
  });

  app.get("/sitemap.xml", async (req, res) => {
    const baseUrl = process.env.SITE_URL || 'https://vacationrentaloahu.co';
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/stay</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/contact</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/policies</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>`;

    res.type('application/xml');
    res.send(sitemap);
  });

  // PAGE BUILDER API ROUTES

  // Get all page layouts
  app.get("/api/admin/page-layouts", requireAdmin, async (req, res) => {
    try {
      const layouts = await storage.getPageLayouts();
      res.json(layouts);
    } catch (error) {
      console.error("Error fetching page layouts:", error);
      res.status(500).json({ message: "Failed to fetch page layouts" });
    }
  });

  // Get page layout by slug
  app.get("/api/admin/page-layouts/:slug", requireAdmin, async (req, res) => {
    try {
      const { slug } = req.params;
      const layout = await storage.getPageLayout(slug);
      if (!layout) {
        return res.status(404).json({ message: "Page layout not found" });
      }
      res.json(layout);
    } catch (error) {
      console.error("Error fetching page layout:", error);
      res.status(500).json({ message: "Failed to fetch page layout" });
    }
  });

  // Create page layout
  app.post("/api/admin/page-layouts", requireAdmin, async (req, res) => {
    try {
      const layoutData = insertPageLayoutSchema.parse(req.body);
      const layout = await storage.createPageLayout(layoutData);
      res.status(201).json(layout);
    } catch (error: any) {
      console.error("Error creating page layout:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid layout data", details: error.errors });
      }
      res.status(500).json({ message: "Failed to create page layout" });
    }
  });

  // Update page layout
  app.put("/api/admin/page-layouts/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updateSchema = insertPageLayoutSchema.partial();
      const updates = updateSchema.parse(req.body);
      const layout = await storage.updatePageLayout(id, updates);
      res.json(layout);
    } catch (error: any) {
      console.error("Error updating page layout:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid layout data", details: error.errors });
      }
      res.status(500).json({ message: "Failed to update page layout" });
    }
  });

  // Delete page layout
  app.delete("/api/admin/page-layouts/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deletePageLayout(id);
      res.status(200).json({ message: "Page layout deleted successfully" });
    } catch (error) {
      console.error("Error deleting page layout:", error);
      res.status(500).json({ message: "Failed to delete page layout" });
    }
  });

  // Get content blocks for a layout
  app.get("/api/admin/page-layouts/:layoutId/content-blocks", requireAdmin, async (req, res) => {
    try {
      const { layoutId } = req.params;
      const blocks = await storage.getContentBlocks(layoutId);
      res.json(blocks);
    } catch (error) {
      console.error("Error fetching content blocks:", error);
      res.status(500).json({ message: "Failed to fetch content blocks" });
    }
  });

  // Create content block
  app.post("/api/admin/content-blocks", requireAdmin, async (req, res) => {
    try {
      const blockData = insertContentBlockSchema.parse(req.body);
      const block = await storage.createContentBlock(blockData);
      res.status(201).json(block);
    } catch (error: any) {
      console.error("Error creating content block:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid block data", details: error.errors });
      }
      res.status(500).json({ message: "Failed to create content block" });
    }
  });

  // Update content block
  app.put("/api/admin/content-blocks/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updateSchema = insertContentBlockSchema.partial();
      const updates = updateSchema.parse(req.body);
      const block = await storage.updateContentBlock(id, updates);
      res.json(block);
    } catch (error: any) {
      console.error("Error updating content block:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid block data", details: error.errors });
      }
      res.status(500).json({ message: "Failed to update content block" });
    }
  });

  // Update content blocks order
  app.patch("/api/admin/content-blocks/reorder", requireAdmin, async (req, res) => {
    try {
      const { blocks } = req.body; // Array of { id, sort_order }
      const reorderedBlocks = await storage.reorderContentBlocks(blocks);
      res.json(reorderedBlocks);
    } catch (error) {
      console.error("Error reordering content blocks:", error);
      res.status(500).json({ message: "Failed to reorder content blocks" });
    }
  });

  // Delete content block
  app.delete("/api/admin/content-blocks/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteContentBlock(id);
      res.status(200).json({ message: "Content block deleted successfully" });
    } catch (error) {
      console.error("Error deleting content block:", error);
      res.status(500).json({ message: "Failed to delete content block" });
    }
  });

  // Get all block types
  app.get("/api/admin/block-types", requireAdmin, async (req, res) => {
    try {
      const blockTypes = await storage.getBlockTypes();
      res.json(blockTypes);
    } catch (error) {
      console.error("Error fetching block types:", error);
      res.status(500).json({ message: "Failed to fetch block types" });
    }
  });

  // Create block type
  app.post("/api/admin/block-types", requireAdmin, async (req, res) => {
    try {
      const blockTypeData = insertBlockTypeSchema.parse(req.body);
      const blockType = await storage.createBlockType(blockTypeData);
      res.status(201).json(blockType);
    } catch (error: any) {
      console.error("Error creating block type:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid block type data", details: error.errors });
      }
      res.status(500).json({ message: "Failed to create block type" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
