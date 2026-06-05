#!/usr/bin/env bash
cd /home/soma/gnamba-project/supabase/migrations
mv 20260430090000_create_atomic_attestation_generation.sql.skip 20260430090000_create_atomic_attestation_generation.sql 2>/dev/null || echo "File already renamed or not found"
mv 20260503084300_add_attestation_pdf_metadata.sql.skip 20260503084300_add_attestation_pdf_metadata.sql 2>/dev/null || echo "File already renamed or not found"
mv 20260508100000_fix_foncier_standalone.sql.skip 20260508100000_fix_foncier_standalone.sql 2>/dev/null || echo "File already renamed or not found"
echo "✅ Migrations reactivated"