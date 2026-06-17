-- ================================================================
-- Paws Care & Heal — SAFE PATCH SCRIPT
-- Run this in Supabase SQL Editor → New Query → Run
-- ================================================================
-- This script ONLY:
--   1. Adds missing columns (no data loss - ADD COLUMN IF NOT EXISTS)
--   2. Recreates views (views have NO data - safe to drop/recreate)
--   3. Creates special_offers table if it does not exist
-- It does NOT touch any existing data in pets, visits, stories, etc.
-- ================================================================


-- ── STEP 1: Add missing columns to existing tables ────────────────

-- Add gender + breed to pets (safe - IF NOT EXISTS)
ALTER TABLE pets ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'Male';
ALTER TABLE pets ADD COLUMN IF NOT EXISTS breed  TEXT DEFAULT '';

-- Add complaint + clinical_signs to visits (safe - IF NOT EXISTS)
ALTER TABLE visits ADD COLUMN IF NOT EXISTS complaint      TEXT DEFAULT '';
ALTER TABLE visits ADD COLUMN IF NOT EXISTS clinical_signs TEXT DEFAULT '';

-- Add image_url to stories (FIXES the "column not found" error)
ALTER TABLE stories ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '';


-- ── STEP 2: Fix views (views hold NO data - safe to drop/recreate) ─

DROP VIEW IF EXISTS due_today;
CREATE VIEW due_today AS
SELECT v.*, p.owner_name, p.mobile, p.pet_name, p.pet_type
FROM visits v JOIN pets p ON v.pet_id = p.id
WHERE v.next_reminder_date = CURRENT_DATE AND v.reminder_sent = false;

DROP VIEW IF EXISTS due_soon;
CREATE VIEW due_soon AS
SELECT v.*, p.owner_name, p.mobile, p.pet_name, p.pet_type,
       (v.next_reminder_date - CURRENT_DATE) AS days_until
FROM visits v JOIN pets p ON v.pet_id = p.id
WHERE v.next_reminder_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 3
  AND v.reminder_sent = false
ORDER BY v.next_reminder_date;

DROP VIEW IF EXISTS today_appointments;
CREATE VIEW today_appointments AS
SELECT * FROM appointments
WHERE preferred_date = CURRENT_DATE
ORDER BY preferred_time;


-- ── STEP 3: Create special_offers table if it doesn't exist ────────

CREATE TABLE IF NOT EXISTS special_offers (
  id             UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  title          TEXT    NOT NULL,
  tag            TEXT,
  description    TEXT,
  price          TEXT    NOT NULL,
  original_price TEXT,
  features       TEXT,
  card_color     TEXT    DEFAULT '#F59E0B',
  valid_until    DATE,
  is_active      BOOLEAN DEFAULT true,
  display_order  INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offers_display_order ON special_offers(display_order);
CREATE INDEX IF NOT EXISTS idx_offers_is_active     ON special_offers(is_active);

ALTER TABLE special_offers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'special_offers' AND policyname = 'Public read offers'
  ) THEN
    CREATE POLICY "Public read offers"  ON special_offers FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'special_offers' AND policyname = 'Admin manage offers'
  ) THEN
    CREATE POLICY "Admin manage offers" ON special_offers FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;


-- ── STEP 4: Verify everything is correct ───────────────────────────
-- Run these SELECT statements after the script to confirm success:

-- 1. Check stories has image_url:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'stories';

-- 2. Check special_offers table exists:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'special_offers';

-- 3. Check views exist:
-- SELECT table_name FROM information_schema.views WHERE table_schema = 'public';

-- 4. Count your existing data (should not be 0 if you had data):
-- SELECT COUNT(*) FROM pets;
-- SELECT COUNT(*) FROM stories;
-- SELECT COUNT(*) FROM appointments;

-- ================================================================
-- END OF SAFE PATCH
-- ================================================================
