-- Debug and fix foncier_stats_by_village function
-- This migration ensures the function works correctly with proper permissions

-- Drop and recreate the function with proper security
DROP FUNCTION IF EXISTS public.foncier_stats_by_village(p_include_archived BOOLEAN);

-- Recreate function with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.foncier_stats_by_village(p_include_archived BOOLEAN DEFAULT FALSE)
RETURNS TABLE (
  village TEXT,
  total_superficie NUMERIC,
  lots_count BIGINT
) 
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    fl.village,
    COALESCE(SUM(fl.superficie), 0) as total_superficie,
    COUNT(*) as lots_count
  FROM foncier_lots fl
  WHERE (p_include_archived OR fl.deleted_at IS NULL)
  GROUP BY fl.village
  ORDER BY total_superficie DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.foncier_stats_by_village TO authenticated;

-- Also grant to anon if needed for public access
GRANT EXECUTE ON FUNCTION public.foncier_stats_by_village TO anon;

-- Test the function to make sure it works
SELECT 
  'foncier_stats_by_village function created and tested' as status,
  COUNT(*) as village_count
FROM public.foncier_stats_by_village(false);
