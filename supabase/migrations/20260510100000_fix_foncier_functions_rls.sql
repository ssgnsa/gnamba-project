-- Fix RLS policies for foncier functions
-- This migration ensures proper RLS policies for RPC functions and related tables

-- Drop existing policies on foncier_attestations table
DROP POLICY IF EXISTS "foncier_attestations_select" ON public.foncier_attestations;
DROP POLICY IF EXISTS "foncier_attestations_insert" ON public.foncier_attestations;
DROP POLICY IF EXISTS "foncier_attestations_update" ON public.foncier_attestations;
DROP POLICY IF EXISTS "foncier_attestations_delete" ON public.foncier_attestations;

-- Enable RLS on foncier_attestations table
ALTER TABLE public.foncier_attestations ENABLE ROW LEVEL SECURITY;

-- Create proper RLS policies for foncier_attestations
-- Allow public read access to attestations (for verification)
CREATE POLICY "foncier_attestations_select" ON public.foncier_attestations
FOR SELECT USING (true);

-- Allow authenticated users to insert attestations
CREATE POLICY "foncier_attestations_insert" ON public.foncier_attestations
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update attestations
CREATE POLICY "foncier_attestations_update" ON public.foncier_attestations
FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete attestations
CREATE POLICY "foncier_attestations_delete" ON public.foncier_attestations
FOR DELETE USING (auth.role() = 'authenticated');

-- Fix RLS policies for foncier_attestation_temoins table
DROP POLICY IF EXISTS "foncier_attestation_temoins_select" ON public.foncier_attestation_temoins;
DROP POLICY IF EXISTS "foncier_attestation_temoins_insert" ON public.foncier_attestation_temoins;
DROP POLICY IF EXISTS "foncier_attestation_temoins_update" ON public.foncier_attestation_temoins;
DROP POLICY IF EXISTS "foncier_attestation_temoins_delete" ON public.foncier_attestation_temoins;

-- Enable RLS on foncier_attestation_temoins table
ALTER TABLE public.foncier_attestation_temoins ENABLE ROW LEVEL SECURITY;

-- Create proper RLS policies for foncier_attestation_temoins
CREATE POLICY "foncier_attestation_temoins_select" ON public.foncier_attestation_temoins
FOR SELECT USING (true);

CREATE POLICY "foncier_attestation_temoins_insert" ON public.foncier_attestation_temoins
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "foncier_attestation_temoins_update" ON public.foncier_attestation_temoins
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "foncier_attestation_temoins_delete" ON public.foncier_attestation_temoins
FOR DELETE USING (auth.role() = 'authenticated');

-- Grant necessary permissions for RPC functions
GRANT EXECUTE ON FUNCTION public.foncier_stats_by_village TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_foncier_lots TO authenticated;
-- Note: soft_delete_foncier_lot and restore_foncier_lot already have SECURITY DEFINER
-- No need to grant execute permissions for them
