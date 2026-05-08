-- ============================================
-- Migration: Fix crop_cycles.status default + add updated_at triggers
-- ============================================
-- Date: 2026-04-05
-- ============================================

BEGIN;

-- 1. Fix crop_cycles.status default to match TypeScript type
-- Current default is 'active' which is NOT in the type union:
-- 'planned' | 'growing' | 'harvested' | 'failed'
ALTER TABLE crop_cycles ALTER COLUMN status SET DEFAULT 'planned';

-- Fix any existing rows with 'active' status
UPDATE crop_cycles SET status = 'growing' WHERE status = 'active';

-- 2. Add updated_at column and triggers to tables that lack them
-- Tables missing updated_at: animals, health_records, lots, fields,
-- crop_interventions, harvests, buildings, equipment, construction_projects,
-- inventory_items, inventory_categories, customers, sales

DO $$
DECLARE
  tbl TEXT;
  tables_to_update TEXT[] := ARRAY[
    'animals', 'health_records', 'lots', 'fields',
    'crop_interventions', 'harvests', 'buildings', 'equipment',
    'construction_projects', 'inventory_items', 'inventory_categories',
    'customers', 'sales', 'sale_items', 'tasks'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables_to_update
  LOOP
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = tbl AND column_name = 'updated_at'
    ) THEN
      EXECUTE format('ALTER TABLE %I ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW()', tbl);
    END IF;

    -- Create trigger function if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_proc WHERE proname = format('update_%I_updated_at', tbl)
    ) THEN
      EXECUTE format(
        'CREATE OR REPLACE FUNCTION update_%I_updated_at() RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql',
        tbl
      );

      -- Create trigger
      EXECUTE format(
        'DROP TRIGGER IF EXISTS set_updated_at ON %I;
         CREATE TRIGGER set_updated_at
           BEFORE UPDATE ON %I
           FOR EACH ROW
           EXECUTE FUNCTION update_%I_updated_at()',
        tbl, tbl, tbl
      );
    END IF;
  END LOOP;
END $$;

COMMIT;
