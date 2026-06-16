-- ============================================================
-- Paws Care and Heal Pet Clinic — Database Migration
-- Run this in Supabase SQL Editor after code deploy
-- Date: June 2026
-- ============================================================

-- 1. Add gender and breed columns to pets table
ALTER TABLE pets
  ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'Male',
  ADD COLUMN IF NOT EXISTS breed TEXT DEFAULT '';

-- 2. Add complaint and clinical_signs columns to visits table
ALTER TABLE visits
  ADD COLUMN IF NOT EXISTS complaint TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS clinical_signs TEXT DEFAULT '';

-- ============================================================
-- Verify: run these SELECT queries to confirm columns exist
-- ============================================================
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'pets';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'visits';
