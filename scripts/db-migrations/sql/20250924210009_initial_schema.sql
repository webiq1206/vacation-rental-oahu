-- Migration: 20250924210009_initial_schema
-- Description: Initial database schema for VacationRentalOahu.co
-- Created: 2025-09-24T21:00:09.582Z

-- UP: Create initial database schema
-- Table: airbnb_reviews
CREATE TABLE IF NOT EXISTS airbnb_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL,
  airbnb_review_id TEXT NOT NULL,
  reviewer_name TEXT NOT NULL,
  reviewer_location TEXT,
  rating INTEGER NOT NULL,
  review_text TEXT,
  review_date DATE NOT NULL,
  verified_stay BOOLEAN DEFAULT TRUE,
  response_from_host TEXT,
  reviewer_avatar_url TEXT,
  source TEXT NOT NULL DEFAULT 'airbnb'::text,
  sync_date TIMESTAMP NOT NULL DEFAULT NOW(),
  is_featured BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX airbnb_reviews_airbnb_review_id_unique ON public.airbnb_reviews USING btree (airbnb_review_id);
CREATE INDEX idx_airbnb_reviews_property_id ON public.airbnb_reviews USING btree (property_id);
CREATE INDEX idx_airbnb_reviews_sync_date ON public.airbnb_reviews USING btree (sync_date);
CREATE INDEX idx_airbnb_reviews_review_date ON public.airbnb_reviews USING btree (review_date);
CREATE INDEX idx_airbnb_reviews_property_active_review_date ON public.airbnb_reviews USING btree (property_id, active, review_date);

-- Table: amenities
CREATE TABLE IF NOT EXISTS amenities (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  featured BOOLEAN DEFAULT FALSE
);


-- Table: amenity_categories
CREATE TABLE IF NOT EXISTS amenity_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX amenity_categories_name_unique ON public.amenity_categories USING btree (name);

-- Table: audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);


-- Table: blackout_dates
CREATE TABLE IF NOT EXISTS blackout_dates (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);


-- Table: block_types
CREATE TABLE IF NOT EXISTS block_types (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL,
  category TEXT NOT NULL,
  default_settings JSONB,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX block_types_name_unique ON public.block_types USING btree (name);

-- Table: bookings
CREATE TABLE IF NOT EXISTS bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'::text,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  nights INTEGER NOT NULL,
  guests INTEGER NOT NULL,
  subtotal NUMERIC NOT NULL,
  taxes NUMERIC NOT NULL DEFAULT '0'::numeric,
  fees NUMERIC NOT NULL DEFAULT '0'::numeric,
  total NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD'::text,
  payment_intent_id TEXT,
  idempotency_key TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX bookings_idempotency_key_unique ON public.bookings USING btree (idempotency_key);
CREATE INDEX idx_bookings_start_date ON public.bookings USING btree (start_date);
CREATE INDEX idx_bookings_end_date ON public.bookings USING btree (end_date);
CREATE INDEX idx_bookings_date_range ON public.bookings USING btree (start_date, end_date);
CREATE INDEX idx_bookings_property_status ON public.bookings USING btree (property_id, status);

-- Table: chat_messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  session_id TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);


-- Table: content_blocks
CREATE TABLE IF NOT EXISTS content_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  layout_id UUID NOT NULL,
  block_type TEXT NOT NULL,
  title TEXT,
  content JSONB,
  settings JSONB,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX content_blocks_layout_order ON public.content_blocks USING btree (layout_id, sort_order);

-- Table: coupons
CREATE TABLE IF NOT EXISTS coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  type TEXT NOT NULL,
  value NUMERIC NOT NULL,
  start_date DATE,
  end_date DATE,
  min_nights INTEGER,
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX coupons_code_unique ON public.coupons USING btree (code);

