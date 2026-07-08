#!/bin/bash
set -e

cd /home/soma/gnamba-project

echo "=== Current Environment Variables ==="
grep "^VITE_SUPABASE" .env

echo -e "\n=== Checking resolved values ==="
echo "VITE_SUPABASE_MODE: ${VITE_SUPABASE_MODE:-local}"
echo "VITE_SUPABASE_LOCAL_URL: ${VITE_SUPABASE_LOCAL_URL:-}"
echo "VITE_SUPABASE_URL: ${VITE_SUPABASE_URL:-}"

echo -e "\n=== Running npm build ==="
npm run build 2>&1 | tail -20

echo -e "\n=== Checking dist for Supabase URLs ==="
grep -r "localhost:54321\|api.gnambaservices.ci" dist/ 2>/dev/null | head -5 || echo "No hardcoded URLs found in dist"

echo -e "\n=== Build complete ==="
