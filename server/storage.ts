import { 
  users, 
  property, 
  photos, 
  nearby_attractions,
  amenities, 
  amenity_categories,
  property_amenities,
  pricing_rules,
  blackout_dates,
  bookings,
  guests,
  messages,
  chat_messages,
  email_events,
  email_templates,
  audit_logs,
  coupons,
  settings,
  guest_reviews,
  airbnb_reviews,
  external_calendars,
  external_reservations,
  holds,
  sync_runs,
  review_solicitations,
  page_layouts,
  content_blocks,
  block_types,
  type User, 
  type InsertUser,
  type Property,
  type Photo,
  type NearbyAttraction,
  type InsertNearbyAttraction,
  type Amenity,
  type AmenityCategory,
  type InsertAmenityCategory,
  type PricingRule,
  type BlackoutDate,
  type Booking,
  type InsertBooking,
  type Guest,
  type InsertGuest,
  type Message,
  type InsertMessage,
  type ChatMessage,
  type InsertChatMessage,
  type EmailEvent,
  type EmailTemplate,
  type InsertEmailTemplate,
  type Coupon,
  type Setting,
  type GuestReview,
  type InsertGuestReview,
  type AirbnbReview,
  type InsertAirbnbReview,
  type UnifiedReview,
  type ExternalCalendar,
  type InsertExternalCalendar,
  type ExternalReservation,
  type InsertExternalReservation,
  type Hold,
  type InsertHold,
  type SyncRun,
  type InsertSyncRun,
  type ReviewSolicitation,
  type InsertReviewSolicitation,
  type PageLayout,
  type InsertPageLayout,
  type ContentBlock,
  type InsertContentBlock,
  type BlockType,
  type InsertBlockType
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, gte, lte, desc, asc, sum, count, avg, between, sql, inArray } from "drizzle-orm";
import { randomBytes, createHash } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Property
  getProperty(): Promise<Property | undefined>;
  getPropertyWithDetails(): Promise<any>;
  getPropertyPublicDetails(): Promise<any>;
  updateProperty(updates: Partial<Property>): Promise<Property>;

  // Photos
  getPhotos(): Promise<Photo[]>;
  addPhoto(photo: { url: string; alt: string; sort_order?: number; is_featured?: boolean }): Promise<Photo>;
  deletePhoto(id: string): Promise<void>;

  // Nearby Attractions
  getNearbyAttractions(): Promise<NearbyAttraction[]>;
  addNearbyAttraction(attraction: InsertNearbyAttraction): Promise<NearbyAttraction>;
  updateNearbyAttraction(id: string, updates: Partial<NearbyAttraction>): Promise<NearbyAttraction>;
  deleteNearbyAttraction(id: string): Promise<void>;

  // Amenity Categories
  getAmenityCategories(): Promise<AmenityCategory[]>;
  addAmenityCategory(category: InsertAmenityCategory): Promise<AmenityCategory>;
  updateAmenityCategory(id: string, updates: Partial<AmenityCategory>): Promise<AmenityCategory>;
  deleteAmenityCategory(id: string): Promise<void>;

  // Amenities
  getAmenities(): Promise<Amenity[]>;
  getPropertyAmenities(): Promise<Amenity[]>;
  addAmenity(amenity: { name: string; icon: string; category: string; description?: string }): Promise<Amenity>;
  deleteAmenity(id: string): Promise<void>;

  // Pricing
  getPricingRules(): Promise<PricingRule[]>;
  calculatePricing(startDate: string, endDate: string, guests: number, couponCode?: string): Promise<any>;

  // Availability
  checkAvailability(startDate: string, endDate: string): Promise<boolean>;
  getBlackoutDates(): Promise<BlackoutDate[]>;
  addBlackoutDate(dates: { start_date: string; end_date: string; reason: string }): Promise<BlackoutDate>;

  // Bookings
  createBooking(booking: InsertBooking): Promise<Booking>;
  getBooking(id: string): Promise<Booking | undefined>;
  getBookings(filters?: { status?: string; limit?: number }): Promise<Booking[]>;
  updateBookingStatus(id: string, status: string, paymentIntentId?: string): Promise<Booking>;

  // Guests
  addGuest(guest: InsertGuest): Promise<Guest>;
  getBookingGuests(bookingId: string): Promise<Guest[]>;

  // Messages
  createMessage(message: InsertMessage): Promise<Message>;
  getMessages(): Promise<Message[]>;
  markMessageReplied(id: string): Promise<void>;

  // Chat Messages
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessagesBySession(sessionId: string): Promise<ChatMessage[]>;
  getChatSessions(): Promise<Array<{ sessionId: string; name: string; email: string; lastMessage: string; lastMessageAt: Date }>>;

  // Coupons
  getCoupon(code: string): Promise<Coupon | undefined>;
  validateCoupon(code: string, startDate: string, nights: number): Promise<Coupon | null>;

  // Settings
  getSetting(key: string): Promise<any>;
  updateSetting(key: string, value: any): Promise<Setting>;

  // SEO Settings
  getSEOSettings(): Promise<{
    site_title: string;
    site_description: string;
    og_image_url: string;
    twitter_handle: string;
    page_titles: { [key: string]: string };
    meta_descriptions: { [key: string]: string };
  }>;
  updateSEOSettings(settings: { [key: string]: any }): Promise<void>;

  // Site Info Settings
  getSiteInfoSettings(): Promise<{
    site_name: string;
    site_description: string;
    contact_email: string;
    contact_phone: string;
    address: string;
    social_links: { [key: string]: string };
    license_number?: string;
  }>;
  updateSiteInfoSettings(settings: { [key: string]: any }): Promise<void>;

  // Page Builder
  getPageLayouts(): Promise<PageLayout[]>;
  getPageLayout(slug: string): Promise<PageLayout | undefined>;
  createPageLayout(layout: InsertPageLayout): Promise<PageLayout>;
  updatePageLayout(id: string, updates: Partial<PageLayout>): Promise<PageLayout>;
  deletePageLayout(id: string): Promise<void>;
  
  getContentBlocks(layoutId: string): Promise<ContentBlock[]>;
  createContentBlock(block: InsertContentBlock): Promise<ContentBlock>;
  updateContentBlock(id: string, updates: Partial<ContentBlock>): Promise<ContentBlock>;
  reorderContentBlocks(blocks: { id: string; sort_order: number }[]): Promise<ContentBlock[]>;
  deleteContentBlock(id: string): Promise<void>;
  
  getBlockTypes(): Promise<BlockType[]>;
  createBlockType(blockType: InsertBlockType): Promise<BlockType>;

  // Guest Reviews
  getGuestReviews(): Promise<GuestReview[]>;
  getApprovedReviews(): Promise<GuestReview[]>;
  getFeaturedReviews(): Promise<GuestReview[]>;
  getReviewsSummary(): Promise<{ averageRating: number; totalReviews: number; reviewCounts: { 1: number; 2: number; 3: number; 4: number; 5: number } }>;
  
  // Review Submission & Verification
  submitGuestReview(review: InsertGuestReview & { ip_address?: string }): Promise<GuestReview>;
  verifyGuestEligibility(email: string, stayStartDate: string, stayEndDate: string): Promise<{ eligible: boolean; bookingId?: string; verified: boolean }>;
  
  // Admin Review Management
  getPendingReviews(): Promise<GuestReview[]>;
  getReviewById(id: string): Promise<GuestReview | undefined>;
  approveReview(id: string, adminId: string, adminNotes?: string): Promise<GuestReview>;
  rejectReview(id: string, adminId: string, reason: string): Promise<GuestReview>;
  updateReview(id: string, updates: Partial<GuestReview>, adminId: string): Promise<GuestReview>;
  deleteReview(id: string, adminId: string, reason: string): Promise<void>;
  toggleReviewFeatured(id: string, featured: boolean): Promise<GuestReview>;

  // Admin Stats (Basic)
  getBookingStats(days: number): Promise<any>;
  getMessageStats(): Promise<any>;
  
  // Advanced Reporting
  getRevenueAnalytics(startDate: string, endDate: string): Promise<{
    totalRevenue: number;
    grossRevenue: number;
    netRevenue: number;
    monthlyBreakdown: Array<{ month: string; revenue: number; bookings: number }>;
    averageBookingValue: number;
    occupancyRate: number;
    averageDailyRate: number;
  }>;
  
  getTaxAnalytics(startDate: string, endDate: string): Promise<{
    totalTaxes: number;
    tatTaxes: number;
    getTaxes: number;
    countyTaxes: number;
    taxBreakdown: Array<{ month: string; tat: number; get: number; county: number }>;
  }>;
  
  getBookingAnalytics(startDate: string, endDate: string): Promise<{
    totalBookings: number;
    confirmedBookings: number;
    canceledBookings: number;
    averageStayLength: number;
    averageGroupSize: number;
    occupancyRate: number;
    seasonalTrends: Array<{ month: string; bookings: number; occupancy: number }>;
    guestDemographics: {
      repeatCustomers: number;
      newGuests: number;
      averageGuestsPerBooking: number;
    };
  }>;
  
  getFinancialBreakdown(startDate: string, endDate: string): Promise<{
    grossRevenue: number;
    cleaningFees: number;
    serviceFees: number;
    taxes: number;
    netRevenue: number;
    revenueByMonth: Array<{ month: string; gross: number; net: number; taxes: number; fees: number }>;
  }>;
  
  getGuestAnalytics(startDate: string, endDate: string): Promise<{
    totalGuests: number;
    uniqueGuests: number;
    repeatGuests: number;
    averageStayLength: number;
    averageGroupSize: number;
    guestSources: Array<{ source: string; count: number; revenue: number }>;
  }>;
  
  // Email Management
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  getEmailTemplates(): Promise<EmailTemplate[]>;
  getEmailTemplate(name: string): Promise<EmailTemplate | undefined>;
  updateEmailTemplate(name: string, updates: Partial<EmailTemplate>): Promise<EmailTemplate>;
  logEmailEvent(event: Omit<EmailEvent, 'id'>): Promise<EmailEvent>;
  getEmailAnalytics(startDate: string, endDate: string): Promise<{
    totalSent: number;
    delivered: number;
    opened: number;
    clicked: number;
    failed: number;
    templateBreakdown: Array<{ template: string; sent: number; delivered: number; openRate: number }>;
  }>;
  
  // Export Methods
  getExportData(type: 'revenue' | 'bookings' | 'taxes' | 'guests', startDate: string, endDate: string): Promise<any[]>;

  // Review Solicitation Methods
  createReviewSolicitation(solicitation: InsertReviewSolicitation): Promise<ReviewSolicitation>;
  getReviewSolicitation(id: string): Promise<ReviewSolicitation | undefined>;
  getReviewSolicitationByToken(token: string): Promise<ReviewSolicitation | undefined>;
  getReviewSolicitationByBooking(bookingId: string): Promise<ReviewSolicitation | undefined>;
  updateReviewSolicitation(id: string, updates: Partial<ReviewSolicitation>): Promise<ReviewSolicitation>;
  markReviewSubmitted(bookingId: string): Promise<void>;
  getEligibleBookingsForSolicitation(): Promise<Array<{ booking: Booking; guest: Guest }>>;
  getReviewSolicitationStats(startDate?: string, endDate?: string): Promise<{
    totalSent: number;
    reviewsSubmitted: number;
    responseRate: number;
    pendingSolicitations: number;
    failedSolicitations: number;
  }>;
  generateReviewToken(bookingId: string): string;
  validateReviewToken(token: string): Promise<{ valid: boolean; bookingId?: string; expired?: boolean }>;

  // External Calendar Integration
  getExternalCalendars(): Promise<ExternalCalendar[]>;
  getExternalCalendar(id: string): Promise<ExternalCalendar | undefined>;
  createExternalCalendar(calendar: InsertExternalCalendar): Promise<ExternalCalendar>;
  updateExternalCalendar(id: string, updates: Partial<ExternalCalendar>): Promise<ExternalCalendar>;
  deleteExternalCalendar(id: string): Promise<void>;
  
  // External Reservations Management
  upsertExternalReservations(calendarId: string, reservations: InsertExternalReservation[]): Promise<{ imported: number; updated: number; deleted: number }>;
  getExternalReservations(calendarId?: string): Promise<ExternalReservation[]>;
  deleteExternalReservations(calendarId: string, externalUids?: string[]): Promise<number>;
  
  // Availability with External Sources
  getMergedAvailability(startDate: string, endDate: string): Promise<{
    local_bookings: Booking[];
    external_reservations: ExternalReservation[];
    blackout_dates: BlackoutDate[];
    holds: Hold[];
    available_dates: string[];
    blocked_dates: Array<{ date: string; reason: string; source: 'booking' | 'external' | 'blackout' | 'hold' }>;
  }>;
  
  // Hold Management for Checkout Protection
  createHold(hold: InsertHold): Promise<Hold>;
  getActiveHolds(propertyId?: string): Promise<Hold[]>;
  purgeExpiredHolds(): Promise<number>;
  releaseHold(id: string): Promise<void>;
  
  // Sync Run Management
  createSyncRun(syncRun: InsertSyncRun): Promise<SyncRun>;
  updateSyncRun(id: string, updates: Partial<SyncRun>): Promise<SyncRun>;
  getSyncRuns(calendarId?: string, limit?: number): Promise<SyncRun[]>;
  getLatestSyncRun(calendarId: string): Promise<SyncRun | undefined>;
  
  // Airbnb Review Integration
  getAirbnbReviews(): Promise<AirbnbReview[]>;
  getAirbnbReviewById(id: string): Promise<AirbnbReview | undefined>;
  createAirbnbReview(review: InsertAirbnbReview): Promise<AirbnbReview>;
  updateAirbnbReview(id: string, updates: Partial<AirbnbReview>): Promise<AirbnbReview>;
  deleteAirbnbReview(id: string): Promise<void>;
  syncAirbnbReviews(reviewsData: InsertAirbnbReview[]): Promise<{ imported: number; updated: number; skipped: number }>;
  
  // Unified Review System
  getUnifiedReviews(): Promise<UnifiedReview[]>;
  getFeaturedUnifiedReviews(): Promise<UnifiedReview[]>;
  getUnifiedReviewsSummary(): Promise<{ 
    averageRating: number; 
    totalReviews: number; 
    guestReviews: number;
    airbnbReviews: number;
    reviewCounts: { 1: number; 2: number; 3: number; 4: number; 5: number };
    sources: { guest: number; airbnb: number };
  }>;
  
  // Airbnb Review Admin Management
  toggleAirbnbReviewFeatured(id: string, featured: boolean): Promise<AirbnbReview>;
  toggleAirbnbReviewActive(id: string, active: boolean): Promise<AirbnbReview>;
  getAirbnbReviewsStats(): Promise<{
    total: number;
    active: number;
    featured: number;
    averageRating: number;
    lastSyncDate?: string;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Property
  async getProperty(): Promise<Property | undefined> {
    const [prop] = await db.select().from(property).limit(1);
    return prop || undefined;
  }

  async getPropertyWithDetails(): Promise<any> {
    const prop = await this.getProperty();
    if (!prop) return null;

    const photos = await this.getPhotos();
    const amenities = await this.getPropertyAmenities();
    
    // SECURITY WARNING: This method returns sensitive data including exact address
    // This should ONLY be called from authenticated/admin endpoints
    return {
      ...prop,
      photos,
      amenities,
    };
  }

  async getPropertyPublicDetails(): Promise<any> {
    const prop = await this.getProperty();
    if (!prop) return null;

    const photos = await this.getPhotos();
    const amenities = await this.getPropertyAmenities();
    
    // Return property details without exact address and coordinates for privacy
    const { address, lat, lng, ...publicProp } = prop;
    
    return {
      ...publicProp,
      // Use the general_location from database or fallback to generic location
      general_location: prop.general_location || "Kaneohe, Hawaii",
      photos,
      amenities,
    };
  }

  async updateProperty(updates: Partial<Property>): Promise<Property> {
    const prop = await this.getProperty();
    if (!prop) {
      throw new Error("Property not found");
    }

    const [updated] = await db
      .update(property)
      .set({ ...updates, id: prop.id })
      .where(eq(property.id, prop.id))
      .returning();

    return updated;
  }

  // Photos
  async getPhotos(): Promise<Photo[]> {
    return await db
      .select()
      .from(photos)
      .orderBy(asc(photos.sort_order));
  }

  async addPhoto(photoData: { url: string; alt: string; sort_order?: number; is_featured?: boolean }): Promise<Photo> {
    const prop = await this.getProperty();
    if (!prop) {
      throw new Error("Property not found");
    }

    const [photo] = await db
      .insert(photos)
      .values({
        property_id: prop.id,
        ...photoData,
      })
      .returning();

    return photo;
  }

  async deletePhoto(id: string): Promise<void> {
    await db.delete(photos).where(eq(photos.id, id));
  }

  // Nearby Attractions implementation
  async getNearbyAttractions(): Promise<NearbyAttraction[]> {
    const prop = await this.getProperty();
    if (!prop) {
      return [];
    }

    return await db
      .select()
      .from(nearby_attractions)
      .where(and(eq(nearby_attractions.property_id, prop.id), eq(nearby_attractions.active, true)))
      .orderBy(asc(nearby_attractions.sort_order), asc(nearby_attractions.name));
  }

  async addNearbyAttraction(attractionData: InsertNearbyAttraction): Promise<NearbyAttraction> {
    const prop = await this.getProperty();
    if (!prop) {
      throw new Error("Property not found");
    }

    const [attraction] = await db
      .insert(nearby_attractions)
      .values({
        property_id: prop.id,
        ...attractionData,
      })
      .returning();

    return attraction;
  }

  async updateNearbyAttraction(id: string, updates: Partial<NearbyAttraction>): Promise<NearbyAttraction> {
    const [attraction] = await db
      .update(nearby_attractions)
      .set(updates)
      .where(eq(nearby_attractions.id, id))
      .returning();

    if (!attraction) {
      throw new Error("Attraction not found");
    }

    return attraction;
  }

  async deleteNearbyAttraction(id: string): Promise<void> {
    await db.delete(nearby_attractions).where(eq(nearby_attractions.id, id));
  }

  // Amenity Categories
  async getAmenityCategories(): Promise<AmenityCategory[]> {
    return await db.select().from(amenity_categories).orderBy(asc(amenity_categories.sort_order), asc(amenity_categories.name));
  }

  async addAmenityCategory(category: InsertAmenityCategory): Promise<AmenityCategory> {
    const [result] = await db.insert(amenity_categories).values(category).returning();
    return result;
  }

  async updateAmenityCategory(id: string, updates: Partial<AmenityCategory>): Promise<AmenityCategory> {
    const [result] = await db
      .update(amenity_categories)
      .set(updates)
      .where(eq(amenity_categories.id, id))
      .returning();
    return result;
  }

  async deleteAmenityCategory(id: string): Promise<void> {
    await db.delete(amenity_categories).where(eq(amenity_categories.id, id));
  }

  // Amenities
  async getAmenities(): Promise<Amenity[]> {
    return await db.select().from(amenities).orderBy(asc(amenities.category), asc(amenities.name));
  }

  async getPropertyAmenities(): Promise<Amenity[]> {
    const prop = await this.getProperty();
    if (!prop) return [];

    const result = await db
      .select({
        id: amenities.id,
        name: amenities.name,
        icon: amenities.icon,
        category: amenities.category,
        description: amenities.description,
        featured: amenities.featured,
        created_at: amenities.created_at,
      })
      .from(amenities)
      .innerJoin(property_amenities, eq(amenities.id, property_amenities.amenity_id))
      .where(eq(property_amenities.property_id, prop.id))
      .orderBy(desc(amenities.featured), asc(amenities.category), asc(amenities.name));

    return result;
  }

  async addAmenity(amenityData: { name: string; icon: string; category: string; description?: string }): Promise<Amenity> {
    const [amenity] = await db.insert(amenities).values(amenityData).returning();
    
    // Link to property
    const prop = await this.getProperty();
    if (prop) {
      await db.insert(property_amenities).values({
        property_id: prop.id,
        amenity_id: amenity.id,
      });
    }
    
    return amenity;
  }

  async deleteAmenity(id: string): Promise<void> {
    // Remove from property_amenities first
    await db.delete(property_amenities).where(eq(property_amenities.amenity_id, id));
    // Then delete the amenity
    await db.delete(amenities).where(eq(amenities.id, id));
  }

  // Pricing
  async getPricingRules(): Promise<PricingRule[]> {
    const prop = await this.getProperty();
    if (!prop) return [];

    return await db
      .select()
      .from(pricing_rules)
      .where(and(
        eq(pricing_rules.property_id, prop.id),
        eq(pricing_rules.active, true)
      ))
      .orderBy(asc(pricing_rules.rule_type));
  }

  async calculatePricing(startDate: string, endDate: string, guests: number, couponCode?: string): Promise<any> {
    const rules = await this.getPricingRules();
    const nights = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));

    // Base rate
    const baseRule = rules.find(r => r.rule_type === 'base');
    let baseRate = parseFloat(baseRule?.value || '450');

    // Check for seasonal rates (simplified)
    let nightlyRate = baseRate;

    // Calculate subtotal
    const subtotal = nightlyRate * nights;

    // Fees
    const cleaningRule = rules.find(r => r.rule_type === 'cleaning_fee');
    
    // Hawaii tax rates
    const tatRule = rules.find(r => r.rule_type === 'tat_rate');
    const getRule = rules.find(r => r.rule_type === 'get_rate');  
    const countyTaxRule = rules.find(r => r.rule_type === 'county_tax_rate');

    const cleaningFee = parseFloat(cleaningRule?.value || '350');
    
    // Hawaii tax calculation per state law (compliant with HI tax rules)
    // Base for TAT & County: gross rental proceeds including mandatory fees
    const grossRentalProceeds = subtotal + cleaningFee; // No service fee
    
    // Handle percentage values correctly (stored as whole percentages, need to divide by 100)
    const tatRate = tatRule && tatRule.percentage ? parseFloat(tatRule.value || '10.25') / 100 : parseFloat(tatRule?.value || '0.1025');
    const countyRate = countyTaxRule && countyTaxRule.percentage ? parseFloat(countyTaxRule.value || '3') / 100 : parseFloat(countyTaxRule?.value || '0.03');
    const getRate = getRule && getRule.percentage ? parseFloat(getRule.value || '4.5') / 100 : parseFloat(getRule?.value || '0.045');
    
    const tatTax = grossRentalProceeds * tatRate; // 10.25%
    const countyTax = grossRentalProceeds * countyRate; // 3%
    
    // GET: Apply to gross receipts including other taxes (tax-on-tax per Hawaii law)
    const grossReceipts = grossRentalProceeds + tatTax + countyTax;
    const getTax = grossReceipts * getRate; // 4.5%
    
    const totalTaxes = tatTax + countyTax + getTax;

    // Apply coupon if valid
    let discount = 0;
    let coupon = null;
    if (couponCode) {
      coupon = await this.validateCoupon(couponCode, startDate, nights);
      if (coupon) {
        if (coupon.type === 'percent') {
          discount = subtotal * (parseFloat(coupon.value) / 100);
        } else {
          discount = parseFloat(coupon.value);
        }
      }
    }

    const total = subtotal + cleaningFee + totalTaxes - discount;

    return {
      nights,
      nightlyRate: nightlyRate.toFixed(2),
      subtotal: subtotal.toFixed(2),
      cleaningFee: cleaningFee.toFixed(2),
      serviceFee: '0.00', // Service fee removed but keeping for backwards compatibility
      taxes: totalTaxes.toFixed(2),
      discount: discount.toFixed(2),
      total: total.toFixed(2),
      coupon,
      breakdown: [
        { label: `$${nightlyRate.toFixed(2)} × ${nights} nights`, amount: subtotal.toFixed(2) },
        { label: 'Cleaning fee', amount: cleaningFee.toFixed(2) },
        { label: 'TAT (Transient Accommodations Tax)', amount: tatTax.toFixed(2) },
        { label: 'GET (General Excise Tax)', amount: getTax.toFixed(2) },
        { label: 'County Tax', amount: countyTax.toFixed(2) },
        ...(discount > 0 ? [{ label: `Coupon (${couponCode})`, amount: `-${discount.toFixed(2)}` }] : []),
      ],
    };
  }


  async getBlackoutDates(): Promise<BlackoutDate[]> {
    const prop = await this.getProperty();
    if (!prop) return [];

    return await db
      .select()
      .from(blackout_dates)
      .where(eq(blackout_dates.property_id, prop.id))
      .orderBy(asc(blackout_dates.start_date));
  }

  async addBlackoutDate(dates: { start_date: string; end_date: string; reason: string }): Promise<BlackoutDate> {
    const prop = await this.getProperty();
    if (!prop) {
      throw new Error("Property not found");
    }

    const [blackout] = await db
      .insert(blackout_dates)
      .values({
        property_id: prop.id,
        ...dates,
      })
      .returning();

    return blackout;
  }

  // Bookings - ATOMIC TRANSACTION-SAFE BOOKING CREATION
  async createBooking(bookingData: InsertBooking): Promise<Booking> {
    // Use database transaction for atomic booking creation
    return await db.transaction(async (tx) => {
      // STEP 1: Lock and check availability atomically
      const conflictingBookings = await tx
        .select({ id: bookings.id })
        .from(bookings)
        .where(and(
          eq(bookings.property_id, bookingData.property_id),
          eq(bookings.status, 'confirmed'),
          or(
            and(lte(bookings.start_date, bookingData.start_date), gte(bookings.end_date, bookingData.start_date)),
            and(lte(bookings.start_date, bookingData.end_date), gte(bookings.end_date, bookingData.end_date)),
            and(gte(bookings.start_date, bookingData.start_date), lte(bookings.end_date, bookingData.end_date))
          )
        ))
        .for('update'); // SELECT FOR UPDATE to prevent race conditions
      
      if (conflictingBookings.length > 0) {
        throw new Error("Date range is no longer available - another booking exists");
      }

      // STEP 2: Check external reservations that might block this booking
      const conflictingExternal = await tx
        .select({ id: external_reservations.id })
        .from(external_reservations)
        .innerJoin(external_calendars, eq(external_reservations.calendar_id, external_calendars.id))
        .where(and(
          eq(external_calendars.property_id, bookingData.property_id),
          eq(external_reservations.is_blocking, true),
          or(
            eq(external_reservations.status, 'reserved'),
            eq(external_reservations.status, 'blocked')
          ),
          or(
            and(lte(external_reservations.start_date, bookingData.start_date), gte(external_reservations.end_date, bookingData.start_date)),
            and(lte(external_reservations.start_date, bookingData.end_date), gte(external_reservations.end_date, bookingData.end_date)),
            and(gte(external_reservations.start_date, bookingData.start_date), lte(external_reservations.end_date, bookingData.end_date))
          )
        ))
        .for('update'); // SELECT FOR UPDATE to prevent race conditions

      if (conflictingExternal.length > 0) {
        throw new Error("Date range is blocked by external calendar reservation");
      }

      // STEP 3: Check for active holds (unless this booking is releasing a hold)
      const activeHolds = await tx
        .select({ id: holds.id, reference_id: holds.reference_id })
        .from(holds)
        .where(and(
          eq(holds.property_id, bookingData.property_id),
          gte(holds.expires_at, sql`now()`),
          or(
            and(lte(holds.start_date, bookingData.start_date), gte(holds.end_date, bookingData.start_date)),
            and(lte(holds.start_date, bookingData.end_date), gte(holds.end_date, bookingData.end_date)),
            and(gte(holds.start_date, bookingData.start_date), lte(holds.end_date, bookingData.end_date))
          )
        ))
        .for('update'); // SELECT FOR UPDATE to prevent race conditions

      // Check if any hold exists that doesn't match this booking's idempotency key
      const blockingHolds = activeHolds.filter(hold => 
        hold.reference_id !== bookingData.idempotency_key
      );

      if (blockingHolds.length > 0) {
        throw new Error("Date range is temporarily held for another checkout session");
      }

      // STEP 4: Check blackout dates
      const blackouts = await tx
        .select({ id: blackout_dates.id })
        .from(blackout_dates)
        .where(and(
          eq(blackout_dates.property_id, bookingData.property_id),
          or(
            and(lte(blackout_dates.start_date, bookingData.start_date), gte(blackout_dates.end_date, bookingData.start_date)),
            and(lte(blackout_dates.start_date, bookingData.end_date), gte(blackout_dates.end_date, bookingData.end_date)),
            and(gte(blackout_dates.start_date, bookingData.start_date), lte(blackout_dates.end_date, bookingData.end_date))
          )
        ))
        .for('update'); // SELECT FOR UPDATE to prevent race conditions

      if (blackouts.length > 0) {
        throw new Error("Date range is blocked by property blackout dates");
      }

      // STEP 5: Create the booking atomically
      const [booking] = await tx.insert(bookings).values(bookingData).returning();

      // STEP 6: Release any holds associated with this booking
      if (bookingData.idempotency_key) {
        await tx
          .delete(holds)
          .where(eq(holds.reference_id, bookingData.idempotency_key));
      }

      return booking;
    });
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking || undefined;
  }

  async getBookings(filters?: { status?: string; limit?: number }): Promise<Booking[]> {
    let query = db.select().from(bookings).orderBy(desc(bookings.created_at));

    if (filters?.status) {
      query = query.where(eq(bookings.status, filters.status));
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    return await query;
  }

  async updateBookingStatus(id: string, status: string, paymentIntentId?: string): Promise<Booking> {
    const updates: any = { status };
    if (paymentIntentId) {
      updates.payment_intent_id = paymentIntentId;
    }

    const [booking] = await db
      .update(bookings)
      .set(updates)
      .where(eq(bookings.id, id))
      .returning();

    return booking;
  }

  // Guests
  async addGuest(guestData: InsertGuest): Promise<Guest> {
    const [guest] = await db.insert(guests).values(guestData).returning();
    return guest;
  }

  async getBookingGuests(bookingId: string): Promise<Guest[]> {
    return await db.select().from(guests).where(eq(guests.booking_id, bookingId));
  }

  // Messages
  async createMessage(messageData: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(messageData).returning();
    return message;
  }

  async getMessages(): Promise<Message[]> {
    return await db.select().from(messages).orderBy(desc(messages.created_at));
  }

  async markMessageReplied(id: string): Promise<void> {
    await db.update(messages).set({ replied: true }).where(eq(messages.id, id));
  }

  // Chat Messages
  async createChatMessage(messageData: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db.insert(chat_messages).values(messageData).returning();
    return message;
  }

  async getChatMessagesBySession(sessionId: string): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chat_messages)
      .where(eq(chat_messages.session_id, sessionId))
      .orderBy(asc(chat_messages.created_at));
  }

  async getChatSessions(): Promise<Array<{ sessionId: string; name: string; email: string; lastMessage: string; lastMessageAt: Date }>> {
    const sessions = await db
      .select()
      .from(chat_messages)
      .orderBy(desc(chat_messages.created_at));

    // Group by session_id and get the latest message for each session
    const sessionMap = new Map();
    
    sessions.forEach(message => {
      if (!sessionMap.has(message.session_id) || 
          new Date(message.created_at) > new Date(sessionMap.get(message.session_id).lastMessageAt)) {
        sessionMap.set(message.session_id, {
          sessionId: message.session_id,
          name: message.name,
          email: message.email,
          lastMessage: message.message,
          lastMessageAt: message.created_at,
        });
      }
    });

    return Array.from(sessionMap.values()).sort((a, b) => 
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
  }

  // Coupons
  async getCoupon(code: string): Promise<Coupon | undefined> {
    const [coupon] = await db.select().from(coupons).where(eq(coupons.code, code));
    return coupon || undefined;
  }

  async validateCoupon(code: string, startDate: string, nights: number): Promise<Coupon | null> {
    const coupon = await this.getCoupon(code);
    if (!coupon || !coupon.active) return null;

    const now = new Date();
    const checkInDate = new Date(startDate);

    if (coupon.start_date && new Date(coupon.start_date) > now) return null;
    if (coupon.end_date && new Date(coupon.end_date) < now) return null;
    if (coupon.min_nights && nights < coupon.min_nights) return null;
    if (coupon.usage_limit && (coupon.used_count || 0) >= coupon.usage_limit) return null;

    return coupon;
  }

  // Pricing Rules CRUD
  async createPricingRule(ruleData: any): Promise<PricingRule> {
    const prop = await this.getProperty();
    if (!prop) throw new Error("Property not found");
    
    const [rule] = await db.insert(pricing_rules).values({
      property_id: prop.id,
      ...ruleData,
    }).returning();
    return rule;
  }

  async updatePricingRule(id: string, ruleData: any): Promise<PricingRule> {
    const [rule] = await db
      .update(pricing_rules)
      .set(ruleData)
      .where(eq(pricing_rules.id, id))
      .returning();
    return rule;
  }

  async deletePricingRule(id: string): Promise<void> {
    await db.delete(pricing_rules).where(eq(pricing_rules.id, id));
  }

  // Coupons CRUD
  async getCoupons(): Promise<Coupon[]> {
    return await db.select().from(coupons).orderBy(desc(coupons.created_at));
  }

  async createCoupon(couponData: any): Promise<Coupon> {
    const [coupon] = await db.insert(coupons).values({
      ...couponData,
      used_count: 0,
    }).returning();
    return coupon;
  }

  async updateCoupon(id: string, couponData: any): Promise<Coupon> {
    const [coupon] = await db
      .update(coupons)
      .set(couponData)
      .where(eq(coupons.id, id))
      .returning();
    return coupon;
  }

  async deleteCoupon(id: string): Promise<void> {
    await db.delete(coupons).where(eq(coupons.id, id));
  }

  // Settings
  async getSetting(key: string): Promise<any> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting?.value || null;
  }

  async updateSetting(key: string, value: any): Promise<Setting> {
    const existing = await db.select().from(settings).where(eq(settings.key, key));
    
    if (existing.length > 0) {
      const [updated] = await db
        .update(settings)
        .set({ value, updated_at: new Date() })
        .where(eq(settings.key, key))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(settings)
        .values({ key, value })
        .returning();
      return created;
    }
  }

  // SEO Settings Implementation
  async getSEOSettings(): Promise<{
    site_title: string;
    site_description: string;
    og_image_url: string;
    twitter_handle: string;
    page_titles: { [key: string]: string };
    meta_descriptions: { [key: string]: string };
  }> {
    const seoKeys = [
      'seo_site_title',
      'seo_site_description',
      'seo_og_image_url',
      'seo_twitter_handle',
      'seo_page_titles',
      'seo_meta_descriptions'
    ];

    const seoSettings = await db
      .select()
      .from(settings)
      .where(inArray(settings.key, seoKeys));

    // Default values if settings don't exist
    const defaults = {
      site_title: 'VacationRentalOahu.co',
      site_description: 'Beach House vacation rental in Oahu, Hawaii offering oceanfront beach house with beach access and premium amenities.',
      og_image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=630',
      twitter_handle: '@vacationrentaloahu',
      page_titles: {
        home: 'Beach House Ocean View Vacation Rental - VacationRentalOahu.co',
        booking: 'Book Your Stay',
        stay: 'Ocean View Beach House Details',
        contact: 'Contact Us',
        policies: 'Policies & Information',
        checkout: 'Complete Your Reservation'
      },
      meta_descriptions: {
        home: 'Experience Beach House Oahu in our stunning oceanfront beach house in Hawaii. Beach access, outdoor living spaces, and breathtaking views for an unforgettable Hawaiian getaway.',
        booking: 'Complete your reservation for our Beach House Oahu oceanfront property. Check availability, view amenities, and secure your Hawaiian vacation rental.',
        stay: 'Discover our Beach House Oahu oceanfront property with beach access, luxury amenities, and premium outdoor spaces. Perfect for families and groups in beautiful Oahu, Hawaii.',
        contact: 'Get in touch with VacationRentalOahu.co for questions about your stay, booking inquiries, or assistance with your Hawaiian vacation rental.',
        policies: 'Review our vacation rental policies including check-in procedures, house rules, and cancellation terms for your stay in Oahu, Hawaii.',
        checkout: 'Complete your booking for our Beach House Oahu Hawaiian property. Secure payment processing and instant confirmation for your vacation rental.'
      }
    };

    // Build result object with fetched values or defaults
    const result = { ...defaults };
    
    seoSettings.forEach(setting => {
      switch (setting.key) {
        case 'seo_site_title':
          result.site_title = setting.value;
          break;
        case 'seo_site_description':
          result.site_description = setting.value;
          break;
        case 'seo_og_image_url':
          result.og_image_url = setting.value;
          break;
        case 'seo_twitter_handle':
          result.twitter_handle = setting.value;
          break;
        case 'seo_page_titles':
          result.page_titles = { ...defaults.page_titles, ...setting.value };
          break;
        case 'seo_meta_descriptions':
          result.meta_descriptions = { ...defaults.meta_descriptions, ...setting.value };
          break;
      }
    });

    return result;
  }

  async updateSEOSettings(settings: { [key: string]: any }): Promise<void> {
    // Map of frontend keys to database keys
    const keyMapping: { [key: string]: string } = {
      site_title: 'seo_site_title',
      site_description: 'seo_site_description',
      og_image_url: 'seo_og_image_url',
      twitter_handle: 'seo_twitter_handle',
      page_titles: 'seo_page_titles',
      meta_descriptions: 'seo_meta_descriptions'
    };

    const promises = Object.entries(settings).map(([key, value]) => {
      const dbKey = keyMapping[key] || key;
      return this.updateSetting(dbKey, value);
    });

    await Promise.all(promises);
  }

  // Site Info Settings Implementation
  async getSiteInfoSettings(): Promise<{
    site_name: string;
    site_description: string;
    contact_email: string;
    contact_phone: string;
    address: string;
    social_links: { [key: string]: string };
    license_number?: string;
  }> {
    const siteInfoKeys = [
      'site_name',
      'site_description', 
      'contact_email',
      'contact_phone',
      'address',
      'social_links',
      'license_number'
    ];

    const siteInfoSettings = await db
      .select()
      .from(settings)
      .where(inArray(settings.key, siteInfoKeys));

    // Default values if settings don't exist
    const defaults = {
      site_name: 'VacationRentalOahu.co',
      site_description: 'Beach House vacation rental in Oahu, Hawaii offering oceanfront beach house with beach access and premium amenities.',
      contact_email: 'hello@vacationrentaloahu.co',
      contact_phone: '(208) 995-9516',
      address: 'Honolulu, HI 96815, United States',
      social_links: {
        instagram: 'https://www.instagram.com/vacationrentaloahu',
        facebook: 'https://www.facebook.com/vacationrentaloahu',
        twitter: 'https://www.twitter.com/vacationrentaloahu'
      },
      license_number: 'VR2024-001'
    };

    // Build result object with fetched values or defaults
    const result = { ...defaults };
    
    siteInfoSettings.forEach(setting => {
      if (setting.key === 'social_links') {
        result.social_links = { ...defaults.social_links, ...setting.value };
      } else {
        (result as any)[setting.key] = setting.value;
      }
    });

    return result;
  }

  async updateSiteInfoSettings(settings: { [key: string]: any }): Promise<void> {
    const promises = Object.entries(settings).map(([key, value]) => {
      return this.updateSetting(key, value);
    });

    await Promise.all(promises);
  }

  // Guest Reviews
  async getGuestReviews(): Promise<GuestReview[]> {
    const prop = await this.getProperty();
    if (!prop) return [];

    return await db
      .select()
      .from(guest_reviews)
      .where(and(
        eq(guest_reviews.property_id, prop.id),
        eq(guest_reviews.approval_status, "approved")
      ))
      .orderBy(desc(guest_reviews.review_date));
  }

  async getApprovedReviews(): Promise<GuestReview[]> {
    return this.getGuestReviews();
  }

  async getFeaturedReviews(): Promise<GuestReview[]> {
    const prop = await this.getProperty();
    if (!prop) return [];

    return await db
      .select()
      .from(guest_reviews)
      .where(and(
        eq(guest_reviews.property_id, prop.id),
        eq(guest_reviews.is_featured, true),
        eq(guest_reviews.approval_status, "approved")
      ))
      .orderBy(desc(guest_reviews.review_date));
  }

  async getReviewsSummary(): Promise<{ averageRating: number; totalReviews: number; reviewCounts: { 1: number; 2: number; 3: number; 4: number; 5: number } }> {
    const reviews = await this.getGuestReviews();
    
    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        reviewCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = Number((totalRating / reviews.length).toFixed(2));

    const reviewCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      reviewCounts[review.rating as keyof typeof reviewCounts]++;
    });

    return {
      averageRating,
      totalReviews: reviews.length,
      reviewCounts
    };
  }

  // Review Submission & Verification
  async submitGuestReview(review: InsertGuestReview & { ip_address?: string }): Promise<GuestReview> {
    const prop = await this.getProperty();
    if (!prop) throw new Error("Property not found");

    // Verify guest eligibility
    const eligibility = await this.verifyGuestEligibility(
      review.guest_email, 
      review.stay_start_date, 
      review.stay_end_date
    );

    const [insertedReview] = await db.insert(guest_reviews).values({
      ...review,
      property_id: prop.id,
      booking_id: eligibility.bookingId,
      verified_guest: eligibility.verified,
      approval_status: "pending",
      review_date: new Date().toISOString().split('T')[0],
    }).returning();

    return insertedReview;
  }

  async verifyGuestEligibility(email: string, stayStartDate: string, stayEndDate: string): Promise<{ eligible: boolean; bookingId?: string; verified: boolean }> {
    // Check if there's a confirmed booking for this email and date range
    const booking = await db
      .select()
      .from(bookings)
      .leftJoin(guests, eq(guests.booking_id, bookings.id))
      .where(and(
        eq(guests.email, email),
        eq(bookings.status, "confirmed"),
        eq(bookings.start_date, stayStartDate),
        eq(bookings.end_date, stayEndDate)
      ))
      .limit(1);

    if (booking.length > 0) {
      return {
        eligible: true,
        bookingId: booking[0].bookings.id,
        verified: true
      };
    }

    // Check for any booking with this email (less strict verification)
    const anyBooking = await db
      .select()
      .from(bookings)
      .leftJoin(guests, eq(guests.booking_id, bookings.id))
      .where(and(
        eq(guests.email, email),
        eq(bookings.status, "confirmed")
      ))
      .limit(1);

    return {
      eligible: anyBooking.length > 0,
      bookingId: anyBooking.length > 0 ? anyBooking[0].bookings.id : undefined,
      verified: false
    };
  }

  // Admin Review Management
  async getPendingReviews(): Promise<GuestReview[]> {
    const prop = await this.getProperty();
    if (!prop) return [];

    return await db
      .select()
      .from(guest_reviews)
      .where(and(
        eq(guest_reviews.property_id, prop.id),
        eq(guest_reviews.approval_status, "pending")
      ))
      .orderBy(desc(guest_reviews.submitted_at));
  }

  async getReviewById(id: string): Promise<GuestReview | undefined> {
    const [review] = await db
      .select()
      .from(guest_reviews)
      .where(eq(guest_reviews.id, id));
    
    return review || undefined;
  }

  async approveReview(id: string, adminId: string, adminNotes?: string): Promise<GuestReview> {
    const [updatedReview] = await db
      .update(guest_reviews)
      .set({
        approval_status: "approved",
        approved_at: new Date(),
        approved_by: adminId,
        admin_notes: adminNotes,
      })
      .where(eq(guest_reviews.id, id))
      .returning();

    return updatedReview;
  }

  async rejectReview(id: string, adminId: string, reason: string): Promise<GuestReview> {
    const [updatedReview] = await db
      .update(guest_reviews)
      .set({
        approval_status: "rejected",
        approved_at: new Date(),
        approved_by: adminId,
        admin_notes: reason,
      })
      .where(eq(guest_reviews.id, id))
      .returning();

    return updatedReview;
  }

  async updateReview(id: string, updates: Partial<GuestReview>, adminId: string): Promise<GuestReview> {
    const [updatedReview] = await db
      .update(guest_reviews)
      .set({
        ...updates,
        approved_by: adminId,
        approved_at: new Date(),
      })
      .where(eq(guest_reviews.id, id))
      .returning();

    return updatedReview;
  }

  async deleteReview(id: string, adminId: string, reason: string): Promise<void> {
    // Log the deletion before actually deleting
    await db.insert(audit_logs).values({
      user_id: adminId,
      action: "delete_review",
      entity_type: "guest_review",
      entity_id: id,
      new_values: { reason },
    });

    await db.delete(guest_reviews).where(eq(guest_reviews.id, id));
  }

  async toggleReviewFeatured(id: string, featured: boolean): Promise<GuestReview> {
    const [updatedReview] = await db
      .update(guest_reviews)
      .set({
        is_featured: featured,
      })
      .where(eq(guest_reviews.id, id))
      .returning();

    return updatedReview;
  }

  // Admin Stats
  async getBookingStats(days: number): Promise<any> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const bookingsList = await db
      .select()
      .from(bookings)
      .where(and(
        gte(bookings.created_at, cutoffDate.toISOString()),
        eq(bookings.status, 'confirmed')
      ))
      .orderBy(desc(bookings.created_at));

    const totalBookings = bookingsList.length;
    const totalRevenue = bookingsList.reduce((sum: number, booking: any) => sum + parseFloat(booking.total), 0);
    const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    // Calculate occupancy rate (simplified)
    const occupancyRate = Math.min(totalBookings / (days / 3), 1); // Assuming 3 day average stay

    const recentBookings = await db
      .select({
        id: bookings.id,
        guest_name: guests.first_name,
        check_in: bookings.start_date,
        check_out: bookings.end_date,
        total: bookings.total,
        status: bookings.status,
      })
      .from(bookings)
      .leftJoin(guests, and(
        eq(guests.booking_id, bookings.id),
        eq(guests.is_primary, true)
      ))
      .orderBy(desc(bookings.created_at))
      .limit(5);

    return {
      totalBookings,
      totalRevenue,
      averageBookingValue,
      occupancyRate,
      recentBookings: recentBookings.map((booking: any) => ({
        ...booking,
        guest_name: booking.guest_name || "Unknown",
      })),
    };
  }

  async getMessageStats(): Promise<any> {
    const messagesList = await db.select().from(messages).orderBy(desc(messages.created_at));
    const totalMessages = messagesList.length;
    const unreadMessages = messagesList.filter((m: any) => !m.replied).length;
    const responseTime = 2; // Mock average response time in hours

    const recentMessages = messagesList.slice(0, 5).map((msg: any) => ({
      id: msg.id,
      guest_name: msg.name,
      email: msg.email,
      subject: msg.subject,
      created_at: msg.created_at,
      replied: msg.replied,
    }));

    return {
      totalMessages,
      unreadMessages,
      responseTime,
      recentMessages,
    };
  }

  // Advanced Reporting Implementation
  async getRevenueAnalytics(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const bookingsData = await db
      .select()
      .from(bookings)
      .where(and(
        gte(bookings.created_at, sql`${start.toISOString()}::timestamp`),
        lte(bookings.created_at, sql`${end.toISOString()}::timestamp`),
        eq(bookings.status, 'confirmed')
      ))
      .orderBy(asc(bookings.created_at));

    const totalRevenue = bookingsData.reduce((sum, booking) => sum + parseFloat(booking.total), 0);
    const grossRevenue = bookingsData.reduce((sum, booking) => sum + parseFloat(booking.subtotal), 0);
    const netRevenue = totalRevenue - bookingsData.reduce((sum, booking) => sum + parseFloat(booking.taxes) + parseFloat(booking.fees), 0);
    const averageBookingValue = bookingsData.length > 0 ? totalRevenue / bookingsData.length : 0;
    
    // Calculate occupancy rate
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
    const bookedNights = bookingsData.reduce((sum, booking) => sum + booking.nights, 0);
    const occupancyRate = totalDays > 0 ? Math.min(bookedNights / totalDays, 1) : 0;
    
    const averageDailyRate = bookedNights > 0 ? grossRevenue / bookedNights : 0;

    // Monthly breakdown
    const monthlyMap = new Map<string, { revenue: number; bookings: number }>();
    bookingsData.forEach(booking => {
      const month = new Date(booking.created_at).toISOString().substring(0, 7);
      const current = monthlyMap.get(month) || { revenue: 0, bookings: 0 };
      current.revenue += parseFloat(booking.total);
      current.bookings += 1;
      monthlyMap.set(month, current);
    });

    const monthlyBreakdown = Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      bookings: data.bookings
    }));

    return {
      totalRevenue,
      grossRevenue,
      netRevenue,
      monthlyBreakdown,
      averageBookingValue,
      occupancyRate,
      averageDailyRate
    };
  }

  async getTaxAnalytics(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const bookingsData = await db
      .select()
      .from(bookings)
      .where(and(
        gte(bookings.created_at, sql`${start.toISOString()}::timestamp`),
        lte(bookings.created_at, sql`${end.toISOString()}::timestamp`),
        eq(bookings.status, 'confirmed')
      ));

    // Get tax rates from pricing rules
    const taxRates = await db
      .select()
      .from(pricing_rules)
      .where(and(
        or(
          eq(pricing_rules.rule_type, 'tat_rate'),
          eq(pricing_rules.rule_type, 'get_rate'),
          eq(pricing_rules.rule_type, 'county_tax_rate')
        ),
        eq(pricing_rules.active, true)
      ));

    const tatRate = taxRates.find(r => r.rule_type === 'tat_rate')?.value || '0.1075';
    const getRate = taxRates.find(r => r.rule_type === 'get_rate')?.value || '0.04';
    const countyRate = taxRates.find(r => r.rule_type === 'county_tax_rate')?.value || '0.0975';

    let tatTaxes = 0, getTaxes = 0, countyTaxes = 0;

    // Calculate taxes based on rates and subtotal
    bookingsData.forEach(booking => {
      const subtotal = parseFloat(booking.subtotal);
      tatTaxes += subtotal * parseFloat(tatRate as string);
      getTaxes += subtotal * parseFloat(getRate as string);
      countyTaxes += subtotal * parseFloat(countyRate as string);
    });

    const totalTaxes = tatTaxes + getTaxes + countyTaxes;

    // Monthly tax breakdown
    const monthlyTaxMap = new Map<string, { tat: number; get: number; county: number }>();
    bookingsData.forEach(booking => {
      const month = new Date(booking.created_at).toISOString().substring(0, 7);
      const subtotal = parseFloat(booking.subtotal);
      const current = monthlyTaxMap.get(month) || { tat: 0, get: 0, county: 0 };
      current.tat += subtotal * parseFloat(tatRate as string);
      current.get += subtotal * parseFloat(getRate as string);
      current.county += subtotal * parseFloat(countyRate as string);
      monthlyTaxMap.set(month, current);
    });

    const taxBreakdown = Array.from(monthlyTaxMap.entries()).map(([month, taxes]) => ({
      month,
      ...taxes
    }));

    return {
      totalTaxes,
      tatTaxes,
      getTaxes,
      countyTaxes,
      taxBreakdown
    };
  }

  async getBookingAnalytics(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const bookingsData = await db
      .select()
      .from(bookings)
      .where(and(
        gte(bookings.created_at, sql`${start.toISOString()}::timestamp`),
        lte(bookings.created_at, sql`${end.toISOString()}::timestamp`)
      ));

    const totalBookings = bookingsData.length;
    const confirmedBookings = bookingsData.filter(b => b.status === 'confirmed').length;
    const canceledBookings = bookingsData.filter(b => b.status === 'canceled').length;
    
    const confirmedData = bookingsData.filter(b => b.status === 'confirmed');
    const averageStayLength = confirmedData.length > 0 
      ? confirmedData.reduce((sum, b) => sum + b.nights, 0) / confirmedData.length 
      : 0;
    const averageGroupSize = confirmedData.length > 0
      ? confirmedData.reduce((sum, b) => sum + b.guests, 0) / confirmedData.length
      : 0;

    // Calculate occupancy
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
    const bookedNights = confirmedData.reduce((sum, booking) => sum + booking.nights, 0);
    const occupancyRate = totalDays > 0 ? Math.min(bookedNights / totalDays, 1) : 0;

    // Seasonal trends by month
    const monthlyMap = new Map<string, { bookings: number; nights: number }>();
    confirmedData.forEach(booking => {
      const month = new Date(booking.created_at).toISOString().substring(0, 7);
      const current = monthlyMap.get(month) || { bookings: 0, nights: 0 };
      current.bookings += 1;
      current.nights += booking.nights;
      monthlyMap.set(month, current);
    });

    const seasonalTrends = Array.from(monthlyMap.entries()).map(([month, data]) => {
      const monthDays = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0).getDate();
      return {
        month,
        bookings: data.bookings,
        occupancy: data.nights / monthDays
      };
    });

    // Guest demographics (simplified)
    const guestEmails = await db
      .select({ email: guests.email })
      .from(guests)
      .innerJoin(bookings, eq(guests.booking_id, bookings.id))
      .where(and(
        gte(bookings.created_at, sql`${start.toISOString()}::timestamp`),
        lte(bookings.created_at, sql`${end.toISOString()}::timestamp`),
        eq(bookings.status, 'confirmed')
      ));

    const uniqueEmails = new Set(guestEmails.map(g => g.email));
    const totalGuests = guestEmails.length;
    const uniqueGuests = uniqueEmails.size;
    const repeatCustomers = totalGuests - uniqueGuests;

    return {
      totalBookings,
      confirmedBookings,
      canceledBookings,
      averageStayLength,
      averageGroupSize,
      occupancyRate,
      seasonalTrends,
      guestDemographics: {
        repeatCustomers,
        newGuests: uniqueGuests,
        averageGuestsPerBooking: averageGroupSize
      }
    };
  }

  async getFinancialBreakdown(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const bookingsData = await db
      .select()
      .from(bookings)
      .where(and(
        gte(bookings.created_at, sql`${start.toISOString()}::timestamp`),
        lte(bookings.created_at, sql`${end.toISOString()}::timestamp`),
        eq(bookings.status, 'confirmed')
      ));

    const grossRevenue = bookingsData.reduce((sum, b) => sum + parseFloat(b.subtotal), 0);
    const cleaningFees = bookingsData.reduce((sum, b) => sum + parseFloat(b.fees), 0);
    const taxes = bookingsData.reduce((sum, b) => sum + parseFloat(b.taxes), 0);
    const serviceFees = 0; // Add service fees logic if needed
    const netRevenue = grossRevenue - taxes - serviceFees;

    // Monthly breakdown
    const monthlyMap = new Map<string, { gross: number; taxes: number; fees: number }>();
    bookingsData.forEach(booking => {
      const month = new Date(booking.created_at).toISOString().substring(0, 7);
      const current = monthlyMap.get(month) || { gross: 0, taxes: 0, fees: 0 };
      current.gross += parseFloat(booking.subtotal);
      current.taxes += parseFloat(booking.taxes);
      current.fees += parseFloat(booking.fees);
      monthlyMap.set(month, current);
    });

    const revenueByMonth = Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month,
      gross: data.gross,
      net: data.gross - data.taxes - data.fees,
      taxes: data.taxes,
      fees: data.fees
    }));

    return {
      grossRevenue,
      cleaningFees,
      serviceFees,
      taxes,
      netRevenue,
      revenueByMonth
    };
  }

  async getGuestAnalytics(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const guestData = await db
      .select({
        email: guests.email,
        firstName: guests.first_name,
        lastName: guests.last_name,
        bookingId: guests.booking_id,
        guests: bookings.guests,
        nights: bookings.nights,
        created_at: bookings.created_at
      })
      .from(guests)
      .innerJoin(bookings, eq(guests.booking_id, bookings.id))
      .where(and(
        gte(bookings.created_at, sql`${start.toISOString()}::timestamp`),
        lte(bookings.created_at, sql`${end.toISOString()}::timestamp`),
        eq(bookings.status, 'confirmed'),
        eq(guests.is_primary, true)
      ));

    const totalGuests = guestData.reduce((sum, g) => sum + g.guests, 0);
    const uniqueEmails = new Set(guestData.map(g => g.email));
    const uniqueGuests = uniqueEmails.size;
    const repeatGuests = guestData.length - uniqueGuests;
    
    const averageStayLength = guestData.length > 0 
      ? guestData.reduce((sum, g) => sum + g.nights, 0) / guestData.length 
      : 0;
    const averageGroupSize = guestData.length > 0 
      ? guestData.reduce((sum, g) => sum + g.guests, 0) / guestData.length 
      : 0;

    // Guest sources (simplified - could be enhanced with UTM tracking)
    const guestSources = [
      { source: 'Direct Booking', count: Math.floor(uniqueGuests * 0.6), revenue: 0 },
      { source: 'Referral', count: Math.floor(uniqueGuests * 0.3), revenue: 0 },
      { source: 'Social Media', count: Math.floor(uniqueGuests * 0.1), revenue: 0 }
    ];

    return {
      totalGuests,
      uniqueGuests,
      repeatGuests,
      averageStayLength,
      averageGroupSize,
      guestSources
    };
  }

  // Email Management Implementation
  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    const [created] = await db.insert(email_templates).values(template).returning();
    return created;
  }

  async getEmailTemplates(): Promise<EmailTemplate[]> {
    return await db.select().from(email_templates).orderBy(asc(email_templates.name));
  }

  async getEmailTemplate(name: string): Promise<EmailTemplate | undefined> {
    const [template] = await db.select().from(email_templates).where(eq(email_templates.name, name));
    return template || undefined;
  }

  async updateEmailTemplate(name: string, updates: Partial<EmailTemplate>): Promise<EmailTemplate> {
    const [updated] = await db
      .update(email_templates)
      .set({ ...updates, updated_at: new Date().toISOString() })
      .where(eq(email_templates.name, name))
      .returning();
    return updated;
  }

  async logEmailEvent(event: Omit<EmailEvent, 'id'>): Promise<EmailEvent> {
    const [logged] = await db.insert(email_events).values(event as any).returning();
    return logged;
  }

  async getEmailAnalytics(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const emailEvents = await db
      .select()
      .from(email_events)
      .where(and(
        gte(email_events.sent_at, sql`${start.toISOString()}::timestamp`),
        lte(email_events.sent_at, sql`${end.toISOString()}::timestamp`)
      ));

    const totalSent = emailEvents.length;
    const delivered = emailEvents.filter(e => e.status === 'delivered').length;
    const failed = emailEvents.filter(e => e.status === 'failed').length;
    const opened = emailEvents.filter(e => e.opened_at !== null).length;
    const clicked = emailEvents.filter(e => e.clicked_at !== null).length;

    // Template breakdown
    const templateMap = new Map<string, { sent: number; delivered: number; opened: number }>();
    emailEvents.forEach(event => {
      const current = templateMap.get(event.template) || { sent: 0, delivered: 0, opened: 0 };
      current.sent += 1;
      if (event.status === 'delivered') current.delivered += 1;
      if (event.opened_at) current.opened += 1;
      templateMap.set(event.template, current);
    });

    const templateBreakdown = Array.from(templateMap.entries()).map(([template, stats]) => ({
      template,
      sent: stats.sent,
      delivered: stats.delivered,
      openRate: stats.sent > 0 ? stats.opened / stats.sent : 0
    }));

    return {
      totalSent,
      delivered,
      opened,
      clicked,
      failed,
      templateBreakdown
    };
  }

  // Export Methods Implementation
  async getExportData(type: 'revenue' | 'bookings' | 'taxes' | 'guests', startDate: string, endDate: string): Promise<any[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);

    switch (type) {
      case 'revenue':
        const revenueData = await db
          .select({
            booking_id: bookings.id,
            guest_name: sql`${guests.first_name} || ' ' || ${guests.last_name}`,
            check_in: bookings.start_date,
            check_out: bookings.end_date,
            nights: bookings.nights,
            guests: bookings.guests,
            subtotal: bookings.subtotal,
            taxes: bookings.taxes,
            fees: bookings.fees,
            total: bookings.total,
            status: bookings.status,
            booking_date: bookings.created_at
          })
          .from(bookings)
          .leftJoin(guests, and(eq(guests.booking_id, bookings.id), eq(guests.is_primary, true)))
          .where(and(
            gte(bookings.created_at, sql`${start.toISOString()}::timestamp`),
            lte(bookings.created_at, sql`${end.toISOString()}::timestamp`)
          ))
          .orderBy(desc(bookings.created_at));
        return revenueData;

      case 'bookings':
        const bookingData = await this.getExportData('revenue', startDate, endDate);
        return bookingData.filter((b: any) => b.status === 'confirmed');

      case 'taxes':
        const taxData = await this.getExportData('revenue', startDate, endDate);
        return taxData.map((booking: any) => ({
          booking_id: booking.booking_id,
          guest_name: booking.guest_name,
          check_in: booking.check_in,
          subtotal: booking.subtotal,
          tat_tax: parseFloat(booking.subtotal) * 0.1075, // Hawaii TAT
          get_tax: parseFloat(booking.subtotal) * 0.04,   // Hawaii GET
          county_tax: parseFloat(booking.subtotal) * 0.0975, // County tax
          total_taxes: booking.taxes,
          booking_date: booking.booking_date
        }));

      case 'guests':
        const guestData = await db
          .select({
            guest_name: sql`${guests.first_name} || ' ' || ${guests.last_name}`,
            email: guests.email,
            phone: guests.phone,
            booking_id: bookings.id,
            check_in: bookings.start_date,
            check_out: bookings.end_date,
            guests: bookings.guests,
            total_paid: bookings.total,
            booking_date: bookings.created_at
          })
          .from(guests)
          .innerJoin(bookings, eq(guests.booking_id, bookings.id))
          .where(and(
            gte(bookings.created_at, sql`${start.toISOString()}::timestamp`),
            lte(bookings.created_at, sql`${end.toISOString()}::timestamp`),
            eq(bookings.status, 'confirmed'),
            eq(guests.is_primary, true)
          ))
          .orderBy(desc(bookings.created_at));
        return guestData;

      default:
        return [];
    }
  }

  // External Calendar Integration Methods
  async getExternalCalendars(): Promise<ExternalCalendar[]> {
    const prop = await this.getProperty();
    if (!prop) return [];

    return await db
      .select()
      .from(external_calendars)
      .where(eq(external_calendars.property_id, prop.id))
      .orderBy(asc(external_calendars.created_at));
  }

  async getExternalCalendar(id: string): Promise<ExternalCalendar | undefined> {
    const [calendar] = await db
      .select()
      .from(external_calendars)
      .where(eq(external_calendars.id, id));
    return calendar || undefined;
  }

  async createExternalCalendar(calendar: InsertExternalCalendar): Promise<ExternalCalendar> {
    const prop = await this.getProperty();
    if (!prop) {
      throw new Error("Property not found");
    }

    const [created] = await db
      .insert(external_calendars)
      .values({
        ...calendar,
        property_id: prop.id,
      })
      .returning();

    return created;
  }

  async updateExternalCalendar(id: string, updates: Partial<ExternalCalendar>): Promise<ExternalCalendar> {
    const [updated] = await db
      .update(external_calendars)
      .set({ ...updates, updated_at: sql`now()` })
      .where(eq(external_calendars.id, id))
      .returning();

    if (!updated) {
      throw new Error("External calendar not found");
    }

    return updated;
  }

  async deleteExternalCalendar(id: string): Promise<void> {
    // Delete associated reservations first
    await db.delete(external_reservations).where(eq(external_reservations.calendar_id, id));
    // Delete sync runs
    await db.delete(sync_runs).where(eq(sync_runs.calendar_id, id));
    // Delete the calendar
    await db.delete(external_calendars).where(eq(external_calendars.id, id));
  }

  // External Reservations Management
  async upsertExternalReservations(calendarId: string, reservations: InsertExternalReservation[]): Promise<{ imported: number; updated: number; deleted: number }> {
    let imported = 0;
    let updated = 0;

    // Get existing reservations for this calendar
    const existing = await db
      .select()
      .from(external_reservations)
      .where(eq(external_reservations.calendar_id, calendarId));

    const existingByUid = new Map(existing.map(r => [r.external_uid, r]));
    const newUids = new Set(reservations.map(r => r.external_uid));

    // Process each new/updated reservation
    for (const reservation of reservations) {
      const existingReservation = existingByUid.get(reservation.external_uid);

      if (existingReservation) {
        // Update existing if changed
        const hasChanges = 
          existingReservation.start_date !== reservation.start_date ||
          existingReservation.end_date !== reservation.end_date ||
          existingReservation.status !== reservation.status ||
          existingReservation.guest_name !== reservation.guest_name ||
          existingReservation.title !== reservation.title;

        if (hasChanges) {
          await db
            .update(external_reservations)
            .set({ ...reservation, updated_at: sql`now()` })
            .where(eq(external_reservations.id, existingReservation.id));
          updated++;
        }
      } else {
        // Insert new reservation
        await db
          .insert(external_reservations)
          .values({ ...reservation, calendar_id: calendarId });
        imported++;
      }
    }

    // Delete reservations that are no longer in the external calendar
    const toDelete = existing.filter(r => !newUids.has(r.external_uid));
    let deleted = 0;

    if (toDelete.length > 0) {
      await db
        .delete(external_reservations)
        .where(
          and(
            eq(external_reservations.calendar_id, calendarId),
            sql`${external_reservations.external_uid} IN (${sql.join(toDelete.map(r => r.external_uid), sql`, `)})`
          )
        );
      deleted = toDelete.length;
    }

    return { imported, updated, deleted };
  }

  async getExternalReservations(calendarId?: string): Promise<ExternalReservation[]> {
    const query = db.select().from(external_reservations);
    
    if (calendarId) {
      return await query.where(eq(external_reservations.calendar_id, calendarId));
    }
    
    return await query.orderBy(asc(external_reservations.start_date));
  }

  async deleteExternalReservations(calendarId: string, externalUids?: string[]): Promise<number> {
    let whereClause = eq(external_reservations.calendar_id, calendarId);
    
    if (externalUids && externalUids.length > 0) {
      whereClause = and(
        whereClause,
        sql`${external_reservations.external_uid} IN (${sql.join(externalUids, sql`, `)})`
      );
    }

    const result = await db
      .delete(external_reservations)
      .where(whereClause);

    return result.rowCount || 0;
  }

  // Merged Availability with External Sources
  async getMergedAvailability(startDate: string, endDate: string) {
    const prop = await this.getProperty();
    if (!prop) {
      throw new Error("Property not found");
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get all blocking sources
    const [localBookings, externalReservations, blackoutDates, activeHolds] = await Promise.all([
      // Local confirmed bookings
      db.select().from(bookings).where(
        and(
          eq(bookings.property_id, prop.id),
          eq(bookings.status, 'confirmed'),
          or(
            and(gte(bookings.start_date, startDate), lte(bookings.start_date, endDate)),
            and(gte(bookings.end_date, startDate), lte(bookings.end_date, endDate)),
            and(lte(bookings.start_date, startDate), gte(bookings.end_date, endDate))
          )
        )
      ),
      
      // External reservations that are blocking
      db.select().from(external_reservations)
        .innerJoin(external_calendars, eq(external_reservations.calendar_id, external_calendars.id))
        .where(
          and(
            eq(external_calendars.property_id, prop.id),
            eq(external_calendars.active, true),
            eq(external_reservations.is_blocking, true),
            or(
              and(gte(external_reservations.start_date, startDate), lte(external_reservations.start_date, endDate)),
              and(gte(external_reservations.end_date, startDate), lte(external_reservations.end_date, endDate)),
              and(lte(external_reservations.start_date, startDate), gte(external_reservations.end_date, endDate))
            )
          )
        ),

      // Blackout dates
      db.select().from(blackout_dates).where(
        and(
          eq(blackout_dates.property_id, prop.id),
          or(
            and(gte(blackout_dates.start_date, startDate), lte(blackout_dates.start_date, endDate)),
            and(gte(blackout_dates.end_date, startDate), lte(blackout_dates.end_date, endDate)),
            and(lte(blackout_dates.start_date, startDate), gte(blackout_dates.end_date, endDate))
          )
        )
      ),

      // Active holds
      db.select().from(holds).where(
        and(
          eq(holds.property_id, prop.id),
          gte(holds.expires_at, sql`now()`),
          or(
            and(gte(holds.start_date, startDate), lte(holds.start_date, endDate)),
            and(gte(holds.end_date, startDate), lte(holds.end_date, endDate)),
            and(lte(holds.start_date, startDate), gte(holds.end_date, endDate))
          )
        )
      )
    ]);

    // Generate date range
    const dates: string[] = [];
    const current = new Date(start);
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    // Check which dates are blocked
    const blockedDates: Array<{ date: string; reason: string; source: 'booking' | 'external' | 'blackout' | 'hold' }> = [];
    const availableDates: string[] = [];

    dates.forEach(date => {
      let blocked = false;

      // Check local bookings
      for (const booking of localBookings) {
        if (date >= booking.start_date && date < booking.end_date) {
          blockedDates.push({ date, reason: 'Local booking', source: 'booking' });
          blocked = true;
          break;
        }
      }

      if (!blocked) {
        // Check external reservations
        for (const extRes of externalReservations) {
          const reservation = extRes.external_reservations;
          if (date >= reservation.start_date && date < reservation.end_date) {
            blockedDates.push({ 
              date, 
              reason: `${extRes.external_calendars.platform} reservation`, 
              source: 'external' 
            });
            blocked = true;
            break;
          }
        }
      }

      if (!blocked) {
        // Check blackout dates
        for (const blackout of blackoutDates) {
          if (date >= blackout.start_date && date <= blackout.end_date) {
            blockedDates.push({ date, reason: blackout.reason, source: 'blackout' });
            blocked = true;
            break;
          }
        }
      }

      if (!blocked) {
        // Check holds
        for (const hold of activeHolds) {
          if (date >= hold.start_date && date < hold.end_date) {
            blockedDates.push({ date, reason: `${hold.reason} hold`, source: 'hold' });
            blocked = true;
            break;
          }
        }
      }

      if (!blocked) {
        availableDates.push(date);
      }
    });

    return {
      local_bookings: localBookings,
      external_reservations: externalReservations.map(er => er.external_reservations),
      blackout_dates: blackoutDates,
      holds: activeHolds,
      available_dates: availableDates,
      blocked_dates: blockedDates
    };
  }

  // Hold Management for Checkout Protection
  async createHold(hold: InsertHold): Promise<Hold> {
    const [created] = await db
      .insert(holds)
      .values(hold)
      .returning();

    return created;
  }

  async getActiveHolds(propertyId?: string): Promise<Hold[]> {
    const baseQuery = db
      .select()
      .from(holds)
      .where(gte(holds.expires_at, sql`now()`))
      .orderBy(asc(holds.created_at));

    if (propertyId) {
      return await baseQuery.where(eq(holds.property_id, propertyId));
    }

    return await baseQuery;
  }

  async purgeExpiredHolds(): Promise<number> {
    const result = await db
      .delete(holds)
      .where(lte(holds.expires_at, sql`now()`));

    return result.rowCount || 0;
  }

  async releaseHold(id: string): Promise<void> {
    await db.delete(holds).where(eq(holds.id, id));
  }

  // Sync Run Management
  async createSyncRun(syncRun: InsertSyncRun): Promise<SyncRun> {
    const [created] = await db
      .insert(sync_runs)
      .values(syncRun)
      .returning();

    return created;
  }

  async updateSyncRun(id: string, updates: Partial<SyncRun>): Promise<SyncRun> {
    const [updated] = await db
      .update(sync_runs)
      .set(updates)
      .where(eq(sync_runs.id, id))
      .returning();

    if (!updated) {
      throw new Error("Sync run not found");
    }

    return updated;
  }

  async getSyncRuns(calendarId?: string, limit: number = 50): Promise<SyncRun[]> {
    let query = db
      .select()
      .from(sync_runs)
      .orderBy(desc(sync_runs.created_at))
      .limit(limit);

    if (calendarId) {
      query = query.where(eq(sync_runs.calendar_id, calendarId));
    }

    return await query;
  }

  async getLatestSyncRun(calendarId: string): Promise<SyncRun | undefined> {
    const [latest] = await db
      .select()
      .from(sync_runs)
      .where(eq(sync_runs.calendar_id, calendarId))
      .orderBy(desc(sync_runs.created_at))
      .limit(1);

    return latest || undefined;
  }

  // Update checkAvailability to include external sources
  async checkAvailability(startDate: string, endDate: string): Promise<boolean> {
    const availability = await this.getMergedAvailability(startDate, endDate);
    
    // Check if any dates in the range are blocked
    const start = new Date(startDate);
    const end = new Date(endDate);
    const current = new Date(start);
    
    while (current < end) {
      const dateStr = current.toISOString().split('T')[0];
      const isBlocked = availability.blocked_dates.some(blocked => blocked.date === dateStr);
      
      if (isBlocked) {
        return false;
      }
      
      current.setDate(current.getDate() + 1);
    }
    
    return true;
  }

  // Airbnb Review Integration Methods
  async getAirbnbReviews(): Promise<AirbnbReview[]> {
    const prop = await this.getProperty();
    if (!prop) return [];

    return await db
      .select()
      .from(airbnb_reviews)
      .where(and(
        eq(airbnb_reviews.property_id, prop.id),
        eq(airbnb_reviews.active, true)
      ))
      .orderBy(desc(airbnb_reviews.review_date));
  }

  async getAirbnbReviewById(id: string): Promise<AirbnbReview | undefined> {
    const [review] = await db
      .select()
      .from(airbnb_reviews)
      .where(eq(airbnb_reviews.id, id));

    return review || undefined;
  }

  async createAirbnbReview(review: InsertAirbnbReview): Promise<AirbnbReview> {
    const prop = await this.getProperty();
    if (!prop) {
      throw new Error("Property not found");
    }

    const [created] = await db
      .insert(airbnb_reviews)
      .values({
        ...review,
        property_id: prop.id,
      })
      .returning();

    return created;
  }

  async updateAirbnbReview(id: string, updates: Partial<AirbnbReview>): Promise<AirbnbReview> {
    const [updated] = await db
      .update(airbnb_reviews)
      .set(updates)
      .where(eq(airbnb_reviews.id, id))
      .returning();

    if (!updated) {
      throw new Error("Airbnb review not found");
    }

    return updated;
  }

  async deleteAirbnbReview(id: string): Promise<void> {
    await db.delete(airbnb_reviews).where(eq(airbnb_reviews.id, id));
  }

  async syncAirbnbReviews(reviewsData: InsertAirbnbReview[]): Promise<{ imported: number; updated: number; skipped: number }> {
    const prop = await this.getProperty();
    if (!prop) {
      throw new Error("Property not found");
    }

    let imported = 0;
    let updated = 0;
    let skipped = 0;

    for (const reviewData of reviewsData) {
      try {
        // Check if review already exists by airbnb_review_id
        const [existing] = await db
          .select()
          .from(airbnb_reviews)
          .where(and(
            eq(airbnb_reviews.property_id, prop.id),
            eq(airbnb_reviews.airbnb_review_id, reviewData.airbnb_review_id)
          ));

        if (existing) {
          // Update existing review
          await db
            .update(airbnb_reviews)
            .set({
              ...reviewData,
              sync_date: new Date(),
            })
            .where(eq(airbnb_reviews.id, existing.id));
          updated++;
        } else {
          // Create new review
          await db
            .insert(airbnb_reviews)
            .values({
              ...reviewData,
              property_id: prop.id,
            });
          imported++;
        }
      } catch (error) {
        console.error(`Failed to sync review ${reviewData.airbnb_review_id}:`, error);
        skipped++;
      }
    }

    return { imported, updated, skipped };
  }

  // Unified Review System
  async getUnifiedReviews(): Promise<UnifiedReview[]> {
    const prop = await this.getProperty();
    if (!prop) return [];

    // Get approved guest reviews
    const guestReviewsQuery = db
      .select({
        id: guest_reviews.id,
        guest_name: guest_reviews.guest_name,
        location: guest_reviews.location,
        rating: guest_reviews.rating,
        review_text: guest_reviews.review_text,
        review_date: guest_reviews.review_date,
        verified_stay: guest_reviews.verified_guest,
        is_featured: guest_reviews.is_featured,
        would_recommend: guest_reviews.would_recommend,
        trip_type: guest_reviews.trip_type,
        created_at: guest_reviews.created_at,
        source: sql<'guest'>`'guest'`,
        avatar_url: sql<string | null>`NULL`,
        response_from_host: sql<string | null>`NULL`,
        original_id: guest_reviews.id,
      })
      .from(guest_reviews)
      .where(and(
        eq(guest_reviews.property_id, prop.id),
        eq(guest_reviews.approval_status, 'approved')
      ));

    // Get active Airbnb reviews
    const airbnbReviewsQuery = db
      .select({
        id: airbnb_reviews.id,
        guest_name: airbnb_reviews.reviewer_name,
        location: airbnb_reviews.reviewer_location,
        rating: airbnb_reviews.rating,
        review_text: airbnb_reviews.review_text,
        review_date: airbnb_reviews.review_date,
        verified_stay: airbnb_reviews.verified_stay,
        is_featured: airbnb_reviews.is_featured,
        would_recommend: sql<boolean | null>`NULL`,
        trip_type: sql<string | null>`NULL`,
        created_at: airbnb_reviews.created_at,
        source: sql<'airbnb'>`'airbnb'`,
        avatar_url: airbnb_reviews.reviewer_avatar_url,
        response_from_host: airbnb_reviews.response_from_host,
        original_id: airbnb_reviews.id,
      })
      .from(airbnb_reviews)
      .where(and(
        eq(airbnb_reviews.property_id, prop.id),
        eq(airbnb_reviews.active, true)
      ));

    // Execute both queries and combine results
    const [guestReviews, airbnbReviews] = await Promise.all([
      guestReviewsQuery,
      airbnbReviewsQuery
    ]);

    const unifiedReviews = [...guestReviews, ...airbnbReviews]
      .map(review => ({
        ...review,
        review_date: review.review_date.toString(),
        created_at: review.created_at.toISOString(),
      }))
      .sort((a, b) => new Date(b.review_date).getTime() - new Date(a.review_date).getTime());

    return unifiedReviews;
  }

  async getFeaturedUnifiedReviews(): Promise<UnifiedReview[]> {
    const allReviews = await this.getUnifiedReviews();
    return allReviews.filter(review => review.is_featured);
  }

  async getUnifiedReviewsSummary(): Promise<{ 
    averageRating: number; 
    totalReviews: number; 
    guestReviews: number;
    airbnbReviews: number;
    reviewCounts: { 1: number; 2: number; 3: number; 4: number; 5: number };
    sources: { guest: number; airbnb: number };
  }> {
    const unifiedReviews = await this.getUnifiedReviews();

    const totalReviews = unifiedReviews.length;
    const guestReviews = unifiedReviews.filter(r => r.source === 'guest').length;
    const airbnbReviews = unifiedReviews.filter(r => r.source === 'airbnb').length;

    const reviewCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRating = 0;

    unifiedReviews.forEach(review => {
      totalRating += review.rating;
      reviewCounts[review.rating as keyof typeof reviewCounts]++;
    });

    const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;

    return {
      averageRating: Math.round(averageRating * 100) / 100,
      totalReviews,
      guestReviews,
      airbnbReviews,
      reviewCounts,
      sources: {
        guest: guestReviews,
        airbnb: airbnbReviews
      }
    };
  }

  // Airbnb Review Admin Management
  async toggleAirbnbReviewFeatured(id: string, featured: boolean): Promise<AirbnbReview> {
    return this.updateAirbnbReview(id, { is_featured: featured });
  }

  async toggleAirbnbReviewActive(id: string, active: boolean): Promise<AirbnbReview> {
    return this.updateAirbnbReview(id, { active });
  }

  async getAirbnbReviewsStats(): Promise<{
    total: number;
    active: number;
    featured: number;
    averageRating: number;
    lastSyncDate?: string;
  }> {
    const prop = await this.getProperty();
    if (!prop) {
      return { total: 0, active: 0, featured: 0, averageRating: 0 };
    }

    const reviews = await db
      .select()
      .from(airbnb_reviews)
      .where(eq(airbnb_reviews.property_id, prop.id));

    const total = reviews.length;
    const active = reviews.filter(r => r.active).length;
    const featured = reviews.filter(r => r.is_featured).length;
    
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = total > 0 ? Math.round((totalRating / total) * 100) / 100 : 0;

    const lastSyncDate = reviews.length > 0 
      ? Math.max(...reviews.map(r => r.sync_date.getTime()))
      : undefined;

    return {
      total,
      active,
      featured,
      averageRating,
      lastSyncDate: lastSyncDate ? new Date(lastSyncDate).toISOString() : undefined,
    };
  }

  // Review Solicitation Implementation
  async createReviewSolicitation(solicitation: InsertReviewSolicitation): Promise<ReviewSolicitation> {
    const [created] = await db.insert(review_solicitations).values(solicitation).returning();
    return created;
  }

  async getReviewSolicitation(id: string): Promise<ReviewSolicitation | undefined> {
    const [result] = await db
      .select()
      .from(review_solicitations)
      .where(eq(review_solicitations.id, id));
    return result;
  }

  async getReviewSolicitationByToken(token: string): Promise<ReviewSolicitation | undefined> {
    const [result] = await db
      .select()
      .from(review_solicitations)
      .where(eq(review_solicitations.review_link_token, token));
    return result;
  }

  async getReviewSolicitationByBooking(bookingId: string): Promise<ReviewSolicitation | undefined> {
    const [result] = await db
      .select()
      .from(review_solicitations)
      .where(eq(review_solicitations.booking_id, bookingId));
    return result;
  }

  async updateReviewSolicitation(id: string, updates: Partial<ReviewSolicitation>): Promise<ReviewSolicitation> {
    const [updated] = await db
      .update(review_solicitations)
      .set({ ...updates, updated_at: sql`now()` })
      .where(eq(review_solicitations.id, id))
      .returning();
    return updated;
  }

  async markReviewSubmitted(bookingId: string): Promise<void> {
    await db
      .update(review_solicitations)
      .set({ 
        review_submitted: true, 
        updated_at: sql`now()` 
      })
      .where(eq(review_solicitations.booking_id, bookingId));
  }

  async getEligibleBookingsForSolicitation(): Promise<Array<{ booking: Booking; guest: Guest }>> {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    const results = await db
      .select({
        booking: bookings,
        guest: guests
      })
      .from(bookings)
      .innerJoin(guests, and(eq(guests.booking_id, bookings.id), eq(guests.is_primary, true)))
      .leftJoin(review_solicitations, eq(review_solicitations.booking_id, bookings.id))
      .where(and(
        eq(bookings.status, 'confirmed'),
        lte(bookings.end_date, twoDaysAgo.toISOString().split('T')[0]),
        sql`${review_solicitations.id} IS NULL` // No solicitation sent yet
      ));

    return results.map(r => ({ booking: r.booking, guest: r.guest }));
  }

  async getReviewSolicitationStats(startDate?: string, endDate?: string): Promise<{
    totalSent: number;
    reviewsSubmitted: number;
    responseRate: number;
    pendingSolicitations: number;
    failedSolicitations: number;
  }> {
    let whereConditions = [];
    
    if (startDate) {
      whereConditions.push(gte(review_solicitations.created_at, startDate));
    }
    if (endDate) {
      whereConditions.push(lte(review_solicitations.created_at, endDate));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const stats = await db
      .select({
        totalSent: count(),
        reviewsSubmitted: sum(sql`CASE WHEN ${review_solicitations.review_submitted} = true THEN 1 ELSE 0 END`),
        pendingSolicitations: sum(sql`CASE WHEN ${review_solicitations.email_status} = 'pending' THEN 1 ELSE 0 END`),
        failedSolicitations: sum(sql`CASE WHEN ${review_solicitations.email_status} = 'failed' THEN 1 ELSE 0 END`)
      })
      .from(review_solicitations)
      .where(whereClause);

    const result = stats[0];
    const totalSent = Number(result.totalSent) || 0;
    const reviewsSubmitted = Number(result.reviewsSubmitted) || 0;
    const responseRate = totalSent > 0 ? (reviewsSubmitted / totalSent) * 100 : 0;

    return {
      totalSent,
      reviewsSubmitted,
      responseRate: Math.round(responseRate * 100) / 100,
      pendingSolicitations: Number(result.pendingSolicitations) || 0,
      failedSolicitations: Number(result.failedSolicitations) || 0
    };
  }

  generateReviewToken(bookingId: string): string {
    // Create a cryptographically secure token
    const randomToken = randomBytes(32).toString('hex');
    const tokenData = `${bookingId}:${Date.now()}:${randomToken}`;
    return createHash('sha256').update(tokenData).digest('hex');
  }

  async validateReviewToken(token: string): Promise<{ valid: boolean; bookingId?: string; expired?: boolean }> {
    try {
      const solicitation = await this.getReviewSolicitationByToken(token);
      
      if (!solicitation) {
        return { valid: false };
      }

      // Check if token has expired (30 days)
      const now = new Date();
      const expiresAt = new Date(solicitation.token_expires_at);
      
      if (now > expiresAt) {
        return { valid: false, bookingId: solicitation.booking_id, expired: true };
      }

      return { valid: true, bookingId: solicitation.booking_id, expired: false };
    } catch (error) {
      console.error('Error validating review token:', error);
      return { valid: false };
    }
  }
  // PAGE BUILDER METHODS

  // Page Layouts
  async getPageLayouts(): Promise<PageLayout[]> {
    return await db
      .select()
      .from(page_layouts)
      .orderBy(asc(page_layouts.created_at));
  }

  async getPageLayout(slug: string): Promise<PageLayout | undefined> {
    const [layout] = await db
      .select()
      .from(page_layouts)
      .where(eq(page_layouts.slug, slug))
      .limit(1);
    return layout;
  }

  async createPageLayout(layout: InsertPageLayout): Promise<PageLayout> {
    const [created] = await db
      .insert(page_layouts)
      .values({
        ...layout,
        updated_at: new Date()
      })
      .returning();
    return created;
  }

  async updatePageLayout(id: string, updates: Partial<PageLayout>): Promise<PageLayout> {
    const [updated] = await db
      .update(page_layouts)
      .set({
        ...updates,
        updated_at: new Date()
      })
      .where(eq(page_layouts.id, id))
      .returning();
    
    if (!updated) {
      throw new Error("Page layout not found");
    }
    return updated;
  }

  async deletePageLayout(id: string): Promise<void> {
    // First delete all content blocks for this layout
    await db.delete(content_blocks).where(eq(content_blocks.layout_id, id));
    
    // Then delete the layout
    await db.delete(page_layouts).where(eq(page_layouts.id, id));
  }

  // Content Blocks
  async getContentBlocks(layoutId: string): Promise<ContentBlock[]> {
    return await db
      .select()
      .from(content_blocks)
      .where(eq(content_blocks.layout_id, layoutId))
      .orderBy(asc(content_blocks.sort_order));
  }

  async createContentBlock(block: InsertContentBlock): Promise<ContentBlock> {
    const [created] = await db
      .insert(content_blocks)
      .values({
        ...block,
        updated_at: new Date()
      })
      .returning();
    return created;
  }

  async updateContentBlock(id: string, updates: Partial<ContentBlock>): Promise<ContentBlock> {
    const [updated] = await db
      .update(content_blocks)
      .set({
        ...updates,
        updated_at: new Date()
      })
      .where(eq(content_blocks.id, id))
      .returning();
    
    if (!updated) {
      throw new Error("Content block not found");
    }
    return updated;
  }

  async reorderContentBlocks(blocks: { id: string; sort_order: number }[]): Promise<ContentBlock[]> {
    const updatePromises = blocks.map(({ id, sort_order }) =>
      db
        .update(content_blocks)
        .set({ 
          sort_order,
          updated_at: new Date()
        })
        .where(eq(content_blocks.id, id))
    );

    await Promise.all(updatePromises);

    // Return the updated blocks
    if (blocks.length > 0) {
      const blockIds = blocks.map(b => b.id);
      return await db
        .select()
        .from(content_blocks)
        .where(inArray(content_blocks.id, blockIds))
        .orderBy(asc(content_blocks.sort_order));
    }
    return [];
  }

  async deleteContentBlock(id: string): Promise<void> {
    await db.delete(content_blocks).where(eq(content_blocks.id, id));
  }

  // Block Types
  async getBlockTypes(): Promise<BlockType[]> {
    return await db
      .select()
      .from(block_types)
      .where(eq(block_types.is_active, true))
      .orderBy(asc(block_types.category), asc(block_types.name));
  }

  async createBlockType(blockType: InsertBlockType): Promise<BlockType> {
    const [created] = await db
      .insert(block_types)
      .values(blockType)
      .returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
