#!/usr/bin/env bash
# Lightweight runner for cloudflared (development/debug)
# Usage: ./run-cloudflared.sh --tunnel-id <TUNNEL_ID> [--credentials /path/to/creds.json]

set -euo pipefail

TUNNEL_ID=""
CREDENTIALS=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --tunnel-id) TUNNEL_ID="$2"; shift 2;;
    --credentials) CREDENTIALS="$2"; shift 2;;
    --help) echo "Usage: $0 --tunnel-id <id> [--credentials /path/cred.json]"; exit 0;;
    *) echo "Unknown arg $1"; exit 1;;
  esac
done

if [ -z "$TUNNEL_ID" ]; then
  echo "Missing --tunnel-id" >&2
  exit 2
fi

ARGS=(tunnel run --loglevel info "$TUNNEL_ID")
if [ -n "$CREDENTIALS" ]; then
  export TUNNEL_CREDENTIALS="$CREDENTIALS"
fi

echo "Starting cloudflared for tunnel $TUNNEL_ID"
exec cloudflared "${ARGS[@]}"
