#!/usr/bin/env bash
set -euo pipefail

SRC_PATH=${1:-/home/soma/partage-existing}
DEST_PATH=${2:-/home/soma/partage/egs-docs}
BACKUP_PATH=${3:-/home/soma/partage/egs-docs-backup-$(date +%Y%m%d_%H%M%S)}
DRY_RUN=${4:-true}

if [[ ! -d "$SRC_PATH" ]]; then
  echo "Source path does not exist: $SRC_PATH"
  exit 1
fi

if [[ ! -d "$DEST_PATH" ]]; then
  echo "Destination path does not exist. Creating: $DEST_PATH"
  mkdir -p "$DEST_PATH"
fi

if [[ "$DRY_RUN" == "true" ]]; then
  echo "Dry run enabled. No files will be moved."
fi

echo "Source: $SRC_PATH"
echo "Destination: $DEST_PATH"
echo "Backup: $BACKUP_PATH"
echo ""

if [[ "$DRY_RUN" == "true" ]]; then
  rsync -av --progress --delete --backup --backup-dir="$BACKUP_PATH" "$SRC_PATH/" "$DEST_PATH/"
else
  rsync -av --progress --delete --backup --backup-dir="$BACKUP_PATH" "$SRC_PATH/" "$DEST_PATH/"
fi

echo "Migration completed. Review backup at $BACKUP_PATH"

echo "Important: vérifiez les permissions sur $DEST_PATH après migration."
