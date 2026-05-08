#!/usr/bin/env bash
# ============================================
# EGS — Supabase Cloud Automated Backup
# ============================================
# Purpose: Export schema + data from Supabase Cloud PostgreSQL
# Usage: Run via cron daily at 02:00
# Cron: 0 2 * * * soma /home/soma/gnamba-project/scripts/egs-supabase-backup.sh >> /var/log/egs-supabase-backup.log 2>&1
#
# Requirements:
#   - pg_dump installed (postgresql-client package)
#   - .env.server or .env.cloud with VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
# ============================================
set -euo pipefail

# ============================================
# Configuration
# ============================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_ROOT="${PROJECT_DIR}/backups/supabase"
RETENTION_DAYS=30
LOG_FILE="${PROJECT_DIR}/logs/egs-supabase-backup.log"

# ============================================
# Colors for logging
# ============================================
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] ${GREEN}INFO${NC} $1" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] ${YELLOW}WARN${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] ${RED}ERROR${NC} $1" | tee -a "$LOG_FILE"
}

# ============================================
# Load environment variables
# ============================================
load_env() {
    local env_file=""

    # Try .env.server first (production), then .env.cloud, then .env
    if [ -f "${PROJECT_DIR}/.env.server" ]; then
        env_file="${PROJECT_DIR}/.env.server"
    elif [ -f "${PROJECT_DIR}/.env.cloud" ]; then
        env_file="${PROJECT_DIR}/.env.cloud"
    elif [ -f "${PROJECT_DIR}/.env" ]; then
        env_file="${PROJECT_DIR}/.env"
    else
        error "No .env file found in ${PROJECT_DIR}"
        exit 1
    fi

    log "Loading environment from: ${env_file}"
    # shellcheck disable=SC1090
    source <(grep -E '^(VITE_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY|SUPABASE_DB_HOST|SUPABASE_DB_PORT|SUPABASE_DB_NAME|SUPABASE_DB_USER|SUPABASE_DB_PASSWORD)=' "$env_file" | sed 's/^ *//')
}

# ============================================
# Resolve Supabase Cloud DB connection
# ============================================
# Supabase Cloud exposes PostgreSQL at: db.<ref>.supabase.co:5432
# ref is extracted from VITE_SUPABASE_URL (e.g., https://thykrnoqgylrbfupophs.supabase.co → thykrnoqgylrbfupophs)
resolve_db_connection() {
    if [ -n "${SUPABASE_DB_HOST:-}" ]; then
        # Already configured explicitly
        return 0
    fi

    # Extract project ref from URL
    local supabase_url="${VITE_SUPABASE_URL:-}"
    if [ -z "$supabase_url" ]; then
        error "VITE_SUPABASE_URL is not set"
        exit 1
    fi

    # Parse the ref from https://<ref>.supabase.co
    local ref
    ref=$(echo "$supabase_url" | sed -n 's|https://\([^.]*\)\.supabase\.co.*|\1|p')

    if [ -z "$ref" ]; then
        error "Could not parse Supabase project ref from URL: ${supabase_url}"
        exit 1
    fi

    SUPABASE_DB_HOST="db.${ref}.supabase.co"
    SUPABASE_DB_PORT="5432"
    SUPABASE_DB_NAME="postgres"
    SUPABASE_DB_USER="postgres"

    log "Resolved Supabase Cloud DB: ${SUPABASE_DB_HOST}:${SUPABASE_DB_PORT}/${SUPABASE_DB_NAME}"
}

# ============================================
# Check prerequisites
# ============================================
check_prerequisites() {
    log "Checking prerequisites..."

    if ! command -v pg_dump &> /dev/null; then
        error "pg_dump is not installed. Install with: sudo apt install postgresql-client"
        exit 1
    fi

    if [ -z "${SUPABASE_DB_PASSWORD:-}" ] && [ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]; then
        error "Neither SUPABASE_DB_PASSWORD nor SUPABASE_SERVICE_ROLE_KEY is set in .env"
        error "Add one of these to your .env file for backup to work"
        exit 1
    fi

    log "Prerequisites OK"
}

# ============================================
# Create backup directory structure
# ============================================
setup_dirs() {
    local timestamp
    timestamp=$(date '+%Y%m%d_%H%M%S')
    BACKUP_DIR="${BACKUP_ROOT}/${timestamp}"

    mkdir -p "${BACKUP_DIR}"
    mkdir -p "${BACKUP_ROOT}/latest"

    log "Backup directory: ${BACKUP_DIR}"
}

# ============================================
# Export schema (no data — fast, for version control)
# ============================================
export_schema() {
    log "Exporting database schema..."

    local output_file="${BACKUP_DIR}/schema.sql"

    PGPASSWORD="${SUPABASE_DB_PASSWORD:-}" pg_dump \
        -h "${SUPABASE_DB_HOST}" \
        -p "${SUPABASE_DB_PORT}" \
        -U "${SUPABASE_DB_USER}" \
        -d "${SUPABASE_DB_NAME}" \
        --schema-only \
        --no-owner \
        --no-privileges \
        --clean \
        --if-exists \
        > "$output_file" 2>> "$LOG_FILE" || {
            error "Schema export failed"
            return 1
        }

    local size
    size=$(du -h "$output_file" | cut -f1)
    log "Schema exported: ${output_file} (${size})"
}

