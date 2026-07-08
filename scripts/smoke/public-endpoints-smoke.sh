#!/usr/bin/env bash
set -euo pipefail

# Smoke-test public Supabase REST endpoints for anonymous access.
# Usage: SUPABASE_URL=... SUPABASE_ANON_KEY=... ./public-endpoints-smoke.sh
# If env vars are not set, the script will try to source a .env file in repo root
# and use VITE_SUPABASE_LOCAL_URL / VITE_SUPABASE_URL and corresponding anon keys.

ROOT_DIR=$(cd "$(dirname "$0")/../.." && pwd)

if [ -z "${SUPABASE_URL:-}" ] || [ -z "${SUPABASE_ANON_KEY:-}" ]; then
  if [ -f "$ROOT_DIR/.env" ]; then
    # shellcheck disable=SC1090
    set -a
    # load only simple KEY=VALUE lines (ignore exports and quotes handled by shell)
    # Use a subshell to avoid leaking into caller environment unexpectedly
    ( . "$ROOT_DIR/.env" )
    set +a
  fi
  : "${SUPABASE_URL:=${VITE_SUPABASE_LOCAL_URL:-${VITE_SUPABASE_URL:-}}}"
  : "${SUPABASE_ANON_KEY:=${VITE_SUPABASE_LOCAL_ANON_KEY:-${VITE_SUPABASE_ANON_KEY:-}}}"
fi

if [ -z "${SUPABASE_URL:-}" ] || [ -z "${SUPABASE_ANON_KEY:-}" ]; then
  echo "ERROR: SUPABASE_URL and SUPABASE_ANON_KEY must be provided via environment or .env" >&2
  echo "Example: SUPABASE_URL=https://api.gnambaservices.ci SUPABASE_ANON_KEY=sb_xxx $0" >&2
  exit 2
fi

ENDPOINTS=(
  "/rest/v1/app_settings?select=key,value"
  "/rest/v1/page_layouts?select=layout_json,page_slug,is_published"
  "/rest/v1/site_content?select=section,key,value"
  "/rest/v1/site_realisations?select=id,title,description,category,year,location,image_url"
  "/rest/v1/vitrine_lots?select=*&publier_sur_vitrine=eq.true"
)

FAIL=0

echo "Running public endpoints smoke-test against: $SUPABASE_URL"

for path in "${ENDPOINTS[@]}"; do
  url="$SUPABASE_URL$path"
  echo -n "- Testing $path ... "
  # fetch with headers, capture HTTP code and body
  http_code=$(curl -sS -w "%{http_code}" -o /tmp/smoke_body.$$ \
    -H "apikey: $SUPABASE_ANON_KEY" \
    -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
    "$url" || true)

  if [ "$http_code" != "200" ]; then
    echo "FAIL (http=$http_code)"
    cat /tmp/smoke_body.$$
    FAIL=1
    continue
  fi

  # validate JSON using python (available on most systems)
  if ! python3 -c 'import sys, json; json.load(sys.stdin)' < /tmp/smoke_body.$$ >/dev/null 2>&1; then
    echo "FAIL (invalid JSON)"
    cat /tmp/smoke_body.$$
    FAIL=1
    continue
  fi

  echo "OK"
done

rm -f /tmp/smoke_body.$$ || true

if [ "$FAIL" -ne 0 ]; then
  echo "One or more smoke tests failed." >&2
  exit 3
fi

echo "All smoke tests passed."
exit 0
