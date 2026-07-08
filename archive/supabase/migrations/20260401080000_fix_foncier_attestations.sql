/*
  Migration: Fix Foncier Attestations - Add Missing Columns
  Date: 2026-04-01
  Purpose: Add critical missing columns to foncier_attestations table
  
  Run this in Supabase SQL Editor if the diagnostic shows missing columns.
*/

-- Add deleted_at if missing (CRITICAL for sync logic)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'foncier_attestations' 
    AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE public.foncier_attestations 
    ADD COLUMN deleted_at timestamptz;
    RAISE NOTICE 'Added column deleted_at to foncier_attestations';
  ELSE
    RAISE NOTICE 'Column deleted_at already exists';
  END IF;
END $$;

-- Add client_updated_at if missing
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'foncier_attestations' 
    AND column_name = 'client_updated_at'
  ) THEN
    ALTER TABLE public.foncier_attestations 
    ADD COLUMN client_updated_at timestamptz;
    RAISE NOTICE 'Added column client_updated_at to foncier_attestations';
  ELSE
    RAISE NOTICE 'Column client_updated_at already exists';
  END IF;
END $$;

-- Add last_modified_device_id if missing
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'foncier_attestations' 
    AND column_name = 'last_modified_device_id'
  ) THEN
    ALTER TABLE public.foncier_attestations 
    ADD COLUMN last_modified_device_id text;
    RAISE NOTICE 'Added column last_modified_device_id to foncier_attestations';
  ELSE
    RAISE NOTICE 'Column last_modified_device_id already exists';
  END IF;
END $$;

-- Add version if missing
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'foncier_attestations' 
    AND column_name = 'version'
  ) THEN
    ALTER TABLE public.foncier_attestations 
    ADD COLUMN version integer DEFAULT 1;
    RAISE NOTICE 'Added column version to foncier_attestations';
  ELSE
    RAISE NOTICE 'Column version already exists';
  END IF;
END $$;

-- Add date_expiration if missing
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'foncier_attestations' 
    AND column_name = 'date_expiration'
  ) THEN
    ALTER TABLE public.foncier_attestations 
    ADD COLUMN date_expiration timestamptz;
    RAISE NOTICE 'Added column date_expiration to foncier_attestations';
  ELSE
    RAISE NOTICE 'Column date_expiration already exists';
  END IF;
END $$;

-- Add hash_sha256 if missing
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'foncier_attestations' 
    AND column_name = 'hash_sha256'
  ) THEN
    ALTER TABLE public.foncier_attestations 
    ADD COLUMN hash_sha256 text;
    RAISE NOTICE 'Added column hash_sha256 to foncier_attestations';
  ELSE
    RAISE NOTICE 'Column hash_sha256 already exists';
  END IF;
END $$;

-- Add gps_points if missing
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'foncier_attestations' 
    AND column_name = 'gps_points'
  ) THEN
    ALTER TABLE public.foncier_attestations 
    ADD COLUMN gps_points jsonb;
    RAISE NOTICE 'Added column gps_points to foncier_attestations';
  ELSE
    RAISE NOTICE 'Column gps_points already exists';
  END IF;
END $$;

-- Create index on deleted_at if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_foncier_attestations_deleted_at
  ON public.foncier_attestations(deleted_at)
  WHERE deleted_at IS NOT NULL;

-- Verify all columns exist
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'foncier_attestations'
ORDER BY ordinal_position;