# ============================================
# Export full database (schema + data)
# ============================================
export_full() {
    log "Exporting full database (schema + data)..."

    local output_file="${BACKUP_DIR}/full_backup.sql"

    PGPASSWORD="${SUPABASE_DB_PASSWORD:-}" pg_dump \
        -h "${SUPABASE_DB_HOST}" \
        -p "${SUPABASE_DB_PORT}" \
        -U "${SUPABASE_DB_USER}" \
        -d "${SUPABASE_DB_NAME}" \
        --no-owner \
        --no-privileges \
        > "$output_file" 2>> "$LOG_FILE" || {
            error "Full database export failed"
            return 1
        }

    local size
    size=$(du -h "$output_file" | cut -f1)
    log "Full backup exported: ${output_file} (${size})"
}

# ============================================
# Export as custom format (for pg_restore)
# ============================================
export_custom_format() {
    log "Exporting database in custom format (for pg_restore)..."

    local output_file="${BACKUP_DIR}/full_backup.dump"

    PGPASSWORD="${SUPABASE_DB_PASSWORD:-}" pg_dump \
        -h "${SUPABASE_DB_HOST}" \
        -p "${SUPABASE_DB_PORT}" \
        -U "${SUPABASE_DB_USER}" \
        -d "${SUPABASE_DB_NAME}" \
        --no-owner \
        --no-privileges \
        --format=custom \
        --compress=6 \
        > "$output_file" 2>> "$LOG_FILE" || {
            error "Custom format export failed"
            return 1
        }

    local size
    size=$(du -h "$output_file" | cut -f1)
    log "Custom backup exported: ${output_file} (${size})"
}

# ============================================
# Create symlink to latest backup
# ============================================
update_latest() {
    log "Updating 'latest' symlink..."
    rm -f "${BACKUP_ROOT}/latest/schema.sql"
    rm -f "${BACKUP_ROOT}/latest/full_backup.sql"
    rm -f "${BACKUP_ROOT}/latest/full_backup.dump"

    ln -sf "${BACKUP_DIR}/schema.sql" "${BACKUP_ROOT}/latest/schema.sql"
    ln -sf "${BACKUP_DIR}/full_backup.sql" "${BACKUP_ROOT}/latest/full_backup.sql"
    ln -sf "${BACKUP_DIR}/full_backup.dump" "${BACKUP_ROOT}/latest/full_backup.dump"
}

# ============================================
# Cleanup old backups
# ============================================
cleanup_old_backups() {
    log "Cleaning up backups older than ${RETENTION_DAYS} days..."

    local count
    count=$(find "${BACKUP_ROOT}" -mindepth 1 -maxdepth 1 -type d -mtime +"${RETENTION_DAYS}" | wc -l)

    if [ "$count" -gt 0 ]; then
        find "${BACKUP_ROOT}" -mindepth 1 -maxdepth 1 -type d -mtime +"${RETENTION_DAYS}" -exec rm -rf {} +
        log "Removed ${count} old backup(s)"
    else
        log "No old backups to clean up"
    fi
}

# ============================================
# Verify backup integrity
# ============================================
verify_backup() {
    log "Verifying backup integrity..."

    local schema_file="${BACKUP_DIR}/schema.sql"
    local full_file="${BACKUP_DIR}/full_backup.sql"

    if [ ! -s "$schema_file" ]; then
        error "Schema file is empty or missing"
        return 1
    fi

    if [ ! -s "$full_file" ]; then
        error "Full backup file is empty or missing"
        return 1
    fi

    # Check that schema contains expected tables
    local table_count
    table_count=$(grep -c "CREATE TABLE" "$schema_file" || true)

    if [ "$table_count" -lt 5 ]; then
        error "Schema seems incomplete — only ${table_count} CREATE TABLE statements found"
        return 1
    fi

    log "Backup verified — ${table_count} tables in schema"
}

# ============================================
# Main
# ============================================
main() {
    log "============================================"
    log "EGS Supabase Cloud Backup — Starting"
    log "============================================"

    load_env
    resolve_db_connection
    check_prerequisites
    setup_dirs

    # Run exports
    export_schema || { error "Schema export failed — aborting"; exit 1; }
    export_full || { error "Full export failed — continuing with schema only"; }
    export_custom_format || { warn "Custom format export failed — non-critical"; }

    update_latest
    verify_backup || { error "Backup verification failed — review manually"; exit 1; }
    cleanup_old_backups

    # Summary
    local total_size
    total_size=$(du -sh "${BACKUP_DIR}" | cut -f1)
    log "============================================"
    log "EGS Supabase Cloud Backup — Complete (${total_size})"
    log "Location: ${BACKUP_DIR}"
    log "============================================"
}

main "$@"
