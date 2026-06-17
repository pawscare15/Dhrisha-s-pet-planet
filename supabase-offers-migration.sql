-- ============================================================
-- Special Offers Table Migration
-- Run this in Supabase SQL Editor → New Query → Run
-- ============================================================

CREATE TABLE IF NOT EXISTS special_offers (
  id             UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  title          TEXT    NOT NULL,
  tag            TEXT,                          -- badge text e.g. "🌧️ Monsoon Special"
  description    TEXT,                          -- short description
  price          TEXT    NOT NULL,              -- e.g. "₹999"
  original_price TEXT,                          -- e.g. "₹1,500" (for strikethrough)
  features       TEXT,                          -- newline-separated list of included items
  card_color     TEXT    DEFAULT '#F59E0B',     -- hex colour for the card background
  valid_until    DATE,                          -- offer expiry date (nullable)
  is_active      BOOLEAN DEFAULT true,          -- controls public visibility
  display_order  INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE special_offers ENABLE ROW LEVEL SECURITY;

-- Public can read active offers
CREATE POLICY "Public read offers"
  ON special_offers FOR SELECT USING (true);

-- Admin can do everything
CREATE POLICY "Admin manage offers"
  ON special_offers FOR ALL USING (true) WITH CHECK (true);

-- Index for ordering
CREATE INDEX idx_offers_display_order ON special_offers(display_order);
CREATE INDEX idx_offers_is_active     ON special_offers(is_active);
