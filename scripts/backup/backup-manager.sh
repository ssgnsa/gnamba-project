#!/usr/bin/env bash
# ============================================
# EGS - Backup Manager (Consolidé)
# ============================================
# Usage: ./backup-manager.sh [command] [options]
# Commands:
#   backup   [cloud|local] [--full|--schema|--data]  Effectuer un backup
#   restore  <file> [--to-cloud|--to-local]          Restaurer un backup
#   verify   <file>                                  Vérifier un backup
#   list                                             Lister les backups
#   cleanup  [--dry-run]                             Nettoyer anciens backups
#
# Examples:
#   ./backup-manager.sh backup cloud --full
#   ./backup-manager.sh restore backups/egs_20240115_120000.sql --to-cloud
#   ./backup-manager.sh verify backups/egs_20240115_120000.sql
#   ./backup-manager.sh cleanup --dry-run
# ============================================

set -euo pipefail

# ============================================
# Configuration
# ============================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
BACKUP_ROOT="${PROJECT_DIR}/backups"
LOG_FILE="${PROJECT_DIR}/logs/backup-manager.log"
RETENTION_DAYS=30
RETENTION_WEEKS=4
RETENTION_MONTHS=12

# ============================================
# Colors
# ============================================
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================================
# Logging
# ============================================
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
# Load Environment
# ============================================
load_env() {
    local env_file=""
    
    # Priority: .env.server > .env.cloud > .env
    if [ -f "${PROJECT_DIR}/.env.server" ]; then
        env_file="${PROJECT_DIR}/.env.server"
    elif [ -f "${PROJECT_DIR}/.env.cloud" ]; then
        env_file="${PROJECT_DIR}/.env.cloud"
    elif [ -f "${PROJECT_DIR}/.env" ]; then
        env_file="${PROJECT_DIR}/.env"
    else
        error "No .env file found"
        exit 1
    fi
    
    # shellcheck disable=SC1090
    source <(grep -E '^(VITE_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY|SUPABASE_DB_PASSWORD|VITE_SUPABASE_LOCAL_URL|POSTGRES_PASSWORD|JWT_SECRET)=' "$env_file" 2>/dev/null || true)
}

# ============================================
# Resolve Database Connection
# ============================================
resolve_cloud_connection() {
    local url="${VITE_SUPABASE_URL:-}"
    if [ -z "$url" ]; then
        error "VITE_SUPABASE_URL not set"
        exit 1
    fi
    
    local ref
    ref=$(echo "$url" | sed -n 's|https://\([^.]*\)\.supabase\.co.*|\1|p')
    
    if [ -z "$ref" ]; then
        error "Could not parse Supabase URL"
        exit 1
    fi
    
    DB_HOST="db.${ref}.supabase.co"
    DB_PORT="5432"
    DB_NAME="postgres"
    DB_USER="postgres"
    DB_PASSWORD="${SUPABASE_DB_PASSWORD:-}"
    
    if [ -z "$DB_PASSWORD" ]; then
        error "SUPABASE_DB_PASSWORD not set"
        exit 1
    fi
    
    log "Cloud DB: ${DB_HOST}:${DB_PORT}/${DB_NAME}"
}

resolve_local_connection() {
    DB_HOST="localhost"
    DB_PORT="54322"
    DB_NAME="postgres"
    DB_USER="postgres"
    DB_PASSWORD="${POSTGRES_PASSWORD:-postgres}"
    
    log "Local DB: ${DB_HOST}:${DB_PORT}/${DB_NAME}"
}

# ============================================
# Backup Functions
# ============================================
cmd_backup() {
    local target="${1:-cloud}"
    local mode="${2:---full}"
    local timestamp
    timestamp=$(date +"%Y%m%d_%H%M%S")
    
    load_env
    
    if [ "$target" = "cloud" ]; then
        resolve_cloud_connection
        local backup_dir="${BACKUP_ROOT}/cloud"
        local prefix="egs_cloud"
    else
        resolve_local_connection
        local backup_dir="${BACKUP_ROOT}/local"
        local prefix="egs_local"
    fi
    
    mkdir -p "$backup_dir"
    
    local backup_file="${backup_dir}/${prefix}_${timestamp}.sql"
    local pg_dump_opts=""
    
    case "$mode" in
        --schema)
            pg_dump_opts="--schema-only"
            log "Backup SCHEMA ONLY mode"
            ;;
        --data)
            pg_dump_opts="--data-only"
            log "Backup DATA ONLY mode"
            ;;
        --full|*)
            pg_dump_opts=""
            log "Backup FULL mode (schema + data)"
            ;;
    esac
    
    log "Starting backup to: ${backup_file}"
    
    PGPASSWORD="$DB_PASSWORD" pg_dump \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        --no-owner \
        --no-privileges \
        $pg_dump_opts \
        > "$backup_file"
    
    if [ -f "$backup_file" ] && [ -s "$backup_file" ]; then
        # Compress
        gzip "$backup_file"
        backup_file="${backup_file}.gz"
        local size
        size=$(du -h "$backup_file" | cut -f1)
        log "Backup completed: ${backup_file} (${size})"
        
        # Create symlink to latest
        ln -sf "$(basename "$backup_file")" "${backup_dir}/latest.sql.gz"
        
        echo "$backup_file"
        return 0
    else
        error "Backup failed - empty or missing file"
        return 1
    fi
}

