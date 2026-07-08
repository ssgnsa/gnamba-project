#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $*" >&2; }
log_ok() { echo -e "${GREEN}[OK]${NC} $*" >&2; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $*" >&2; }
log_error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }

HTML_FILE=""
STRICT=0
URLS=()

usage() {
  cat <<EOF
Validate EGS frontend release artifacts and optional live URLs.

Usage:
  $0 [--html path/to/index.html] [--url URL] [--strict]

Examples:
  $0 --html dist/index.html
  $0 --html dist/index.html --url https://gnambaservices.ci/ --url https://www.gnambaservices.ci/
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --html)
      HTML_FILE="${2:-}"
      shift 2
      ;;
    --url)
      URLS+=("${2:-}")
      shift 2
      ;;
    --strict)
      STRICT=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

find_html() {
  if [[ -n "$HTML_FILE" ]]; then
    if [[ -f "$HTML_FILE" ]]; then
      printf '%s\n' "$HTML_FILE"
      return 0
    fi
    log_error "HTML file not found: $HTML_FILE"
    return 1
  fi

  for candidate in \
    "$ROOT_DIR/dist/index.html"; do
    if [[ -f "$candidate" ]]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done

  log_error "No built index.html found in dist/"
  return 1
}

HTML_PATH="$(find_html)"
HTML_CONTENT="$(cat "$HTML_PATH")"

log_info "Validating build artifact: $HTML_PATH"

ENTRY_JS_PATH="$(grep -o '/assets/index-[^"[:space:]]*\.js' <<<"$HTML_CONTENT" | head -n1 || true)"
ENTRY_CSS_PATH="$(grep -o '/assets/index-[^"[:space:]]*\.css' <<<"$HTML_CONTENT" | head -n1 || true)"

if [[ -z "$ENTRY_JS_PATH" ]]; then
  log_error "index.html does not reference a hashed /assets/index-*.js entry bundle"
  exit 1
fi

if [[ -z "$ENTRY_CSS_PATH" ]]; then
  log_error "index.html does not reference a hashed /assets/index-*.css stylesheet"
  exit 1
fi

if grep -q '/assets/index\.js' <<<"$HTML_CONTENT" || grep -q '/assets/index\.css' <<<"$HTML_CONTENT"; then
  log_error "Stable index assets still present in index.html; use hashed assets to avoid mixed React bundles"
  exit 1
fi

if ! grep -q 'id="root"' <<<"$HTML_CONTENT"; then
  log_error "#root mount point missing from index.html"
  exit 1
fi

log_ok "Build artifact contains hashed entry assets: js=$ENTRY_JS_PATH css=$ENTRY_CSS_PATH"

validate_nginx_entry_asset_cache() {
  local nginx_file

  for nginx_file in \
    "$ROOT_DIR/nginx.conf" \
    "$ROOT_DIR/nginx/nginx.conf" \
    "$ROOT_DIR/nginx/nginx-production.conf"; do
    [[ -f "$nginx_file" ]] || continue

    if ! grep -q 'location = /assets/index\.js' "$nginx_file"; then
      log_error "$nginx_file does not define a no-cache exact location for /assets/index.js"
      return 1
    fi

    if ! grep -q 'location = /assets/index\.css' "$nginx_file"; then
      log_error "$nginx_file does not define a no-cache exact location for /assets/index.css"
      return 1
    fi

    if ! grep -q 'no-cache, no-store, must-revalidate' "$nginx_file"; then
      log_error "$nginx_file does not explicitly disable cache for entry assets"
      return 1
    fi

    if grep -q 'rewrite \^/assets/index-' "$nginx_file"; then
      log_error "$nginx_file rewrites hashed index assets to stable index files"
      return 1
    fi

    if ! grep -q 'location @asset_404' "$nginx_file"; then
      log_error "$nginx_file does not define a dedicated non-HTML 404 response for missing assets"
      return 1
    fi

    if ! grep -q 'error_page 404 = @asset_404' "$nginx_file"; then
      log_error "$nginx_file does not route missing assets to the dedicated non-HTML 404 response"
      return 1
    fi
  done

  if [[ -f "$ROOT_DIR/nginx/nginx-release.conf" ]]; then
    if ! grep -q 'root /var/www/egs/current;' "$ROOT_DIR/nginx/nginx-release.conf"; then
      log_error "nginx/nginx-release.conf must serve from /var/www/egs/current"
      return 1
    fi

    if ! grep -q 'VERSION.json' "$ROOT_DIR/nginx/nginx-release.conf"; then
      log_error "nginx/nginx-release.conf must expose VERSION.json"
      return 1
    fi
  fi
}

