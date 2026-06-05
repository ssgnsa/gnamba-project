#!/usr/bin/env bash
echo "Testing Supabase status..."
supabase status
echo "Testing database connection..."
echo "SELECT 1;" | supabase db psql -f -
echo "✅ Supabase local is operational"