# ============================================
# Restore Functions
# ============================================
cmd_restore() {
    local file="$1"
    local target="${2:---to-cloud}"
    
    if [ ! -f "$file" ]; then
        error "Backup file not found: $file"
        exit 1
    fi
    
    load_env
    
    if [ "$target" = "--to-cloud" ]; then
        resolve_cloud_connection
    else
        resolve_local_connection
    fi
    
    warn "This will DESTROY existing data in ${DB_HOST}:${DB_NAME}"
    read -r -p "Are you sure? Type 'yes' to continue: " confirm
    if [ "$confirm" != "yes" ]; then
        log "Restore cancelled"
        exit 0
    fi
    
    log "Starting restore from: $file"
    
    # Decompress if needed
    local restore_file="$file"
    if [[ "$file" == *.gz ]]; then
        log "Decompressing..."
        gunzip -c "$file" > "${file%.gz}"
        restore_file="${file%.gz}"
    fi
    
    PGPASSWORD="$DB_PASSWORD" psql \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        -v ON_ERROR_STOP=1 \
        -f "$restore_file"
    
    log "Restore completed"
}

# ============================================
# Verify Functions
# ============================================
cmd_verify() {
    local file="$1"
    
    if [ ! -f "$file" ]; then
        error "File not found: $file"
        exit 1
    fi
    
    log "Verifying backup: $file"
    
    # Check if valid gzip
    if [[ "$file" == *.gz ]]; then
        if gunzip -t "$file" 2>/dev/null; then
            log "✓ Valid gzip archive"
        else
            error "✗ Invalid gzip archive"
            exit 1
        fi
    fi
    
    # Check SQL content
    local content
    if [[ "$file" == *.gz ]]; then
        content=$(gunzip -c "$file" | head -20)
    else
        content=$(head -20 "$file")
    fi
    
    if echo "$content" | grep -q "PostgreSQL database dump\|CREATE TABLE\|INSERT INTO"; then
        log "✓ Valid PostgreSQL dump"
    else
        warn "⚠ Does not look like a standard PostgreSQL dump"
    fi
    
    # Check file size
    local size
    size=$(du -h "$file" | cut -f1)
    log "✓ File size: $size"
    
    log "Verification completed"
}

# ============================================
# List Functions
# ============================================
cmd_list() {
    log "Available backups:"
    
    echo -e "\n${BLUE}=== CLOUD BACKUPS ===${NC}"
    if [ -d "${BACKUP_ROOT}/cloud" ]; then
        ls -lah "${BACKUP_ROOT}/cloud"/*.sql* 2>/dev/null | tail -10 || echo "No cloud backups"
    else
        echo "No cloud backup directory"
    fi
    
    echo -e "\n${BLUE}=== LOCAL BACKUPS ===${NC}"
    if [ -d "${BACKUP_ROOT}/local" ]; then
        ls -lah "${BACKUP_ROOT}/local"/*.sql* 2>/dev/null | tail -10 || echo "No local backups"
    else
        echo "No local backup directory"
    fi
    
    # Show total size
    echo -e "\n${BLUE}=== STORAGE USAGE ===${NC}"
    du -sh "${BACKUP_ROOT}" 2>/dev/null || echo "0B"
}

# ============================================
# Cleanup Functions
# ============================================
cmd_cleanup() {
    local dry_run="${1:-}"
    local deleted=0
    
    log "Starting cleanup (retention: ${RETENTION_DAYS} days)"
    
    for backup_dir in "${BACKUP_ROOT}/cloud" "${BACKUP_ROOT}/local"; do
        if [ ! -d "$backup_dir" ]; then
            continue
        fi
        
        while IFS= read -r file; do
            if [ -z "$file" ]; then
                continue
            fi
            
            local basename
            basename=$(basename "$file")
            
            # Keep latest symlink target
            if [ "$basename" = "latest.sql.gz" ]; then
                continue
            fi
            
            # Check file age
            local file_age
            file_age=$(( ($(date +%s) - $(stat -c %Y "$file" 2>/dev/null || stat -f %m "$file")) / 86400 ))
            
            if [ "$file_age" -gt "$RETENTION_DAYS" ]; then
                if [ "$dry_run" = "--dry-run" ]; then
                    log "[DRY-RUN] Would delete: $basename (${file_age} days old)"
                else
                    rm "$file"
                    log "Deleted: $basename (${file_age} days old)"
                    ((deleted++))
                fi
            fi
        done < <(find "$backup_dir" -name "*.sql*" -type f 2>/dev/null)
    done
    
    if [ "$dry_run" = "--dry-run" ]; then
        log "Dry-run completed. No files deleted."
    else
        log "Cleanup completed. Deleted $deleted files."
    fi
}

# ============================================
# Help
# ============================================
show_help() {
    cat <<EOF
EGS Backup Manager

Usage: $0 <command> [options]

Commands:
  backup [cloud|local] [--full|--schema|--data]  Create backup
  restore <file> [--to-cloud|--to-local]          Restore backup
  verify <file>                                   Verify backup integrity
  list                                            List all backups
  cleanup [--dry-run]                             Remove old backups

Examples:
  $0 backup cloud --full                    # Full cloud backup
  $0 backup local --schema                  # Local schema only
  $0 restore backups/cloud/egs_xxx.sql.gz   # Restore from file
  $0 verify backups/cloud/latest.sql.gz     # Verify latest backup
  $0 cleanup --dry-run                       # Preview cleanup

Configuration:
  Backups stored in: ${BACKUP_ROOT}/
  Retention: ${RETENTION_DAYS} days
  Log file: ${LOG_FILE}
EOF
}

# ============================================
# Main
# ============================================
main() {
    # Ensure log directory exists
    mkdir -p "$(dirname "$LOG_FILE")"
    
    if [ $# -eq 0 ]; then
        show_help
        exit 0
    fi
    
    local command="$1"
    shift
    
    case "$command" in
        backup)
            cmd_backup "$@"
            ;;
        restore)
            cmd_restore "$@"
            ;;
        verify)
            cmd_verify "$@"
            ;;
        list)
            cmd_list
            ;;
        cleanup)
            cmd_cleanup "$@"
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
