#!/usr/bin/env bash
set -euo pipefail

# Deploy helper for Cloudflare Tunnel (non-destructive; prompts before sudo actions)
# Usage: ./scripts/deploy-cloudflared-tunnel.sh [--name GNAMBA_TUNNEL] [--no-dns] [--enable-systemd]

TUNNEL_NAME="gnamba-tunnel"
SKIP_DNS=0
ENABLE_SYSTEMD=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --name) TUNNEL_NAME="$2"; shift 2;;
    --no-dns) SKIP_DNS=1; shift 1;;
    --enable-systemd) ENABLE_SYSTEMD=1; shift 1;;
    --help) echo "Usage: $0 [--name <name>] [--no-dns] [--enable-systemd]"; exit 0;;
    *) echo "Unknown arg: $1" >&2; exit 2;;
  esac
done

if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
  echo "CLOUDFLARE_API_TOKEN must be exported in the environment before running this script." >&2
  echo "Example: export CLOUDFLARE_API_TOKEN=\"a76a1e98811712e150ad3aefdc165d00\"" >&2
  exit 3
fi

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "cloudflared not found in PATH. Install it first: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/" >&2
  exit 4
fi

echo "Using tunnel name: ${TUNNEL_NAME}"

# Create tunnel if none exists with that name
echo "Creating tunnel (this will output the created tunnel ID and write credentials to ~/.cloudflared/)"
CREATE_OUT=$(cloudflared tunnel create "${TUNNEL_NAME}" 2>&1 || true)
echo "$CREATE_OUT"

# Extract UUID from output
TUNNEL_ID=$(echo "$CREATE_OUT" | grep -oE '[0-9a-fA-F-]{36}' | head -n1 || true)
if [ -z "$TUNNEL_ID" ]; then
  echo "Could not parse tunnel ID from cloudflared output. You may already have a tunnel created."
  echo "Looking for existing credentials files in ~/.cloudflared/"
  CANDIDATE=$(ls -1 ~/.cloudflared/*.json 2>/dev/null | head -n1 || true)
  if [ -n "$CANDIDATE" ]; then
    echo "Found credential file: $CANDIDATE"
    TUNNEL_ID=$(basename "$CANDIDATE" .json)
  fi
fi

if [ -z "$TUNNEL_ID" ]; then
  echo "ERROR: unable to determine tunnel ID. Aborting." >&2
  exit 5
fi

echo "Tunnel ID: $TUNNEL_ID"

# Ensure /etc/cloudflared exists and move credentials there
CRED_SRC="$HOME/.cloudflared/${TUNNEL_ID}.json"
CRED_DST="/etc/cloudflared/${TUNNEL_ID}.json"
if [ ! -f "$CRED_SRC" ]; then
  echo "Credential file not found at $CRED_SRC. Aborting." >&2
  exit 6
fi

echo "About to copy credentials to ${CRED_DST} (requires sudo). Continue? [y/N]"
read -r REPLY
if [[ "$REPLY" =~ ^[Yy]$ ]]; then
  sudo mkdir -p /etc/cloudflared
  sudo cp "$CRED_SRC" "$CRED_DST"
  sudo chown root:root "$CRED_DST"
  sudo chmod 600 "$CRED_DST"
  echo "Credentials copied."
else
  echo "Aborted by user."; exit 7
fi

# Generate config.yml from example (if not exists)
CFG_DST="/etc/cloudflared/config.yml"
if [ -f "$CFG_DST" ]; then
  echo "Config $CFG_DST already exists; skipping generation."
else
  echo "Generating $CFG_DST from repo example (requires sudo)"
  sudo cp cloudflared/config.yml.example "$CFG_DST"
  sudo sed -i "s/<TUNNEL_ID>/${TUNNEL_ID}/g" "$CFG_DST"
  sudo sed -i "s@/etc/cloudflared/<TUNNEL_ID>.json@/etc/cloudflared/${TUNNEL_ID}.json@g" "$CFG_DST" || true
  echo "Config generated at $CFG_DST"
fi

# Create DNS records via repo helper unless skipped
TUNNEL_TARGET="${TUNNEL_ID}.cfargotunnel.com"
export CLOUDFLARE_TUNNEL_TARGET="$TUNNEL_TARGET"
echo "Set CLOUDFLARE_TUNNEL_TARGET=${TUNNEL_TARGET}"

if [ "$SKIP_DNS" -eq 0 ]; then
  echo "Invoking setup-cloudflare-dns.sh to create CNAME records (this will use CLOUDFLARE_API_TOKEN)"
  ./setup-cloudflare-dns.sh
else
  echo "Skipping DNS updates as requested (--no-dns)"
fi

if [ "$ENABLE_SYSTEMD" -eq 1 ]; then
  echo "About to install systemd unit (requires sudo). Continue? [y/N]"
  read -r REPLY2
  if [[ "$REPLY2" =~ ^[Yy]$ ]]; then
    sudo cp cloudflared/cloudflared.service.example /etc/systemd/system/cloudflared.service
    sudo systemctl daemon-reload
    sudo systemctl enable --now cloudflared
    echo "systemd unit installed and service started. Check: sudo systemctl status cloudflared" 
  else
    echo "Skipped systemd install." 
  fi
else
  echo "Systemd install not requested. To enable, re-run with --enable-systemd"
fi

echo "Done. Next: verify with 'cloudflared tunnel list', 'dig +short gnambaservices.ci' and 'curl -I https://gnambaservices.ci/'."