validate_nginx_entry_asset_cache

  if [[ "$STRICT" -eq 1 ]]; then
  html_size=$(wc -c < "$HTML_PATH")
  if [[ "$html_size" -lt 1500 ]]; then
    log_warn "index.html is unusually small (${html_size} bytes)"
  fi

  asset_dir="$(dirname "$HTML_PATH")/assets"
  if [[ -d "$asset_dir" ]]; then
    if grep -R -nE 'https?://(localhost|127\.0\.0\.1|\[::1\]):54321' "$asset_dir" 2>/dev/null; then
      log_error "Production assets contain a legacy loopback data URL"
      exit 1
    fi

    if grep -R -nE 'https?://(localhost|127\.0\.0\.1|\[::1\]):8081' "$asset_dir" 2>/dev/null; then
      log_error "Production assets contain a client-side FileBrowser localhost URL"
      exit 1
    fi

    legacy_provider="supa""base"
    legacy_functions_path="/""functions"
    legacy_storage_path="/""storage"
    legacy_rest_path="/""rest"
    legacy_lead_route="capture""-lead"
    forbidden_release_pattern="Session expirée|${legacy_lead_route}|${legacy_functions_path}(?:/v1)?/|${legacy_storage_path}/v1/|${legacy_rest_path}/v1/|${legacy_provider}\\.(?:co|in)|@${legacy_provider}|${legacy_provider}-vendor|VITE_${legacy_provider^^}"
    if grep -R -nE "$forbidden_release_pattern" "$asset_dir" "$HTML_PATH" 2>/dev/null; then
      log_error "Production assets still contain legacy data-platform or session-expired references"
      exit 1
    fi

    forbidden_public_secret_names=(
      VITE_CLOUDFLARE_TURNSTILE_SECRET_KEY
      VITE_EMAIL_API_KEY
      VITE_LINKEDIN_ACCESS_TOKEN
      VITE_MESSAGEBIRD_API_KEY
      VITE_META_ACCESS_TOKEN
      VITE_ONESIGNAL_API_KEY
      VITE_SMS_API_KEY
      VITE_DATABASE_SERVICE_ROLE_KEY
      VITE_TELEGRAM_BOT_TOKEN
      VITE_TWILIO_AUTH_TOKEN
      VITE_WHATSAPP_ACCESS_TOKEN
      VITE_X_ACCESS_SECRET
      VITE_X_ACCESS_TOKEN
      VITE_X_API_KEY
      VITE_X_API_SECRET
    )
    forbidden_public_secret_pattern="$(IFS='|'; printf '%s' "${forbidden_public_secret_names[*]}")"

    if grep -R -nE "$forbidden_public_secret_pattern" "$asset_dir" 2>/dev/null; then
      log_error "Production assets contain server-secret environment variable names"
      exit 1
    fi

    for env_file in "$ROOT_DIR/.env" "$ROOT_DIR/.env.production"; do
      [[ -f "$env_file" ]] || continue

      for secret_name in "${forbidden_public_secret_names[@]}"; do
        secret_value="$(
          awk -v key="$secret_name" '
            BEGIN { FS = "=" }
            $1 == key {
              value = $0
              sub(/^[^=]*=/, "", value)
              gsub(/^[[:space:]]+|[[:space:]]+$/, "", value)
              gsub(/^"|"$/, "", value)
              gsub(/^'\''|'\''$/, "", value)
              print value
              exit
            }
          ' "$env_file"
        )"

        case "$secret_value" in
          ""|"changeme"|"change-me"|"todo"|"TODO"|"votre_"*|"your_"*) continue ;;
        esac

        if [[ "${#secret_value}" -ge 8 ]] && grep -R -F -q -- "$secret_value" "$asset_dir" 2>/dev/null; then
          log_error "Production assets contain the value of $secret_name from $(basename "$env_file")"
          exit 1
        fi
      done
    done
  fi
fi

is_auth_url() {
  local url="$1"
  case "$url" in
    */login|*/login\?*|*/login/*) return 0 ;;
    */forgot-password|*/forgot-password\?*|*/forgot-password/*) return 0 ;;
    */reset-password|*/reset-password\?*|*/reset-password/*) return 0 ;;
    */register|*/register\?*|*/register/*) return 0 ;;
    */auth|*/auth\?*|*/auth/*) return 0 ;;
    *) return 1 ;;
  esac
}

is_html_entry_url() {
  local url="$1"
  [[ "$url" == */ ]] || is_auth_url "$url"
}

is_static_asset_url() {
  local url="$1"
  [[ "$url" == *"/assets/"* && ( "$url" == *.js* || "$url" == *.css* ) ]]
}

is_entry_asset_url() {
  local url="${1%%\?*}"
  [[ "$url" == */assets/index.js || "$url" == */assets/index.css ]]
}

