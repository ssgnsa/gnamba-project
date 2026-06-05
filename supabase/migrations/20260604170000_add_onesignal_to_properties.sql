-- Migration: Add OneSignal Player ID to Properties
-- Date: 2026-06-04
-- Purpose: Add onesignal_player_id column to properties table for push notifications

-- Add onesignal_player_id column to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS onesignal_player_id TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_properties_onesignal_player_id 
ON public.properties(onesignal_player_id);

-- Add comment
COMMENT ON COLUMN public.properties.onesignal_player_id IS 'OneSignal player ID for push notifications to property owners';
