-- ============================================================
-- TIME WINDOWS TABLE MIGRATION
-- Run this in your Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS time_windows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE time_windows ENABLE ROW LEVEL SECURITY;

-- Public can read active time windows (for booking form)
CREATE POLICY "Public read active time windows" ON time_windows
  FOR SELECT USING (is_active = true);

-- Service role (admin API) has full access
CREATE POLICY "Service role full access time windows" ON time_windows
  USING (auth.role() = 'service_role');

-- Seed default windows
INSERT INTO time_windows (label, display_order) VALUES
  ('8AM-12PM', 1),
  ('11AM-2PM', 2),
  ('1PM-4PM',  3),
  ('3PM-6PM',  4)
ON CONFLICT (label) DO NOTHING;
