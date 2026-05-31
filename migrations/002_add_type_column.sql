-- Migration 002: Add type column to menus table
-- 
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- after the type column migration has been applied.
--
-- This migration:
-- 1. Adds the 'type' column to identify constant vs daily_lunch menus
-- 2. Makes the 'date' column nullable (constant menu has no date)
-- 3. Creates a unique index to ensure only one constant menu exists
-- 4. Creates a unique index to prevent duplicate dates for daily lunch menus
-- 5. Updates existing rows accordingly
-- 6. Cleans up the sentinel date workaround

-- Step 1: Add the type column
ALTER TABLE menus ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'daily_lunch';

-- Step 2: Make date column nullable
ALTER TABLE menus ALTER COLUMN date DROP NOT NULL;

-- Step 3: Create unique index for constant menu (only one row with type='constant')
CREATE UNIQUE INDEX IF NOT EXISTS idx_menus_constant ON menus (type) WHERE type = 'constant';

-- Step 4: Update the sentinel date row to be a proper constant menu
UPDATE menus SET type = 'constant', date = NULL WHERE date = '1970-01-01';

-- Step 5: Update all other existing menus to type = 'daily_lunch'
UPDATE menus SET type = 'daily_lunch' WHERE type IS NULL AND (date IS NOT NULL OR date IS NULL);

-- Step 6: Ensure the constant menu is published
UPDATE menus SET published = TRUE WHERE type = 'constant';

-- Verify
SELECT menu_id, type, date, published FROM menus ORDER BY type, date;
