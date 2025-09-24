import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, date, jsonb, uuid, primaryKey, unique, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for admin authentication
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["admin", "host"] }).default("admin").notNull(),
  twofa_secret: text("twofa_secret"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Property table - single property for this site
export const property = pgTable("property", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  address: text("address").notNull(),
  general_location: text("general_location"),
  lat: decimal("lat", { precision: 10, scale: 8 }),
  lng: decimal("lng", { precision: 11, scale: 8 }),
  check_in_time: text("check_in_time"),
  check_out_time: text("check_out_time"),
  max_guests: integer("max_guests"),
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  review_count: integer("review_count"),
  is_superhost: boolean("is_superhost").default(false),
  marketing_description: text("marketing_description"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Photos for the property
export const photos = pgTable("photos", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  property_id: uuid("property_id").references(() => property.id).notNull(),
  url: text("url").notNull(),
  alt: text("alt").notNull(),
  sort_order: integer("sort_order").default(0).notNull(),
  is_featured: boolean("is_featured").default(false),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Nearby attractions for the property
export const nearby_attractions = pgTable("nearby_attractions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  property_id: uuid("property_id").references(() => property.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  detailed_description: text("detailed_description"),
  distance: text("distance"),
  lat: decimal("lat", { precision: 10, scale: 8 }).notNull(),
  lng: decimal("lng", { precision: 11, scale: 8 }).notNull(),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
  category: text("category", { enum: ["attraction", "restaurant", "beach", "entertainment", "shopping", "transportation"] }).default("attraction").notNull(),
  image_url: text("image_url"),
  gallery_images: text("gallery_images").array(),
  website_url: text("website_url"),
  phone_number: text("phone_number"),
  address: text("address"),
  hours: text("hours"),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  reviews_count: integer("reviews_count").default(0),
  tags: text("tags").array(),
  ticket_price: text("ticket_price"),
  sort_order: integer("sort_order").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Amenity Categories
export const amenity_categories = pgTable("amenity_categories", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  icon: text("icon"),
  color: text("color"),
  sort_order: integer("sort_order").default(0).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Amenities
export const amenities = pgTable("amenities", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  featured: boolean("featured").default(false),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Property amenities junction table
export const property_amenities = pgTable("property_amenities", {
  property_id: uuid("property_id").references(() => property.id).notNull(),
  amenity_id: uuid("amenity_id").references(() => amenities.id).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.property_id, table.amenity_id] }),
}));

// Pricing rules for dynamic pricing
export const pricing_rules = pgTable("pricing_rules", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  property_id: uuid("property_id").references(() => property.id).notNull(),
  rule_type: text("rule_type", { enum: ["base", "seasonal", "weekend", "min_nights", "discount_long_stay", "cleaning_fee", "service_fee", "tat_rate", "get_rate", "county_tax_rate"] }).notNull(),
  start_date: date("start_date"),
  end_date: date("end_date"),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  min_nights: integer("min_nights"),
  percentage: boolean("percentage").default(false),
  active: boolean("active").default(true),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Blackout dates
export const blackout_dates = pgTable("blackout_dates", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  property_id: uuid("property_id").references(() => property.id).notNull(),
  start_date: date("start_date").notNull(),
  end_date: date("end_date").notNull(),
  reason: text("reason").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Bookings
export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  property_id: uuid("property_id").references(() => property.id).notNull(),
  status: text("status", { enum: ["pending", "confirmed", "canceled"] }).default("pending").notNull(),
  start_date: date("start_date").notNull(),
  end_date: date("end_date").notNull(),
  nights: integer("nights").notNull(),
  guests: integer("guests").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxes: decimal("taxes", { precision: 10, scale: 2 }).default("0").notNull(),
  fees: decimal("fees", { precision: 10, scale: 2 }).default("0").notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("USD").notNull(),
  payment_intent_id: text("payment_intent_id"),
  idempotency_key: text("idempotency_key").unique(),
  created_at: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // PERFORMANCE: Indexes on date columns for availability queries
  idx_start_date: index("idx_bookings_start_date").on(table.start_date),
  idx_end_date: index("idx_bookings_end_date").on(table.end_date),
  idx_date_range: index("idx_bookings_date_range").on(table.start_date, table.end_date),
  // PERFORMANCE: Index on property_id and status for filtering
  idx_property_status: index("idx_bookings_property_status").on(table.property_id, table.status),
  // RELIABILITY: PostgreSQL EXCLUDE constraint for preventing double bookings
  exclude_booking_overlap: sql`EXCLUDE USING gist (property_id WITH =, daterange(start_date, end_date, '[)') WITH &&) WHERE (status = 'confirmed')`,
}));

// Guests for bookings
export const guests = pgTable("guests", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  booking_id: uuid("booking_id").references(() => bookings.id).notNull(),
  first_name: text("first_name").notNull(),
  last_name: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  is_primary: boolean("is_primary").default(false),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Contact messages
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject"),
  message: text("message").notNull(),
  ip: text("ip"),
  replied: boolean("replied").default(false),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Chat messages for live chat feature
export const chat_messages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  is_admin: boolean("is_admin").default(false).notNull(),
  session_id: text("session_id").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Email events for tracking
export const email_events = pgTable("email_events", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  booking_id: uuid("booking_id").references(() => bookings.id),
  template: text("template", { enum: ["booking_confirmation", "pre_arrival_reminder", "checkin_instructions", "post_stay_followup", "admin_booking_alert", "admin_notification", "contact_reply"] }).notNull(),
  recipient: text("recipient").notNull(),
  subject: text("subject").notNull(),
  sent_at: timestamp("sent_at").defaultNow().notNull(),
  provider_message_id: text("provider_message_id"),
  status: text("status", { enum: ["sent", "delivered", "failed", "bounced", "complained"] }).default("sent"),
  error_message: text("error_message"),
  opened_at: timestamp("opened_at"),
  clicked_at: timestamp("clicked_at"),
  scheduled_for: timestamp("scheduled_for"),
});

// Email templates for customization
export const email_templates = pgTable("email_templates", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  subject: text("subject").notNull(),
  html_content: text("html_content").notNull(),
  text_content: text("text_content"),
  is_active: boolean("is_active").default(true),
  variables: jsonb("variables").default('[]'),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Audit logs for admin actions
export const audit_logs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: uuid("user_id").references(() => users.id),
  action: text("action").notNull(),
  entity_type: text("entity_type").notNull(),
  entity_id: text("entity_id"),
  old_values: jsonb("old_values"),
  new_values: jsonb("new_values"),
  ip: text("ip"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Coupons
export const coupons = pgTable("coupons", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  type: text("type", { enum: ["percent", "fixed"] }).notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  start_date: date("start_date"),
  end_date: date("end_date"),
  min_nights: integer("min_nights"),
  usage_limit: integer("usage_limit"),
  used_count: integer("used_count").default(0),
  active: boolean("active").default(true),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Settings for global configuration
export const settings = pgTable("settings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").unique().notNull(),
  value: jsonb("value").notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Guest reviews
export const guest_reviews = pgTable("guest_reviews", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  property_id: uuid("property_id").references(() => property.id).notNull(),
  booking_id: uuid("booking_id").references(() => bookings.id),
  guest_name: text("guest_name").notNull(),
  guest_email: text("guest_email").notNull(),
  location: text("location"),
  rating: integer("rating").notNull(),
  review_date: date("review_date").notNull(),
  stay_start_date: date("stay_start_date").notNull(),
  stay_end_date: date("stay_end_date").notNull(),
  trip_type: text("trip_type", { enum: ["Solo", "Couple", "Family", "Group", "Business"] }),
  review_text: text("review_text"),
  would_recommend: boolean("would_recommend").default(true),
  is_featured: boolean("is_featured").default(false),
  approval_status: text("approval_status", { enum: ["pending", "approved", "rejected"] }).default("pending").notNull(),
  verified_guest: boolean("verified_guest").default(false),
  admin_notes: text("admin_notes"),
  ip_address: text("ip_address"),
  submitted_at: timestamp("submitted_at").defaultNow().notNull(),
  approved_at: timestamp("approved_at"),
  approved_by: uuid("approved_by").references(() => users.id),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Airbnb reviews for external review integration
export const airbnb_reviews = pgTable("airbnb_reviews", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  property_id: uuid("property_id").references(() => property.id).notNull(),
  airbnb_review_id: text("airbnb_review_id").notNull().unique(),
  reviewer_name: text("reviewer_name").notNull(),
  reviewer_location: text("reviewer_location"),
  rating: integer("rating").notNull(),
  review_text: text("review_text"),
  review_date: date("review_date").notNull(),
  verified_stay: boolean("verified_stay").default(true),
  response_from_host: text("response_from_host"),
  reviewer_avatar_url: text("reviewer_avatar_url"),
  source: text("source").default("airbnb").notNull(),
  sync_date: timestamp("sync_date").defaultNow().notNull(),
  is_featured: boolean("is_featured").default(false),
  active: boolean("active").default(true),
  created_at: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // PERFORMANCE: Index on property_id for filtering
  idx_property_id: index("idx_airbnb_reviews_property_id").on(table.property_id),
  // PERFORMANCE: Index on sync_date for sync management
  idx_sync_date: index("idx_airbnb_reviews_sync_date").on(table.sync_date),
  // PERFORMANCE: Index on review_date for ordering
  idx_review_date: index("idx_airbnb_reviews_review_date").on(table.review_date),
  // PERFORMANCE: Compound index for unified review filtering and ordering
  idx_property_active_review_date: index("idx_airbnb_reviews_property_active_review_date").on(table.property_id, table.active, table.review_date),
}));

// External calendars for Airbnb/Vrbo integration
export const external_calendars = pgTable("external_calendars", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  property_id: uuid("property_id").references(() => property.id).notNull(),
  platform: text("platform", { enum: ["airbnb", "vrbo", "booking", "homeaway", "other"] }).notNull(),
  name: text("name").notNull(),
  ical_url: text("ical_url").notNull(),
  active: boolean("active").default(true).notNull(),
  sync_enabled: boolean("sync_enabled").default(true).notNull(),
  last_sync_at: timestamp("last_sync_at"),
  next_sync_at: timestamp("next_sync_at"),
  sync_frequency: integer("sync_frequency").default(300).notNull(), // seconds, default 5 minutes
  etag: text("etag"), // for conditional requests
  last_modified: text("last_modified"), // for conditional requests
  sync_errors: integer("sync_errors").default(0).notNull(),
  last_error: text("last_error"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// External reservations imported from iCal feeds
export const external_reservations = pgTable("external_reservations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  calendar_id: uuid("calendar_id").references(() => external_calendars.id).notNull(),
  external_uid: text("external_uid").notNull(), // unique ID from external calendar
  platform: text("platform", { enum: ["airbnb", "vrbo", "booking", "homeaway", "other"] }).notNull(),
  start_date: date("start_date").notNull(),
  end_date: date("end_date").notNull(),
  status: text("status", { enum: ["reserved", "blocked", "tentative", "cancelled"] }).default("reserved").notNull(),
  guest_name: text("guest_name"),
  title: text("title"), // event title from iCal
  description: text("description"),
  is_blocking: boolean("is_blocking").default(true).notNull(), // whether this blocks availability
  raw_event: jsonb("raw_event"), // store original iCal event data
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // SECURITY: Unique constraint prevents duplicate external reservations
  unique_calendar_external_uid: unique("unique_calendar_external_uid").on(table.calendar_id, table.external_uid),
  // PERFORMANCE: Indexes on date columns for fast availability queries
  idx_start_date: index("idx_external_reservations_start_date").on(table.start_date),
  idx_end_date: index("idx_external_reservations_end_date").on(table.end_date),
  idx_date_range: index("idx_external_reservations_date_range").on(table.start_date, table.end_date),
  // PERFORMANCE: Index on calendar_id for filtering by calendar
  idx_calendar_id: index("idx_external_reservations_calendar_id").on(table.calendar_id),
  // RELIABILITY: PostgreSQL EXCLUDE constraint for date range conflicts
  exclude_date_overlap: sql`EXCLUDE USING gist (calendar_id WITH =, daterange(start_date, end_date, '[)') WITH &&) WHERE (is_blocking = true AND status IN ('reserved', 'blocked'))`,
}));

// Temporary holds during checkout process
export const holds = pgTable("holds", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  property_id: uuid("property_id").references(() => property.id).notNull(),
  start_date: date("start_date").notNull(),
  end_date: date("end_date").notNull(),
  reason: text("reason", { enum: ["checkout", "admin_block", "maintenance"] }).default("checkout").notNull(),
  reference_id: text("reference_id"), // session ID, booking ID, etc.
  expires_at: timestamp("expires_at").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // PERFORMANCE: Indexes on date columns for hold management
  idx_start_date: index("idx_holds_start_date").on(table.start_date),
  idx_end_date: index("idx_holds_end_date").on(table.end_date),
  idx_expires_at: index("idx_holds_expires_at").on(table.expires_at),
  // PERFORMANCE: Index on property_id for filtering
  idx_property_id: index("idx_holds_property_id").on(table.property_id),
  // RELIABILITY: PostgreSQL EXCLUDE constraint for preventing overlapping holds on same dates
  exclude_hold_overlap: sql`EXCLUDE USING gist (property_id WITH =, daterange(start_date, end_date, '[)') WITH &&) WHERE (expires_at > now())`,
}));

// Sync run logs for monitoring and debugging
export const sync_runs = pgTable("sync_runs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  calendar_id: uuid("calendar_id").references(() => external_calendars.id).notNull(),
  started_at: timestamp("started_at").defaultNow().notNull(),
  completed_at: timestamp("completed_at"),
  status: text("status", { enum: ["running", "success", "error", "timeout"] }).default("running").notNull(),
  reservations_imported: integer("reservations_imported").default(0).notNull(),
  reservations_updated: integer("reservations_updated").default(0).notNull(),
  reservations_deleted: integer("reservations_deleted").default(0).notNull(),
  http_status: integer("http_status"),
  response_time_ms: integer("response_time_ms"),
  error_message: text("error_message"),
  etag_used: text("etag_used"),
  last_modified_used: text("last_modified_used"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Review solicitations for automated post-stay review collection
export const review_solicitations = pgTable("review_solicitations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  booking_id: uuid("booking_id").references(() => bookings.id).notNull(),
  guest_email: text("guest_email").notNull(),
  guest_name: text("guest_name").notNull(),
  checkout_date: date("checkout_date").notNull(),
  solicitation_sent_date: timestamp("solicitation_sent_date"),
  review_submitted: boolean("review_submitted").default(false).notNull(),
  email_status: text("email_status", { enum: ["pending", "sent", "delivered", "failed", "bounced"] }).default("pending").notNull(),
  review_link_token: text("review_link_token").notNull().unique(),
  token_expires_at: timestamp("token_expires_at").notNull(),
  retry_count: integer("retry_count").default(0).notNull(),
  last_error: text("last_error"),
  email_provider_id: text("email_provider_id"), // Resend message ID
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // PERFORMANCE: Index on booking_id for looking up solicitations by booking
  idx_booking_id: index("idx_review_solicitations_booking_id").on(table.booking_id),
  // PERFORMANCE: Index on checkout_date for finding eligible bookings
  idx_checkout_date: index("idx_review_solicitations_checkout_date").on(table.checkout_date),
  // PERFORMANCE: Index on email_status for filtering pending/failed solicitations
  idx_email_status: index("idx_review_solicitations_email_status").on(table.email_status),
  // PERFORMANCE: Index on token_expires_at for cleanup of expired tokens
  idx_token_expires_at: index("idx_review_solicitations_token_expires_at").on(table.token_expires_at),
  // UNIQUENESS: One solicitation per booking to prevent duplicates
  unique_booking_solicitation: unique("unique_booking_solicitation").on(table.booking_id),
}));

// Relations
export const propertyRelations = relations(property, ({ many }) => ({
  photos: many(photos),
  amenities: many(property_amenities),
  pricing_rules: many(pricing_rules),
  blackout_dates: many(blackout_dates),
  bookings: many(bookings),
  guest_reviews: many(guest_reviews),
  airbnb_reviews: many(airbnb_reviews),
  external_calendars: many(external_calendars),
  holds: many(holds),
}));

export const photosRelations = relations(photos, ({ one }) => ({
  property: one(property, {
    fields: [photos.property_id],
    references: [property.id],
  }),
}));

export const amenitiesRelations = relations(amenities, ({ many }) => ({
  properties: many(property_amenities),
}));

export const propertyAmenitiesRelations = relations(property_amenities, ({ one }) => ({
  property: one(property, {
    fields: [property_amenities.property_id],
    references: [property.id],
  }),
  amenity: one(amenities, {
    fields: [property_amenities.amenity_id],
    references: [amenities.id],
  }),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  property: one(property, {
    fields: [bookings.property_id],
    references: [property.id],
  }),
  guests: many(guests),
  email_events: many(email_events),
}));

export const guestsRelations = relations(guests, ({ one }) => ({
  booking: one(bookings, {
    fields: [guests.booking_id],
    references: [bookings.id],
  }),
}));

export const guestReviewsRelations = relations(guest_reviews, ({ one }) => ({
  property: one(property, {
    fields: [guest_reviews.property_id],
    references: [property.id],
  }),
  booking: one(bookings, {
    fields: [guest_reviews.booking_id],
    references: [bookings.id],
  }),
  approvedBy: one(users, {
    fields: [guest_reviews.approved_by],
    references: [users.id],
  }),
}));

export const airbnbReviewsRelations = relations(airbnb_reviews, ({ one }) => ({
  property: one(property, {
    fields: [airbnb_reviews.property_id],
    references: [property.id],
  }),
}));

export const externalCalendarsRelations = relations(external_calendars, ({ one, many }) => ({
  property: one(property, {
    fields: [external_calendars.property_id],
    references: [property.id],
  }),
  reservations: many(external_reservations),
  sync_runs: many(sync_runs),
}));

export const externalReservationsRelations = relations(external_reservations, ({ one }) => ({
  calendar: one(external_calendars, {
    fields: [external_reservations.calendar_id],
    references: [external_calendars.id],
  }),
}));

export const holdsRelations = relations(holds, ({ one }) => ({
  property: one(property, {
    fields: [holds.property_id],
    references: [property.id],
  }),
}));

export const syncRunsRelations = relations(sync_runs, ({ one }) => ({
  calendar: one(external_calendars, {
    fields: [sync_runs.calendar_id],
    references: [external_calendars.id],
  }),
}));

export const reviewSolicitationsRelations = relations(review_solicitations, ({ one }) => ({
  booking: one(bookings, {
    fields: [review_solicitations.booking_id],
    references: [bookings.id],
  }),
}));

export const nearbyAttractionsRelations = relations(nearby_attractions, ({ one }) => ({
  property: one(property, {
    fields: [nearby_attractions.property_id],
    references: [property.id],
  }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  role: true,
});

export const insertPropertySchema = createInsertSchema(property);

export const insertPhotoSchema = createInsertSchema(photos).omit({
  id: true,
  created_at: true,
});

export const insertNearbyAttractionSchema = createInsertSchema(nearby_attractions).omit({
  id: true,
  created_at: true,
});

export const insertAmenityCategorySchema = createInsertSchema(amenity_categories).omit({
  id: true,
  created_at: true,
});

export const insertAmenitySchema = createInsertSchema(amenities).omit({
  id: true,
  created_at: true,
});

export const insertPricingRuleSchema = createInsertSchema(pricing_rules).omit({
  id: true,
  created_at: true,
});

export const insertBlackoutDateSchema = createInsertSchema(blackout_dates).omit({
  id: true,
  created_at: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  created_at: true,
});

export const insertGuestSchema = createInsertSchema(guests).omit({
  id: true,
  created_at: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  created_at: true,
  replied: true,
});

export const insertChatMessageSchema = createInsertSchema(chat_messages).omit({
  id: true,
  created_at: true,
});

export const insertCouponSchema = createInsertSchema(coupons).omit({
  id: true,
  created_at: true,
  used_count: true,
});

export const insertGuestReviewSchema = createInsertSchema(guest_reviews).omit({
  id: true,
  property_id: true,
  created_at: true,
  submitted_at: true,
  approved_at: true,
  approval_status: true,
  verified_guest: true,
});

export const insertAirbnbReviewSchema = createInsertSchema(airbnb_reviews).omit({
  id: true,
  created_at: true,
  sync_date: true,
});

export const insertEmailTemplateSchema = createInsertSchema(email_templates).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertExternalCalendarSchema = createInsertSchema(external_calendars).omit({
  id: true,
  created_at: true,
  updated_at: true,
  last_sync_at: true,
  next_sync_at: true,
  etag: true,
  last_modified: true,
  sync_errors: true,
  last_error: true,
});

export const insertExternalReservationSchema = createInsertSchema(external_reservations).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertHoldSchema = createInsertSchema(holds).omit({
  id: true,
  created_at: true,
});

export const insertSyncRunSchema = createInsertSchema(sync_runs).omit({
  id: true,
  created_at: true,
  completed_at: true,
  reservations_imported: true,
  reservations_updated: true,
  reservations_deleted: true,
  http_status: true,
  response_time_ms: true,
  error_message: true,
  etag_used: true,
  last_modified_used: true,
});

export const insertReviewSolicitationSchema = createInsertSchema(review_solicitations).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Property = typeof property.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;
export type NearbyAttraction = typeof nearby_attractions.$inferSelect;
export type InsertNearbyAttraction = z.infer<typeof insertNearbyAttractionSchema>;
export type AmenityCategory = typeof amenity_categories.$inferSelect;
export type InsertAmenityCategory = z.infer<typeof insertAmenityCategorySchema>;
export type Amenity = typeof amenities.$inferSelect;
export type InsertAmenity = z.infer<typeof insertAmenitySchema>;
export type PricingRule = typeof pricing_rules.$inferSelect;
export type InsertPricingRule = z.infer<typeof insertPricingRuleSchema>;
export type BlackoutDate = typeof blackout_dates.$inferSelect;
export type InsertBlackoutDate = z.infer<typeof insertBlackoutDateSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Guest = typeof guests.$inferSelect;
export type InsertGuest = z.infer<typeof insertGuestSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type ChatMessage = typeof chat_messages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type EmailEvent = typeof email_events.$inferSelect;
export type AuditLog = typeof audit_logs.$inferSelect;
export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = z.infer<typeof insertCouponSchema>;
export type Setting = typeof settings.$inferSelect;
export type GuestReview = typeof guest_reviews.$inferSelect;
export type InsertGuestReview = z.infer<typeof insertGuestReviewSchema>;
export type AirbnbReview = typeof airbnb_reviews.$inferSelect;
export type InsertAirbnbReview = z.infer<typeof insertAirbnbReviewSchema>;
export type EmailTemplate = typeof email_templates.$inferSelect;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type ExternalCalendar = typeof external_calendars.$inferSelect;
export type InsertExternalCalendar = z.infer<typeof insertExternalCalendarSchema>;
export type ExternalReservation = typeof external_reservations.$inferSelect;
export type InsertExternalReservation = z.infer<typeof insertExternalReservationSchema>;
export type Hold = typeof holds.$inferSelect;
export type InsertHold = z.infer<typeof insertHoldSchema>;
export type SyncRun = typeof sync_runs.$inferSelect;
export type InsertSyncRun = z.infer<typeof insertSyncRunSchema>;
export type ReviewSolicitation = typeof review_solicitations.$inferSelect;
export type InsertReviewSolicitation = z.infer<typeof insertReviewSolicitationSchema>;

// Page Builder Tables for drag-and-drop content management
export const page_layouts = pgTable("page_layouts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // e.g., "Home Page", "Stay Page"
  slug: text("slug").notNull().unique(), // e.g., "home", "stay", "contact"
  description: text("description"),
  is_active: boolean("is_active").default(true).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const content_blocks = pgTable("content_blocks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  layout_id: uuid("layout_id").references(() => page_layouts.id).notNull(),
  block_type: text("block_type").notNull(), // "hero", "gallery", "amenities", "reviews", etc.
  title: text("title"),
  content: jsonb("content"), // Flexible content storage
  settings: jsonb("settings"), // Block-specific settings
  sort_order: integer("sort_order").default(0).notNull(),
  is_visible: boolean("is_visible").default(true).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  layoutOrderIdx: index("content_blocks_layout_order").on(table.layout_id, table.sort_order),
}));

export const block_types = pgTable("block_types", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(), // "hero", "gallery", "amenities"
  label: text("label").notNull(), // "Hero Section", "Photo Gallery"
  description: text("description"),
  icon: text("icon").notNull(), // Lucide icon name
  category: text("category").notNull(), // "content", "media", "layout"
  default_settings: jsonb("default_settings"),
  is_active: boolean("is_active").default(true).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Zod schemas for page builder
export const insertPageLayoutSchema = createInsertSchema(page_layouts);
export const insertContentBlockSchema = createInsertSchema(content_blocks);
export const insertBlockTypeSchema = createInsertSchema(block_types);

export type PageLayout = typeof page_layouts.$inferSelect;
export type ContentBlock = typeof content_blocks.$inferSelect;
export type BlockType = typeof block_types.$inferSelect;
export type InsertPageLayout = z.infer<typeof insertPageLayoutSchema>;
export type InsertContentBlock = z.infer<typeof insertContentBlockSchema>;
export type InsertBlockType = z.infer<typeof insertBlockTypeSchema>;

// Unified Review Interface for combining guest and Airbnb reviews
export interface UnifiedReview {
  id: string;
  guest_name: string;
  location?: string | null;
  rating: number;
  review_text?: string | null;
  review_date: string;
  source: 'guest' | 'airbnb';
  verified_stay: boolean;
  avatar_url?: string | null;
  is_featured: boolean;
  would_recommend?: boolean;
  trip_type?: string | null;
  response_from_host?: string | null;
  // Additional metadata
  original_id: string;
  created_at: string;
}

// Public property type that excludes private fields and includes additional data
export type PublicProperty = Omit<Property, 'address' | 'lat' | 'lng'> & {
  general_location: string;
  photos?: Photo[];
  amenities?: Amenity[];
};