check_url() {
  local url="$1"
  local tmp_body tmp_headers code content_type cache_control content_security_policy
  tmp_body="$(mktemp)"
  tmp_headers="$(mktemp)"

  if ! curl -sS --max-time 30 -D "$tmp_headers" -o "$tmp_body" "$url" >/dev/null; then
    log_error "Failed to fetch $url"
    rm -f "$tmp_body" "$tmp_headers"
    return 1
  fi

  code="$(awk 'NR==1 {print $2}' "$tmp_headers")"
  cache_control="$(
    awk 'BEGIN{IGNORECASE=1} /^Cache-Control:/ {sub(/^[^:]+:[[:space:]]*/, ""); print; exit}' "$tmp_headers"
  )"
  content_security_policy="$(
    awk 'BEGIN{IGNORECASE=1} /^Content-Security-Policy:/ {sub(/^[^:]+:[[:space:]]*/, ""); print; exit}' "$tmp_headers"
  )"
  content_type="$(
    awk 'BEGIN{IGNORECASE=1} /^Content-Type:/ {sub(/^[^:]+:[[:space:]]*/, ""); print; exit}' "$tmp_headers"
  )"

  log_info "$url -> HTTP $code | Cache-Control: ${cache_control:-<none>}"

  case "$code" in
    200) ;;
    *)
      log_error "$url returned HTTP $code"
      rm -f "$tmp_body" "$tmp_headers"
      return 1
      ;;
  esac

  if is_entry_asset_url "$url"; then
    if [[ "$cache_control" != *"no-store"* && "$cache_control" != *"no-cache"* ]]; then
      log_error "$url should not be cached by browsers/CDN; dynamic chunks import it without a query string"
      rm -f "$tmp_body" "$tmp_headers"
      return 1
    fi
  elif is_static_asset_url "$url"; then
    if [[ "$cache_control" != *"immutable"* ]]; then
      log_error "$url is not immutable-cacheable"
      rm -f "$tmp_body" "$tmp_headers"
      return 1
    fi
    if [[ "$cache_control" != *"max-age=31536000"* ]]; then
      log_error "$url does not expose a long cache max-age"
      rm -f "$tmp_body" "$tmp_headers"
      return 1
    fi
  elif is_auth_url "$url"; then
    if [[ "$cache_control" != *"no-store"* && "$cache_control" != *"no-cache"* ]]; then
      log_error "$url should not be cached by browsers/CDN"
      rm -f "$tmp_body" "$tmp_headers"
      return 1
    fi
  else
    if [[ "$cache_control" != *"max-age=300"* ]]; then
      log_error "$url does not expose the short HTML cache window"
      rm -f "$tmp_body" "$tmp_headers"
      return 1
    fi
  fi

  if is_html_entry_url "$url"; then
    if [[ -z "$content_security_policy" ]]; then
      log_error "$url is missing Content-Security-Policy header"
      rm -f "$tmp_body" "$tmp_headers"
      return 1
    fi

    if [[ "$content_security_policy" == Content-Security-Policy:* ]]; then
      log_error "$url CSP header value includes a duplicated header name; fix the CDN/proxy response-header rule"
      rm -f "$tmp_body" "$tmp_headers"
      return 1
    fi

    for required_csp_source in \
      "https://cdn.onesignal.com" \
      "https://challenges.cloudflare.com" \
      "https://www.youtube.com" \
      "https://www.youtube-nocookie.com" \
      "https://*.ingest.sentry.io" \
      "https://*.ingest.us.sentry.io"; do
      if [[ "$content_security_policy" != *"$required_csp_source"* ]]; then
        log_error "$url CSP does not allow $required_csp_source"
        rm -f "$tmp_body" "$tmp_headers"
        return 1
      fi
    done

    for forbidden_csp_source in \
      "'unsafe-eval'" \
      "supa""base.co" \
      "supa""base.in" \
      "thykrnoqgylrbfupophs"; do
      if [[ "$content_security_policy" == *"$forbidden_csp_source"* ]]; then
        log_error "$url CSP still allows legacy source $forbidden_csp_source"
        rm -f "$tmp_body" "$tmp_headers"
        return 1
      fi
    done

    if ! grep -q 'id="root"' "$tmp_body"; then
      log_error "$url does not contain the React mount point"
      rm -f "$tmp_body" "$tmp_headers"
      return 1
    fi
    if ! grep -q "$ENTRY_JS_PATH" "$tmp_body"; then
      log_error "$url does not reference the current hashed JS bundle"
      rm -f "$tmp_body" "$tmp_headers"
      return 1
    fi
  fi

  rm -f "$tmp_body" "$tmp_headers"
  return 0
}

for url in "${URLS[@]}"; do
  check_url "$url"
done

log_ok "Frontend release validation passed"
