#!/usr/bin/env bash
# ============================================
# EGS — Supabase Cloud Backup (API-based, no IPv6 required)
# ============================================
# Purpose: Export schema + data from Supabase Cloud via Management API (HTTPS)
# This works on IPv4-only servers (unlike pg_dump which needs direct DB access)
# ============================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_ROOT="${PROJECT_DIR}/backups/supabase"
RETENTION_DAYS=30
LOG_FILE="${PROJECT_DIR}/logs/egs-supabase-backup.log"
mkdir -p "$(dirname "$LOG_FILE")"

# Colors
GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'
log() { echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] ${GREEN}INFO${NC} $1" | tee -a "$LOG_FILE"; }
warn() { echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] ${YELLOW}WARN${NC} $1" | tee -a "$LOG_FILE"; }
error() { echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] ${RED}ERROR${NC} $1" | tee -a "$LOG_FILE"; }

# Load environment
load_env() {
    local env_file=""
    if [ -f "${PROJECT_DIR}/.env.server" ]; then
        env_file="${PROJECT_DIR}/.env.server"
    elif [ -f "${PROJECT_DIR}/.env" ]; then
        env_file="${PROJECT_DIR}/.env"
    else
        error "No .env file found"; exit 1
    fi
    log "Loading environment from: ${env_file}"
    source <(grep -E '^(VITE_SUPABASE_URL|VITE_SUPABASE_ANON_KEY|SUPABASE_SERVICE_ROLE_KEY)=' "$env_file" | sed 's/^ *//')
    
    if [ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]; then
        error "SUPABASE_SERVICE_ROLE_KEY not set in .env.server"
        exit 1
    fi
}

# Setup
setup_dirs() {
    TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
    BACKUP_DIR="${BACKUP_ROOT}/${TIMESTAMP}"
    mkdir -p "${BACKUP_DIR}" "${BACKUP_ROOT}/latest"
    log "Backup directory: ${BACKUP_DIR}"
}

SUPABASE_URL=""
SERVICE_KEY=""

# Export schema via Management API (uses supabase db pull internally)
export_schema() {
    log "Exporting database schema via Management API..."
    local output_file="${BACKUP_DIR}/schema.sql"
    
    # Use supabase db pull to get the schema (goes through Management API, IPv4)
    cd "${PROJECT_DIR}"
    supabase db pull --db-url "postgresql://postgres:${SUPABASE_DB_PASSWORD}@db.thykrnoqgylrbfupophs.supabase.co:5432/postgres" 2>/dev/null || {
        warn "Direct db pull failed, falling back to manual schema export..."
        # Fallback: generate schema from supabase types
        echo "-- Schema export fallback" > "$output_file"
        echo "-- Generated via Management API" >> "$output_file"
        echo "-- Tables and columns exported below" >> "$output_file"
        
        # Export table definitions via REST API
        curl -s "${SUPABASE_URL}/rest/v1/" \
            -H "apikey: ${SERVICE_KEY}" \
            -H "Accept: application/json" 2>/dev/null || true
        return 1
    }
    
    # db pull downloads to supabase/migrations - copy the latest file
    local latest_migration
    latest_migration=$(ls -t "${PROJECT_DIR}/supabase/migrations/"*.sql 2>/dev/null | head -1)
    if [ -n "$latest_migration" ]; then
        cp "$latest_migration" "$output_file"
        log "Schema exported: ${output_file}"
    else
        warn "No migration file found after db pull"
        return 1
    fi
}

# Export data via REST API
export_data() {
    log "Exporting data via REST API..."
    local output_file="${BACKUP_DIR}/full_backup.json"
    
    # Known table list (service_role bypasses RLS for all tables)
    local tables="clients
projects
employees
suppliers
products
documents
tasks
contact_messages
messages_direction
user_profiles
finances
app_settings
media_files
site_content
page_layouts
properties
locataires
lease_contracts
rent_payments
foncier_lots
foncier_audit
foncier_villages
user_village_access
foncier_attestations
foncier_attestation_temoins"
    
    echo "{" > "$output_file"
    local first=true
    
    while IFS= read -r table; do
        [ -z "$table" ] && continue
        log "  Exporting table: ${table}"
        
        if [ "$first" = true ]; then
            first=false
        else
            printf ",\n" >> "$output_file"
        fi
        
        # Export all rows (service_role bypasses RLS)
        printf '  "%s": ' "$table" >> "$output_file"
        curl -s "${SUPABASE_URL}/rest/v1/${table}?select=*" \
            -H "apikey: ${SERVICE_KEY}" \
            -H "Accept: application/json" 2>/dev/null >> "$output_file" || echo "[]" >> "$output_file"
            
    done <<< "$tables"
    
    echo -e "\n}" >> "$output_file"
    
    local size
    size=$(du -h "$output_file" | cut -f1)
    log "Data export complete: ${output_file} (${size})"
}

# Export schema as SQL via db query
export_schema_sql() {
    log "Exporting schema as SQL..."
    local output_file="${BACKUP_DIR}/schema_full.sql"
    
    cd "${PROJECT_DIR}"
    supabase db query --linked "
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
" 2>&1 > "$output_file" || true
    
    local size
    size=$(du -h "$output_file" | cut -f1)
    log "Schema SQL exported: ${output_file} (${size})"
}

update_latest() {
    log "Updating 'latest' symlink..."
    rm -rf "${BACKUP_ROOT}/latest"
    ln -sfn "${BACKUP_DIR}" "${BACKUP_ROOT}/latest"
}

cleanup_old_backups() {
    log "Cleaning up backups older than ${RETENTION_DAYS} days..."
    local count
    count=$(find "${BACKUP_ROOT}" -mindepth 1 -maxdepth 1 -type d -mtime +"${RETENTION_DAYS}" | wc -l)
    if [ "$count" -gt 0 ]; then
        find "${BACKUP_ROOT}" -mindepth 1 -maxdepth 1 -type d -mtime +"${RETENTION_DAYS}" -exec rm -rf {} +
        log "Removed ${count} old backup(s)"
    fi
}

main() {
    log "============================================"
    log "EGS Supabase Cloud Backup (API-based) — Starting"
    log "============================================"
    
    load_env
    SUPABASE_URL="${VITE_SUPABASE_URL}"
    SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"
    
    setup_dirs
    export_schema_sql || warn "Schema SQL export had issues (non-critical)"
    export_data
    update_latest
    cleanup_old_backups
    
    local total_size
    total_size=$(du -sh "${BACKUP_DIR}" | cut -f1)
    log "============================================"
    log "EGS Supabase Cloud Backup — Complete (${total_size})"
    log "Location: ${BACKUP_DIR}"
    log "============================================"
}

main "$@"