-- Table: email_events
CREATE TABLE IF NOT EXISTS email_events (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  booking_id UUID,
  template TEXT NOT NULL,
  recipient TEXT NOT NULL,
  sent_at TIMESTAMP NOT NULL DEFAULT NOW(),
  provider_message_id TEXT,
  status TEXT DEFAULT 'sent'::text,
  error_message TEXT,
  subject TEXT NOT NULL,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  scheduled_for TIMESTAMP
);


-- Table: email_templates
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  variables JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX email_templates_name_unique ON public.email_templates USING btree (name);

-- Table: external_calendars
CREATE TABLE IF NOT EXISTS external_calendars (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL,
  platform TEXT NOT NULL,
  name TEXT NOT NULL,
  ical_url TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  sync_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  last_sync_at TIMESTAMP,
  next_sync_at TIMESTAMP,
  sync_frequency INTEGER NOT NULL DEFAULT 300,
  etag TEXT,
  last_modified TEXT,
  sync_errors INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);


-- Table: external_reservations
CREATE TABLE IF NOT EXISTS external_reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  calendar_id UUID NOT NULL,
  external_uid TEXT NOT NULL,
  platform TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'reserved'::text,
  guest_name TEXT,
  title TEXT,
  description TEXT,
  is_blocking BOOLEAN NOT NULL DEFAULT TRUE,
  raw_event JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_external_reservations_start_date ON public.external_reservations USING btree (start_date);
CREATE INDEX idx_external_reservations_end_date ON public.external_reservations USING btree (end_date);
CREATE INDEX idx_external_reservations_date_range ON public.external_reservations USING btree (start_date, end_date);
CREATE INDEX idx_external_reservations_calendar_id ON public.external_reservations USING btree (calendar_id);
CREATE UNIQUE INDEX unique_calendar_external_uid ON public.external_reservations USING btree (calendar_id, external_uid);

-- Table: guest_reviews
CREATE TABLE IF NOT EXISTS guest_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL,
  guest_name TEXT NOT NULL,
  location TEXT,
  rating INTEGER NOT NULL,
  review_date DATE NOT NULL,
  trip_type TEXT,
  review_text TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  booking_id UUID,
  guest_email TEXT NOT NULL,
  stay_start_date DATE NOT NULL,
  stay_end_date DATE NOT NULL,
  would_recommend BOOLEAN DEFAULT TRUE,
  approval_status TEXT NOT NULL DEFAULT 'pending'::text,
  verified_guest BOOLEAN DEFAULT FALSE,
  admin_notes TEXT,
  ip_address TEXT,
  submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMP,
  approved_by UUID
);


-- Table: guests
CREATE TABLE IF NOT EXISTS guests (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);


-- Table: holds
CREATE TABLE IF NOT EXISTS holds (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL DEFAULT 'checkout'::text,
  reference_id TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_holds_start_date ON public.holds USING btree (start_date);
CREATE INDEX idx_holds_end_date ON public.holds USING btree (end_date);
CREATE INDEX idx_holds_expires_at ON public.holds USING btree (expires_at);
CREATE INDEX idx_holds_property_id ON public.holds USING btree (property_id);

-- Table: messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  ip TEXT,
  replied BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);


-- Table: nearby_attractions
CREATE TABLE IF NOT EXISTS nearby_attractions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  distance TEXT,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'attraction'::text,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  detailed_description TEXT,
  image_url TEXT,
  gallery_images _text[],
  website_url TEXT,
  phone_number TEXT,
  address TEXT,
  hours TEXT,
  rating NUMERIC,
  reviews_count INTEGER DEFAULT 0,
  tags _text[],
  ticket_price TEXT
);


-- Table: page_layouts
CREATE TABLE IF NOT EXISTS page_layouts (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX page_layouts_slug_unique ON public.page_layouts USING btree (slug);

-- Table: photos
CREATE TABLE IF NOT EXISTS photos (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL,
  url TEXT NOT NULL,
  alt TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);


-- Table: pricing_rules
CREATE TABLE IF NOT EXISTS pricing_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL,
  rule_type TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  value NUMERIC NOT NULL,
  min_nights INTEGER,
  percentage BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);


