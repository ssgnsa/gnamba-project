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
  $0 --html dist-local/index.html
  $0 --html dist-local/index.html --url https://gnambaservices.ci/ --url https://www.gnambaservices.ci/
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
    "$ROOT_DIR/dist-local/index.html" \
    "$ROOT_DIR/dist/index.html"; do
    if [[ -f "$candidate" ]]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done

  log_error "No built index.html found in dist-local/ or dist/"
  return 1
}

HTML_PATH="$(find_html)"
HTML_CONTENT="$(cat "$HTML_PATH")"

log_info "Validating build artifact: $HTML_PATH"

if ! grep -q '/assets/index\.js?v=' <<<"$HTML_CONTENT"; then
  log_error "index.html does not reference a versioned /assets/index.js"
  exit 1
fi

if ! grep -q '/assets/index\.css?v=' <<<"$HTML_CONTENT"; then
  log_error "index.html does not reference a versioned /assets/index.css"
  exit 1
fi

if grep -q '/assets/index\.js"' <<<"$HTML_CONTENT" || grep -q '/assets/index\.css"' <<<"$HTML_CONTENT"; then
  log_error "Unversioned index assets still present in index.html"
  exit 1
fi

if ! grep -q 'id="root"' <<<"$HTML_CONTENT"; then
  log_error "#root mount point missing from index.html"
  exit 1
fi

VERSION_QUERY="$(grep -o '/assets/index\.js?v=[^"[:space:]]*' <<<"$HTML_CONTENT" | head -n1 | sed 's#.*?v=##')"
if [[ -z "$VERSION_QUERY" ]]; then
  log_error "Could not extract build version from index.html"
  exit 1
fi

log_ok "Build artifact contains versioned assets: v=$VERSION_QUERY"

if [[ "$STRICT" -eq 1 ]]; then
  html_size=$(wc -c < "$HTML_PATH")
  if [[ "$html_size" -lt 1500 ]]; then
    log_warn "index.html is unusually small (${html_size} bytes)"
  fi
fi

check_url() {
  local url="$1"
  local tmp_body tmp_headers code content_type cache_control
  tmp_body="$(mktemp)"
  tmp_headers="$(mktemp)"

  if ! curl -sS --max-time 30 -D "$tmp_headers" -o "$tmp_body" "$url" >/dev/null; then
    log_error "Failed to fetch $url"
    rm -f "$tmp_body" "$tmp_headers"
    return 1
  fi

  code="$(awk 'NR==1 {print $2}' "$tmp_headers")"
  cache_control="$(awk -F': ' 'BEGIN{IGNORECASE=1} /^Cache-Control:/{print $2; exit}' "$tmp_headers")"
  content_type="$(awk -F': ' 'BEGIN{IGNORECASE=1} /^Content-Type:/{print $2; exit}' "$tmp_headers")"

  log_info "$url -> HTTP $code | Cache-Control: ${cache_control:-<none>}"

  case "$code" in
    200) ;;
    *)
      log_error "$url returned HTTP $code"
      rm -f "$tmp_body" "$tmp_headers"
      return 1
      ;;
  esac

  if [[ "$url" == *"/assets/index.js"* || "$url" == *"/assets/index.css"* ]]; then
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
  else
    if [[ "$cache_control" != *"max-age=300"* ]]; then
      log_error "$url does not expose the short HTML cache window"
      rm -f "$tmp_body" "$tmp_headers"
      return 1
    fi
  fi

  if [[ "$url" == */ ]]; then
    if ! grep -q 'id="root"' "$tmp_body"; then
      log_error "$url does not contain the React mount point"
      rm -f "$tmp_body" "$tmp_headers"
      return 1
    fi
    if ! grep -q "/assets/index.js?v=$VERSION_QUERY" "$tmp_body"; then
      log_error "$url does not reference the current versioned JS bundle"
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
