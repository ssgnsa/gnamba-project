-- ============================================================
-- Fix user_profiles table - add missing email column
-- Date: 2026-04-28
-- Purpose: Add email column to user_profiles table
-- ============================================================

BEGIN;

-- Add email column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'email'
  ) THEN
    RAISE NOTICE 'Adding email column to user_profiles';
    ALTER TABLE public.user_profiles ADD COLUMN email text;
  ELSE
    RAISE NOTICE 'email column already exists in user_profiles';
  END IF;
END $$;

COMMIT;