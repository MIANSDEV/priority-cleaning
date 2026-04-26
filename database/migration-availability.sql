-- ============================================================
-- AVAILABILITY SLOTS MIGRATION
-- Run this in your Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS availability_slots (
  date DATE NOT NULL,
  time_window TEXT NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (date, time_window)
);

ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;

-- Public can read available slots (for the booking calendar)
CREATE POLICY "Public read available slots" ON availability_slots
  FOR SELECT USING (is_available = true);

-- Service role (admin API) has full access
CREATE POLICY "Service role full access availability" ON availability_slots
  USING (auth.role() = 'service_role');