-- Table: property
CREATE TABLE IF NOT EXISTS property (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  address TEXT NOT NULL,
  lat NUMERIC,
  lng NUMERIC,
  check_in_time TEXT,
  check_out_time TEXT,
  max_guests INTEGER,
  bedrooms INTEGER,
  bathrooms INTEGER,
  rating NUMERIC,
  review_count INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  general_location TEXT,
  is_superhost BOOLEAN DEFAULT FALSE,
  marketing_description TEXT
);


-- Table: property_amenities
CREATE TABLE IF NOT EXISTS property_amenities (
  property_id UUID NOT NULL,
  amenity_id UUID NOT NULL
);

CREATE UNIQUE INDEX property_amenities_property_id_amenity_id_pk ON public.property_amenities USING btree (property_id, amenity_id);

-- Table: review_solicitations
CREATE TABLE IF NOT EXISTS review_solicitations (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL,
  guest_email TEXT NOT NULL,
  guest_name TEXT NOT NULL,
  checkout_date DATE NOT NULL,
  solicitation_sent_date TIMESTAMP,
  review_submitted BOOLEAN NOT NULL DEFAULT FALSE,
  email_status TEXT NOT NULL DEFAULT 'pending'::text,
  review_link_token TEXT NOT NULL,
  token_expires_at TIMESTAMP NOT NULL,
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  email_provider_id TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX review_solicitations_review_link_token_unique ON public.review_solicitations USING btree (review_link_token);
CREATE UNIQUE INDEX unique_booking_solicitation ON public.review_solicitations USING btree (booking_id);
CREATE INDEX idx_review_solicitations_booking_id ON public.review_solicitations USING btree (booking_id);
CREATE INDEX idx_review_solicitations_checkout_date ON public.review_solicitations USING btree (checkout_date);
CREATE INDEX idx_review_solicitations_email_status ON public.review_solicitations USING btree (email_status);
CREATE INDEX idx_review_solicitations_token_expires_at ON public.review_solicitations USING btree (token_expires_at);

-- Table: settings
CREATE TABLE IF NOT EXISTS settings (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX settings_key_unique ON public.settings USING btree (key);

-- Table: sync_runs
CREATE TABLE IF NOT EXISTS sync_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  calendar_id UUID NOT NULL,
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'running'::text,
  reservations_imported INTEGER NOT NULL DEFAULT 0,
  reservations_updated INTEGER NOT NULL DEFAULT 0,
  reservations_deleted INTEGER NOT NULL DEFAULT 0,
  http_status INTEGER,
  response_time_ms INTEGER,
  error_message TEXT,
  etag_used TEXT,
  last_modified_used TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);


-- Table: users
CREATE TABLE IF NOT EXISTS users (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin'::text,
  twofa_secret TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX users_email_unique ON public.users USING btree (email);

-- Foreign Key Constraints
ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE blackout_dates ADD CONSTRAINT blackout_dates_property_id_property_id_fk FOREIGN KEY (property_id) REFERENCES property(id);
ALTER TABLE bookings ADD CONSTRAINT bookings_property_id_property_id_fk FOREIGN KEY (property_id) REFERENCES property(id);
ALTER TABLE email_events ADD CONSTRAINT email_events_booking_id_bookings_id_fk FOREIGN KEY (booking_id) REFERENCES bookings(id);
ALTER TABLE guests ADD CONSTRAINT guests_booking_id_bookings_id_fk FOREIGN KEY (booking_id) REFERENCES bookings(id);
ALTER TABLE photos ADD CONSTRAINT photos_property_id_property_id_fk FOREIGN KEY (property_id) REFERENCES property(id);
ALTER TABLE pricing_rules ADD CONSTRAINT pricing_rules_property_id_property_id_fk FOREIGN KEY (property_id) REFERENCES property(id);
ALTER TABLE property_amenities ADD CONSTRAINT property_amenities_property_id_property_id_fk FOREIGN KEY (property_id) REFERENCES property(id);
ALTER TABLE property_amenities ADD CONSTRAINT property_amenities_amenity_id_amenities_id_fk FOREIGN KEY (amenity_id) REFERENCES amenities(id);
ALTER TABLE guest_reviews ADD CONSTRAINT guest_reviews_property_id_property_id_fk FOREIGN KEY (property_id) REFERENCES property(id);
ALTER TABLE guest_reviews ADD CONSTRAINT guest_reviews_booking_id_bookings_id_fk FOREIGN KEY (booking_id) REFERENCES bookings(id);
ALTER TABLE guest_reviews ADD CONSTRAINT guest_reviews_approved_by_users_id_fk FOREIGN KEY (approved_by) REFERENCES users(id);
ALTER TABLE external_calendars ADD CONSTRAINT external_calendars_property_id_property_id_fk FOREIGN KEY (property_id) REFERENCES property(id);
ALTER TABLE external_reservations ADD CONSTRAINT external_reservations_calendar_id_external_calendars_id_fk FOREIGN KEY (calendar_id) REFERENCES external_calendars(id);
ALTER TABLE holds ADD CONSTRAINT holds_property_id_property_id_fk FOREIGN KEY (property_id) REFERENCES property(id);
ALTER TABLE sync_runs ADD CONSTRAINT sync_runs_calendar_id_external_calendars_id_fk FOREIGN KEY (calendar_id) REFERENCES external_calendars(id);
ALTER TABLE airbnb_reviews ADD CONSTRAINT airbnb_reviews_property_id_property_id_fk FOREIGN KEY (property_id) REFERENCES property(id);
ALTER TABLE review_solicitations ADD CONSTRAINT review_solicitations_booking_id_bookings_id_fk FOREIGN KEY (booking_id) REFERENCES bookings(id);
ALTER TABLE nearby_attractions ADD CONSTRAINT nearby_attractions_property_id_property_id_fk FOREIGN KEY (property_id) REFERENCES property(id);
ALTER TABLE content_blocks ADD CONSTRAINT content_blocks_layout_id_page_layouts_id_fk FOREIGN KEY (layout_id) REFERENCES page_layouts(id);



-- Seed essential data
-- Users table (admin user)
INSERT INTO users (id, email, password, role, created_at) 
VALUES (
  gen_random_uuid(),
  'admin@vacationrentaloahu.co',
  'a6d71ace00d49a6eb950546b63e9e29b007f95cd8193e8a40d018d7a879ffb52a4a23e6c7340315e090fef51192c86156c12e5dd213972e0c80cef3ebd8af290.498f24543bf1a728edd4840ea5946a33',
  'admin',
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Essential settings
INSERT INTO settings (key, value, description, created_at)
VALUES 
  ('site_name', 'VacationRentalOahu.co', 'Website name', NOW()),
  ('site_title', 'Beach House Vacation Rental Oahu', 'SEO title', NOW()),
  ('contact_email', 'info@vacationrentaloahu.co', 'Contact email', NOW())
ON CONFLICT (key) DO NOTHING;

-- DOWN: Drop all tables (careful!)
DROP TABLE IF EXISTS schema_migrations;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS pricing_rules CASCADE;
DROP TABLE IF EXISTS page_layouts CASCADE;
DROP TABLE IF EXISTS content_blocks CASCADE;
DROP TABLE IF EXISTS block_types CASCADE;
DROP TABLE IF EXISTS nearby_attractions CASCADE;
DROP TABLE IF EXISTS photos CASCADE;
DROP TABLE IF EXISTS property_amenities CASCADE;
DROP TABLE IF EXISTS amenities CASCADE;
DROP TABLE IF EXISTS amenity_categories CASCADE;
DROP TABLE IF EXISTS property CASCADE;
DROP TABLE IF EXISTS users CASCADE;
