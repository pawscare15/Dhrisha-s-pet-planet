-- ================================================================
-- Paws Care & Heal Pet Clinic — MASTER SCHEMA
-- Version: 2.0  |  Date: June 2026
-- ================================================================
-- HOW TO USE:
--   1. Go to Supabase Dashboard → SQL Editor → New Query
--   2. Paste this entire file and click "Run"
--   3. All tables, policies, and indexes will be created safely
--      (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS = safe to re-run)
--   4. NO demo/seed data is inserted — all data is real clinic data
--      added through the admin dashboard.
--
-- HOW TO REVERT:
--   If anything goes wrong, run the DROP section below (commented out).
--   To restore the old schema, use supabase-schema.sql (original).
-- ================================================================

-- ================================================================
-- REVERT / ROLLBACK SCRIPT (run ONLY if you want to roll back)
-- ================================================================
-- DROP TABLE IF EXISTS special_offers CASCADE;
-- DROP TABLE IF EXISTS stories CASCADE;
-- DROP TABLE IF EXISTS visits CASCADE;
-- DROP TABLE IF EXISTS pets CASCADE;
-- DROP TABLE IF EXISTS appointments CASCADE;
-- DROP TABLE IF EXISTS services CASCADE;
-- DROP VIEW IF EXISTS due_today;
-- DROP VIEW IF EXISTS due_soon;
-- DROP VIEW IF EXISTS today_appointments;
-- DROP FUNCTION IF EXISTS update_updated_at;
-- ================================================================


-- ── 1. PETS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pets (
  id           UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_name   TEXT    NOT NULL,
  mobile       TEXT    NOT NULL,
  pet_name     TEXT    NOT NULL,
  pet_type     TEXT    NOT NULL DEFAULT 'Dog',
  pet_age      TEXT,
  gender       TEXT    DEFAULT 'Male',
  breed        TEXT    DEFAULT '',
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if table already exists (safe migration)
ALTER TABLE pets ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'Male';
ALTER TABLE pets ADD COLUMN IF NOT EXISTS breed  TEXT DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_pets_mobile   ON pets(mobile);
CREATE INDEX IF NOT EXISTS idx_pets_pet_name ON pets(lower(pet_name));
CREATE INDEX IF NOT EXISTS idx_pets_owner    ON pets(lower(owner_name));

ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "All access pets" ON pets;
CREATE POLICY "All access pets" ON pets FOR ALL USING (true) WITH CHECK (true);


-- ── 2. VISITS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS visits (
  id                  UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id              UUID    NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  visit_date          DATE    NOT NULL DEFAULT CURRENT_DATE,
  complaint           TEXT    DEFAULT '',
  clinical_signs      TEXT    DEFAULT '',
  diagnosis           TEXT    NOT NULL,
  treatment           TEXT    NOT NULL,
  medicines           TEXT,
  next_reminder_date  DATE,
  reminder_message    TEXT,
  reminder_sent       BOOLEAN DEFAULT false,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if table already exists (safe migration)
ALTER TABLE visits ADD COLUMN IF NOT EXISTS complaint       TEXT DEFAULT '';
ALTER TABLE visits ADD COLUMN IF NOT EXISTS clinical_signs  TEXT DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_visits_pet_id        ON visits(pet_id);
CREATE INDEX IF NOT EXISTS idx_visits_reminder_date ON visits(next_reminder_date);
CREATE INDEX IF NOT EXISTS idx_visits_reminder_sent ON visits(reminder_sent);

ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "All access visits" ON visits;
CREATE POLICY "All access visits" ON visits FOR ALL USING (true) WITH CHECK (true);


-- ── 3. APPOINTMENTS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id              UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_name      TEXT    NOT NULL,
  mobile          TEXT    NOT NULL,
  email           TEXT,
  pet_name        TEXT    NOT NULL,
  pet_type        TEXT    DEFAULT 'Dog',
  pet_age         TEXT,
  problem         TEXT,
  preferred_date  DATE,
  preferred_time  TEXT,
  status          TEXT    DEFAULT 'pending'
                  CHECK (status IN ('pending','confirmed','done','cancelled')),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appts_date   ON appointments(preferred_date);
CREATE INDEX IF NOT EXISTS idx_appts_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appts_mobile ON appointments(mobile);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public insert appts" ON appointments;
DROP POLICY IF EXISTS "Admin read appts"    ON appointments;
DROP POLICY IF EXISTS "Admin update appts"  ON appointments;
CREATE POLICY "Public insert appts" ON appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin read appts"    ON appointments FOR SELECT USING (true);
CREATE POLICY "Admin update appts"  ON appointments FOR UPDATE USING (true);


-- ── 4. SUCCESS STORIES ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stories (
  id            UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_name      TEXT    NOT NULL,
  pet_type      TEXT    DEFAULT 'Dog',
  owner_name    TEXT,
  problem_tags  TEXT[],
  story         TEXT    NOT NULL,
  rating        INTEGER DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  bg_color      TEXT    DEFAULT '#F5A623',
  image_url     TEXT    DEFAULT '',      -- URL from Supabase Storage or data URL
  is_featured   BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Add image_url if table already exists (fixes "column not found" error)
ALTER TABLE stories ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '';

ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read stories"   ON stories;
DROP POLICY IF EXISTS "Admin manage stories"  ON stories;
CREATE POLICY "Public read stories"  ON stories FOR SELECT USING (true);
CREATE POLICY "Admin manage stories" ON stories FOR ALL USING (true) WITH CHECK (true);


-- ── 5. SPECIAL OFFERS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS special_offers (
  id             UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  title          TEXT    NOT NULL,
  tag            TEXT,                         -- badge e.g. "🌧️ Monsoon Special"
  description    TEXT,
  price          TEXT    NOT NULL,             -- e.g. "₹999"
  original_price TEXT,                         -- e.g. "₹1,500" (strikethrough)
  features       TEXT,                         -- newline-separated list
  card_color     TEXT    DEFAULT '#F59E0B',
  valid_until    DATE,                         -- nullable expiry
  is_active      BOOLEAN DEFAULT true,
  display_order  INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offers_display_order ON special_offers(display_order);
CREATE INDEX IF NOT EXISTS idx_offers_is_active     ON special_offers(is_active);

ALTER TABLE special_offers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read offers"    ON special_offers;
DROP POLICY IF EXISTS "Admin manage offers"   ON special_offers;
CREATE POLICY "Public read offers"   ON special_offers FOR SELECT USING (true);
CREATE POLICY "Admin manage offers"  ON special_offers FOR ALL USING (true) WITH CHECK (true);


-- ── 6. USEFUL VIEWS ──────────────────────────────────────────────
-- Views hold NO data — dropping and recreating is always safe.
-- We drop first to avoid the "cannot change name of view column" error
-- that occurs when underlying tables gain new columns.
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


-- ── 7. AUTO-UPDATE TIMESTAMP TRIGGER ─────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pets_updated_at ON pets;
CREATE TRIGGER pets_updated_at
  BEFORE UPDATE ON pets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ── 8. VERIFY (run these to confirm everything worked) ────────────
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'pets'    ORDER BY ordinal_position;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'visits'  ORDER BY ordinal_position;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'stories' ORDER BY ordinal_position;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'special_offers' ORDER BY ordinal_position;
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public';

-- ================================================================
-- END OF MASTER SCHEMA
-- ================================================================
