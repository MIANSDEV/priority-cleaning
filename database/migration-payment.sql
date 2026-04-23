-- Add payment fields to bookings table
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash'
    CHECK (payment_method IN ('stripe', 'cash', 'card')),
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid'
    CHECK (payment_status IN ('paid', 'unpaid', 'pending')),
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
