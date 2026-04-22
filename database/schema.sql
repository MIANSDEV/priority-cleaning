-- ============================================================
-- CLEANING QUOTE APP - Supabase Schema
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

-- Service categories (Carpet Cleaning, Upholstery, etc.)
CREATE TABLE IF NOT EXISTS service_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual service items within categories
CREATE TABLE IF NOT EXISTS service_items (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit_type TEXT NOT NULL DEFAULT 'item', -- 'item', 'room', 'sqft'
  is_checkbox BOOLEAN DEFAULT FALSE,
  min_quantity INTEGER DEFAULT 1,
  max_quantity INTEGER DEFAULT 20,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service levels (CLEAN, PROTECT, DEODORIZE, etc.) per item
CREATE TABLE IF NOT EXISTS service_levels (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES service_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,        -- "CLEAN", "PROTECT", "DEODORIZE"
  label TEXT NOT NULL,       -- display label
  price_per_unit NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Online specials / banners shown in left sidebar
CREATE TABLE IF NOT EXISTS specials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  badge_text TEXT DEFAULT 'SPECIAL',
  promo_code TEXT,           -- auto-applies this promo code when user clicks ADD
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promo / discount codes
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10,2) NOT NULL,
  min_order NUMERIC(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer bookings
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  zip_code TEXT,
  service_address TEXT,
  preferred_date DATE,
  preferred_time TEXT,
  selected_services JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(10,2) DEFAULT 0,
  promo_code_used TEXT,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (public read for quote builder)
-- ============================================================

ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE specials ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Public can read active services, specials (for the quote builder)
CREATE POLICY "Public read active categories" ON service_categories FOR SELECT USING (is_active = true);
CREATE POLICY "Public read active items" ON service_items FOR SELECT USING (is_active = true);
CREATE POLICY "Public read active levels" ON service_levels FOR SELECT USING (is_active = true);
CREATE POLICY "Public read active specials" ON specials FOR SELECT USING (is_active = true);
CREATE POLICY "Public read active promos" ON promo_codes FOR SELECT USING (is_active = true);

-- Public can insert bookings
CREATE POLICY "Public insert bookings" ON bookings FOR INSERT WITH CHECK (true);

-- Service role (used by admin API) can do everything
CREATE POLICY "Service role full access categories" ON service_categories USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access items" ON service_items USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access levels" ON service_levels USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access specials" ON specials USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access promos" ON promo_codes USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access bookings" ON bookings USING (auth.role() = 'service_role');

-- ============================================================
-- SEED DATA - Default services and pricing
-- ============================================================

-- CATEGORIES
INSERT INTO service_categories (id, name, display_order) VALUES
  ('carpet', 'CARPET CLEANING', 1),
  ('upholstery', 'UPHOLSTERY CLEANING', 2),
  ('airduct', 'AIR DUCT AND DRYER VENT SERVICES', 3),
  ('tile', 'TILE & GROUT FLOOR CLEANING', 4),
  ('vinyl', 'VINYL & LUXURY VINYL FLOOR CLEANING', 5),
  ('hardwood', 'HARDWOOD FLOOR CLEANING', 6),
  ('inhome-rug', 'IN-HOME AREA RUG CLEANING', 7),
  ('offsite-rug', 'OFF-SITE AREA RUG CLEANING', 8),
  ('leather', 'LEATHER CLEANING', 9)
ON CONFLICT (id) DO NOTHING;

-- CARPET CLEANING ITEMS
INSERT INTO service_items (id, category_id, name, unit_type, display_order) VALUES
  ('carpet-room', 'carpet', 'Room(s)', 'room', 1),
  ('carpet-sofa', 'carpet', 'Sofa or Loveseat', 'item', 2),
  ('carpet-entry', 'carpet', 'Entry or Hall', 'item', 3),
  ('carpet-stairs', 'carpet', 'Staircase', 'item', 4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO service_levels (id, item_id, name, label, price_per_unit, display_order) VALUES
  ('carpet-room-clean', 'carpet-room', 'CLEAN', 'Clean', 89.00, 1),
  ('carpet-room-protect', 'carpet-room', 'PROTECT', 'Protect', 109.00, 2),
  ('carpet-room-deodorize', 'carpet-room', 'DEODORIZE', 'Deodorize', 99.00, 3),
  ('carpet-sofa-clean', 'carpet-sofa', 'CLEAN', 'Clean', 109.00, 1),
  ('carpet-sofa-protect', 'carpet-sofa', 'PROTECT', 'Protect', 129.00, 2),
  ('carpet-sofa-deodorize', 'carpet-sofa', 'DEODORIZE', 'Deodorize', 119.00, 3),
  ('carpet-entry-clean', 'carpet-entry', 'CLEAN', 'Clean', 39.00, 1),
  ('carpet-entry-protect', 'carpet-entry', 'PROTECT', 'Protect', 49.00, 2),
  ('carpet-entry-deodorize', 'carpet-entry', 'DEODORIZE', 'Deodorize', 44.00, 3),
  ('carpet-stairs-clean', 'carpet-stairs', 'CLEAN', 'Clean', 49.00, 1),
  ('carpet-stairs-protect', 'carpet-stairs', 'PROTECT', 'Protect', 59.00, 2),
  ('carpet-stairs-deodorize', 'carpet-stairs', 'DEODORIZE', 'Deodorize', 54.00, 3)
ON CONFLICT (id) DO NOTHING;

-- UPHOLSTERY CLEANING ITEMS
INSERT INTO service_items (id, category_id, name, unit_type, display_order) VALUES
  ('uph-sofa', 'upholstery', 'Sofa', 'item', 1),
  ('uph-sofa-pe', 'upholstery', 'Sofa (PE)', 'item', 2),
  ('uph-loveseat', 'upholstery', 'Loveseat', 'item', 3),
  ('uph-sectional', 'upholstery', 'Sectional (Over 6ft)', 'item', 4),
  ('uph-loveseat2', 'upholstery', 'Loveseat (Small)', 'item', 5),
  ('uph-chair', 'upholstery', 'Chair', 'item', 6),
  ('uph-ottoman', 'upholstery', 'Ottoman', 'item', 7),
  ('uph-dining-chair', 'upholstery', 'Dining Room Chair', 'item', 8),
  ('uph-chaise', 'upholstery', 'Chaise', 'item', 9)
ON CONFLICT (id) DO NOTHING;

INSERT INTO service_levels (id, item_id, name, label, price_per_unit, display_order) VALUES
  ('uph-sofa-clean', 'uph-sofa', 'CLEAN', 'Clean', 109.00, 1),
  ('uph-sofa-protect', 'uph-sofa', 'PROTECT', 'Protect', 129.00, 2),
  ('uph-sofa-deodorize', 'uph-sofa', 'DEODORIZE', 'Deodorize', 119.00, 3),
  ('uph-sofa-pe-clean', 'uph-sofa-pe', 'CLEAN', 'Clean', 119.00, 1),
  ('uph-sofa-pe-protect', 'uph-sofa-pe', 'PROTECT', 'Protect', 139.00, 2),
  ('uph-sofa-pe-deodorize', 'uph-sofa-pe', 'DEODORIZE', 'Deodorize', 129.00, 3),
  ('uph-loveseat-clean', 'uph-loveseat', 'CLEAN', 'Clean', 89.00, 1),
  ('uph-loveseat-protect', 'uph-loveseat', 'PROTECT', 'Protect', 109.00, 2),
  ('uph-loveseat-deodorize', 'uph-loveseat', 'DEODORIZE', 'Deodorize', 99.00, 3),
  ('uph-sectional-clean', 'uph-sectional', 'CLEAN', 'Clean', 189.00, 1),
  ('uph-sectional-protect', 'uph-sectional', 'PROTECT', 'Protect', 219.00, 2),
  ('uph-sectional-deodorize', 'uph-sectional', 'DEODORIZE', 'Deodorize', 199.00, 3),
  ('uph-loveseat2-clean', 'uph-loveseat2', 'CLEAN', 'Clean', 79.00, 1),
  ('uph-loveseat2-protect', 'uph-loveseat2', 'PROTECT', 'Protect', 99.00, 2),
  ('uph-loveseat2-deodorize', 'uph-loveseat2', 'DEODORIZE', 'Deodorize', 89.00, 3),
  ('uph-chair-clean', 'uph-chair', 'CLEAN', 'Clean', 59.00, 1),
  ('uph-chair-protect', 'uph-chair', 'PROTECT', 'Protect', 69.00, 2),
  ('uph-chair-deodorize', 'uph-chair', 'DEODORIZE', 'Deodorize', 64.00, 3),
  ('uph-ottoman-clean', 'uph-ottoman', 'CLEAN', 'Clean', 39.00, 1),
  ('uph-ottoman-protect', 'uph-ottoman', 'PROTECT', 'Protect', 49.00, 2),
  ('uph-ottoman-deodorize', 'uph-ottoman', 'DEODORIZE', 'Deodorize', 44.00, 3),
  ('uph-dining-chair-clean', 'uph-dining-chair', 'CLEAN', 'Clean', 29.00, 1),
  ('uph-dining-chair-protect', 'uph-dining-chair', 'PROTECT', 'Protect', 35.00, 2),
  ('uph-dining-chair-deodorize', 'uph-dining-chair', 'DEODORIZE', 'Deodorize', 32.00, 3),
  ('uph-chaise-clean', 'uph-chaise', 'CLEAN', 'Clean', 79.00, 1),
  ('uph-chaise-protect', 'uph-chaise', 'PROTECT', 'Protect', 89.00, 2),
  ('uph-chaise-deodorize', 'uph-chaise', 'DEODORIZE', 'Deodorize', 84.00, 3)
ON CONFLICT (id) DO NOTHING;

-- AIR DUCT ITEMS (checkboxes)
INSERT INTO service_items (id, category_id, name, unit_type, is_checkbox, display_order) VALUES
  ('airduct-inspection', 'airduct', 'Schedule a no-obligation, professional, in-home inspection and estimate of your Air Ducts.', 'item', true, 1),
  ('airduct-dryer', 'airduct', 'Schedule a dryer vent cleaning service.', 'item', true, 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO service_levels (id, item_id, name, label, price_per_unit, display_order) VALUES
  ('airduct-inspection-level', 'airduct-inspection', 'ADD', 'Add', 0.00, 1),
  ('airduct-dryer-level', 'airduct-dryer', 'ADD', 'Add', 89.00, 1)
ON CONFLICT (id) DO NOTHING;

-- TILE & GROUT ITEMS
INSERT INTO service_items (id, category_id, name, unit_type, display_order) VALUES
  ('tile-room', 'tile', 'Room(s)', 'room', 1),
  ('tile-bathroom', 'tile', 'Bathroom', 'item', 2),
  ('tile-bath-laundry', 'tile', 'Bath or Laundry', 'item', 3),
  ('tile-entry-hall', 'tile', 'Entry or Hall', 'item', 4),
  ('tile-hallway', 'tile', 'Hallway', 'item', 5)
ON CONFLICT (id) DO NOTHING;

INSERT INTO service_levels (id, item_id, name, label, price_per_unit, display_order) VALUES
  ('tile-room-clean', 'tile-room', 'TILE CLEAN', 'Tile Clean', 99.00, 1),
  ('tile-room-clear', 'tile-room', 'CLEAR SEAL', 'Clear Seal', 129.00, 2),
  ('tile-room-color', 'tile-room', 'COLOR SEAL', 'Color Seal', 149.00, 3),
  ('tile-bathroom-clean', 'tile-bathroom', 'TILE CLEAN', 'Tile Clean', 79.00, 1),
  ('tile-bathroom-clear', 'tile-bathroom', 'CLEAR SEAL', 'Clear Seal', 99.00, 2),
  ('tile-bathroom-color', 'tile-bathroom', 'COLOR SEAL', 'Color Seal', 119.00, 3),
  ('tile-bath-laundry-clean', 'tile-bath-laundry', 'TILE CLEAN', 'Tile Clean', 69.00, 1),
  ('tile-bath-laundry-clear', 'tile-bath-laundry', 'CLEAR SEAL', 'Clear Seal', 89.00, 2),
  ('tile-bath-laundry-color', 'tile-bath-laundry', 'COLOR SEAL', 'Color Seal', 109.00, 3),
  ('tile-entry-hall-clean', 'tile-entry-hall', 'TILE CLEAN', 'Tile Clean', 49.00, 1),
  ('tile-entry-hall-clear', 'tile-entry-hall', 'CLEAR SEAL', 'Clear Seal', 59.00, 2),
  ('tile-entry-hall-color', 'tile-entry-hall', 'COLOR SEAL', 'Color Seal', 69.00, 3),
  ('tile-hallway-clean', 'tile-hallway', 'TILE CLEAN', 'Tile Clean', 49.00, 1),
  ('tile-hallway-clear', 'tile-hallway', 'CLEAR SEAL', 'Clear Seal', 59.00, 2),
  ('tile-hallway-color', 'tile-hallway', 'COLOR SEAL', 'Color Seal', 69.00, 3)
ON CONFLICT (id) DO NOTHING;

-- VINYL & LUXURY VINYL ITEMS
INSERT INTO service_items (id, category_id, name, unit_type, display_order) VALUES
  ('vinyl-room', 'vinyl', 'Room(s)', 'room', 1),
  ('vinyl-bath-laundry', 'vinyl', 'Bath or Laundry', 'item', 2),
  ('vinyl-entry-hall', 'vinyl', 'Entry or Hall', 'item', 3),
  ('vinyl-hallway', 'vinyl', 'Hallway', 'item', 4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO service_levels (id, item_id, name, label, price_per_unit, display_order) VALUES
  ('vinyl-room-clean', 'vinyl-room', 'OFF CLEAN', 'Off Clean', 79.00, 1),
  ('vinyl-bath-laundry-clean', 'vinyl-bath-laundry', 'OFF CLEAN', 'Off Clean', 59.00, 1),
  ('vinyl-entry-hall-clean', 'vinyl-entry-hall', 'OFF CLEAN', 'Off Clean', 39.00, 1),
  ('vinyl-hallway-clean', 'vinyl-hallway', 'OFF CLEAN', 'Off Clean', 39.00, 1)
ON CONFLICT (id) DO NOTHING;

-- HARDWOOD FLOOR ITEMS
INSERT INTO service_items (id, category_id, name, unit_type, display_order) VALUES
  ('hardwood-room', 'hardwood', 'Room(s)', 'room', 1),
  ('hardwood-staircase', 'hardwood', 'Staircase', 'item', 2),
  ('hardwood-bath-laundry', 'hardwood', 'Bath or Laundry', 'item', 3),
  ('hardwood-entry-hall', 'hardwood', 'Entry or Hall', 'item', 4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO service_levels (id, item_id, name, label, price_per_unit, display_order) VALUES
  ('hardwood-room-clean', 'hardwood-room', 'WOOD CLEAN', 'Wood Clean', 99.00, 1),
  ('hardwood-staircase-clean', 'hardwood-staircase', 'WOOD CLEAN', 'Wood Clean', 69.00, 1),
  ('hardwood-bath-laundry-clean', 'hardwood-bath-laundry', 'WOOD CLEAN', 'Wood Clean', 59.00, 1),
  ('hardwood-entry-hall-clean', 'hardwood-entry-hall', 'WOOD CLEAN', 'Wood Clean', 49.00, 1)
ON CONFLICT (id) DO NOTHING;

-- IN-HOME AREA RUG ITEMS
INSERT INTO service_items (id, category_id, name, unit_type, display_order) VALUES
  ('inhome-rug-item', 'inhome-rug', 'Area Rug (up to 5x8)', 'item', 1),
  ('inhome-rug-large', 'inhome-rug', 'Area Rug (5x8 to 8x10)', 'item', 2),
  ('inhome-rug-xl', 'inhome-rug', 'Area Rug (over 8x10)', 'item', 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO service_levels (id, item_id, name, label, price_per_unit, display_order) VALUES
  ('inhome-rug-clean', 'inhome-rug-item', 'CLEAN', 'Clean', 59.00, 1),
  ('inhome-rug-protect', 'inhome-rug-item', 'PROTECT', 'Protect', 79.00, 2),
  ('inhome-rug-deodorize', 'inhome-rug-item', 'DEODORIZE', 'Deodorize', 69.00, 3),
  ('inhome-rug-large-clean', 'inhome-rug-large', 'CLEAN', 'Clean', 89.00, 1),
  ('inhome-rug-large-protect', 'inhome-rug-large', 'PROTECT', 'Protect', 109.00, 2),
  ('inhome-rug-large-deodorize', 'inhome-rug-large', 'DEODORIZE', 'Deodorize', 99.00, 3),
  ('inhome-rug-xl-clean', 'inhome-rug-xl', 'CLEAN', 'Clean', 119.00, 1),
  ('inhome-rug-xl-protect', 'inhome-rug-xl', 'PROTECT', 'Protect', 139.00, 2),
  ('inhome-rug-xl-deodorize', 'inhome-rug-xl', 'DEODORIZE', 'Deodorize', 129.00, 3)
ON CONFLICT (id) DO NOTHING;

-- OFF-SITE AREA RUG (checkbox)
INSERT INTO service_items (id, category_id, name, unit_type, is_checkbox, display_order) VALUES
  ('offsite-rug-item', 'offsite-rug', 'Check this box to schedule an estimate for off-site cleaning of your fine area rug.', 'item', true, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO service_levels (id, item_id, name, label, price_per_unit, display_order) VALUES
  ('offsite-rug-level', 'offsite-rug-item', 'ADD', 'Add', 0.00, 1)
ON CONFLICT (id) DO NOTHING;

-- LEATHER CLEANING ITEMS
INSERT INTO service_items (id, category_id, name, unit_type, display_order) VALUES
  ('leather-sofa', 'leather', 'Sofa', 'item', 1),
  ('leather-sofa-pe', 'leather', 'Sofa (PE)', 'item', 2),
  ('leather-loveseat', 'leather', 'Loveseat', 'item', 3),
  ('leather-sectional', 'leather', 'Sectional (Over 6ft)', 'item', 4),
  ('leather-loveseat2', 'leather', 'Loveseat (Small)', 'item', 5),
  ('leather-chair', 'leather', 'Chair', 'item', 6),
  ('leather-ottoman', 'leather', 'Ottoman', 'item', 7),
  ('leather-dining-chair', 'leather', 'Dining Room Chair', 'item', 8),
  ('leather-chaise', 'leather', 'Chaise', 'item', 9)
ON CONFLICT (id) DO NOTHING;

INSERT INTO service_levels (id, item_id, name, label, price_per_unit, display_order) VALUES
  ('leather-sofa-clean', 'leather-sofa', 'LEATHER CLEAN', 'Leather Clean', 149.00, 1),
  ('leather-sofa-protect', 'leather-sofa', 'LEATHER PROTECT', 'Leather Protect', 179.00, 2),
  ('leather-sofa-pe-clean', 'leather-sofa-pe', 'LEATHER CLEAN', 'Leather Clean', 169.00, 1),
  ('leather-sofa-pe-protect', 'leather-sofa-pe', 'LEATHER PROTECT', 'Leather Protect', 199.00, 2),
  ('leather-loveseat-clean', 'leather-loveseat', 'LEATHER CLEAN', 'Leather Clean', 119.00, 1),
  ('leather-loveseat-protect', 'leather-loveseat', 'LEATHER PROTECT', 'Leather Protect', 139.00, 2),
  ('leather-sectional-clean', 'leather-sectional', 'LEATHER CLEAN', 'Leather Clean', 249.00, 1),
  ('leather-sectional-protect', 'leather-sectional', 'LEATHER PROTECT', 'Leather Protect', 279.00, 2),
  ('leather-loveseat2-clean', 'leather-loveseat2', 'LEATHER CLEAN', 'Leather Clean', 99.00, 1),
  ('leather-loveseat2-protect', 'leather-loveseat2', 'LEATHER PROTECT', 'Leather Protect', 119.00, 2),
  ('leather-chair-clean', 'leather-chair', 'LEATHER CLEAN', 'Leather Clean', 79.00, 1),
  ('leather-chair-protect', 'leather-chair', 'LEATHER PROTECT', 'Leather Protect', 99.00, 2),
  ('leather-ottoman-clean', 'leather-ottoman', 'LEATHER CLEAN', 'Leather Clean', 59.00, 1),
  ('leather-ottoman-protect', 'leather-ottoman', 'LEATHER PROTECT', 'Leather Protect', 69.00, 2),
  ('leather-dining-chair-clean', 'leather-dining-chair', 'LEATHER CLEAN', 'Leather Clean', 45.00, 1),
  ('leather-dining-chair-protect', 'leather-dining-chair', 'LEATHER PROTECT', 'Leather Protect', 55.00, 2),
  ('leather-chaise-clean', 'leather-chaise', 'LEATHER CLEAN', 'Leather Clean', 99.00, 1),
  ('leather-chaise-protect', 'leather-chaise', 'LEATHER PROTECT', 'Leather Protect', 119.00, 2)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SEED SPECIALS
-- ============================================================
INSERT INTO specials (title, description, badge_text, promo_code, display_order) VALUES
  ('$99.99 Any Service', 'Get any single service for just $99.99', 'SPECIAL', 'SAVE99', 1),
  ('4 Rooms of Carpet Cleaned for $199', 'Professional carpet cleaning for 4 rooms', 'SPECIAL', 'CARPET4', 2),
  ('4 Rooms of Luxury Vinyl Cleaned for $199', 'Professional luxury vinyl cleaning for 4 rooms', 'SPECIAL', 'VINYL4', 3)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED PROMO CODES
-- ============================================================
INSERT INTO promo_codes (code, description, discount_type, discount_value, min_order) VALUES
  ('SAVE99', '$99.99 flat any service', 'fixed', 20.00, 99.99),
  ('CARPET4', '4 rooms carpet $199 deal', 'fixed', 30.00, 199.00),
  ('VINYL4', '4 rooms vinyl $199 deal', 'fixed', 30.00, 199.00),
  ('SAVE10', '10% off entire order', 'percentage', 10.00, 50.00),
  ('SAVE20', '20% off entire order', 'percentage', 20.00, 100.00)
ON CONFLICT (code) DO NOTHING;
