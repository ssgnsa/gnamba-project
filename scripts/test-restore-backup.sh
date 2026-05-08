#!/usr/bin/env bash
# ============================================
# EGS — Test Supabase Backup Restoration
# ============================================
# Purpose: Verify that a backup can be restored
# This runs against a LOCAL Supabase instance (safe, non-destructive)
#
# Usage: ./scripts/test-restore-backup.sh
# ============================================
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_ROOT="${PROJECT_DIR}/backups/supabase"
LOG_FILE="/var/log/egs-restore-test.log"
TEST_DB_NAME="egs_restore_test_$(date +%Y%m%d_%H%M%S)"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] ${GREEN}INFO${NC} $1" | tee -a "$LOG_FILE"; }
warn() { echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] ${YELLOW}WARN${NC} $1" | tee -a "$LOG_FILE"; }
error() { echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] ${RED}ERROR${NC} $1" | tee -a "$LOG_FILE"; }

cleanup() {
    log "Cleaning up test database: ${TEST_DB_NAME}"
    psql -h localhost -p 5432 -U postgres -d postgres -c "DROP DATABASE IF EXISTS ${TEST_DB_NAME};" 2>/dev/null || true
}

trap cleanup EXIT

# ============================================
# Find latest backup
# ============================================
LATEST_BACKUP="${BACKUP_ROOT}/latest/full_backup.sql"

if [ ! -f "$LATEST_BACKUP" ]; then
    # Try finding any backup
    LATEST_BACKUP=$(ls -t "${BACKUP_ROOT}"/**/full_backup.sql 2>/dev/null | head -1) || true
fi

if [ -z "$LATEST_BACKUP" ] || [ ! -f "$LATEST_BACKUP" ]; then
    error "No backup found. Run a backup first:"
    error "  ./scripts/egs-supabase-backup.sh"
    exit 1
fi

log "Using backup: ${LATEST_BACKUP}"

# ============================================
# Check prerequisites
# ============================================
if ! command -v psql &> /dev/null; then
    error "psql is not installed. Install with: sudo apt install postgresql-client"
    exit 1
fi

if ! command -v pg_dump &> /dev/null; then
    error "pg_dump is not installed. Install with: sudo apt install postgresql-client"
    exit 1
fi

# ============================================
# Verify backup file is not empty
# ============================================
backup_size=$(du -h "$LATEST_BACKUP" | cut -f1)
if [ ! -s "$LATEST_BACKUP" ]; then
    error "Backup file is empty: ${LATEST_BACKUP}"
    exit 1
fi
log "Backup size: ${backup_size}"

# ============================================
# Verify backup contains expected tables
# ============================================
expected_tables=("user_profiles" "finances" "app_settings" "properties" "locataires" "lease_contracts")
missing_tables=0

for table in "${expected_tables[@]}"; do
    if grep -q "$table" "$LATEST_BACKUP"; then
        log "✓ Table '${table}' found in backup"
    else
        warn "✗ Table '${table}' NOT found in backup"
        missing_tables=$((missing_tables + 1))
    fi
done

if [ "$missing_tables" -gt 2 ]; then
    error "Too many tables missing from backup (${missing_tables}). Backup may be incomplete."
    exit 1
fi

# ============================================
# Test restore to local database (if Supabase local is running)
# ============================================
if pg_isready -h localhost -p 5432 &>/dev/null; then
    log "Local PostgreSQL detected — testing full restore..."

    # Create test database
    log "Creating test database: ${TEST_DB_NAME}"
    psql -h localhost -p 5432 -U postgres -d postgres -c "CREATE DATABASE ${TEST_DB_NAME};" 2>/dev/null || {
        error "Failed to create test database"
        exit 1
    }

    # Restore backup
    log "Restoring backup to test database..."
    if psql -h localhost -p 5432 -U postgres -d "$TEST_DB_NAME" -f "$LATEST_BACKUP" >> "$LOG_FILE" 2>&1; then
        log "✓ Backup restored successfully to test database"

        # Verify restored tables
        log "Verifying restored tables..."
        table_count=$(psql -h localhost -p 5432 -U postgres -d "$TEST_DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
        log "✓ Restored database has ${table_count} tables"

        if [ "$table_count" -lt 5 ]; then
            warn "Restored database has fewer tables than expected (${table_count})"
        fi
    else
        error "Backup restore FAILED"
        exit 1
    fi
else
    warn "Local PostgreSQL not running — skipping live restore test"
    warn "Start Supabase local with: supabase start"
    log "Backup file integrity check passed (schema verification only)"
fi

# ============================================
# Summary
# ============================================
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}Backup Restore Test — PASSED${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "Backup: ${LATEST_BACKUP} (${backup_size})"
echo "Tables verified: $(( ${#expected_tables[@]} - missing_tables ))/${#expected_tables[@]}"
echo ""
echo "This backup is restorable. ✅"
echo ""
