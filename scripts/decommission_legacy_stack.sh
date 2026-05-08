#!/usr/bin/env bash
set -euo pipefail

LEGACY_COMPOSE="/home/soma/docker-compose-production.yml"
BACKUP_DIR="/home/soma/archive/legacy-stack-backup-$(date +%Y%m%d-%H%M%S)"

echo "Preparing legacy stack decommission..."
mkdir -p "$BACKUP_DIR"

for f in \
  /home/soma/start_system.sh \
  /home/soma/global-startup.sh \
  /home/soma/deploy_production.sh \
  /home/soma/docker-compose-production.yml
do
  if [ -f "$f" ]; then
    cp -a "$f" "$BACKUP_DIR"/
  fi
done

if [ -f "$LEGACY_COMPOSE" ]; then
  echo "Stopping legacy docker compose stack (if running)..."
  docker compose -f "$LEGACY_COMPOSE" down --remove-orphans || true
fi

echo
echo "Legacy files backed up to: $BACKUP_DIR"
echo
echo "Root-level legacy service disable (run manually with sudo):"
echo "  sudo systemctl disable --now gnamba.service"
echo "  sudo systemctl daemon-reload"
