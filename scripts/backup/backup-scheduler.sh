#!/usr/bin/env bash
# ============================================
# EGS - Backup Scheduler
# ============================================
# Usage: ./backup-scheduler.sh [install|remove|status]
# Manages cron jobs for automated backups
# ============================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_MANAGER="${SCRIPT_DIR}/backup-manager.sh"
CRON_COMMENT="# EGS Automated Backup"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ============================================
# Install Cron Jobs
# ============================================
cmd_install() {
    local schedule="${1:-daily}"
    local target="${2:-remote}"
    
    log "Installing backup schedule: $schedule ($target)"
    
    # Remove existing EGS cron jobs
    cmd_remove >/dev/null 2>&1 || true
    
    local cron_line=""
    case "$schedule" in
        hourly)
            cron_line="0 * * * * ${BACKUP_MANAGER} backup ${target} --full >> /var/log/egs-backup.log 2>&1"
            ;;
        daily|*)
            cron_line="0 2 * * * ${BACKUP_MANAGER} backup ${target} --full >> /var/log/egs-backup.log 2>&1"
            ;;
        weekly)
            cron_line="0 2 * * 0 ${BACKUP_MANAGER} backup ${target} --full >> /var/log/egs-backup.log 2>&1"
            ;;
    esac
    
    # Add to crontab
    (
        crontab -l 2>/dev/null || true
        echo "${CRON_COMMENT} - ${schedule} ${target} backup"
        echo "$cron_line"
    ) | crontab -
    
    log "✅ Backup scheduled: $schedule ($target)"
    log "Cron entry: $cron_line"
}

# ============================================
# Remove Cron Jobs
# ============================================
cmd_remove() {
    log "Removing EGS backup cron jobs..."
    
    crontab -l 2>/dev/null | grep -v "$CRON_COMMENT" | grep -v "backup-manager.sh" | crontab -
    
    log "✅ Backup cron jobs removed"
}

# ============================================
# Show Status
# ============================================
cmd_status() {
    log "Current cron jobs:"
    echo ""
    crontab -l 2>/dev/null | grep -E "($CRON_COMMENT|backup-manager)" || echo "No EGS backup jobs configured"
    echo ""
    log "Last backup log (if available):"
    tail -5 /var/log/egs-backup.log 2>/dev/null || echo "No backup log found"
}

# ============================================
# Help
# ============================================
show_help() {
    cat <<EOF
EGS Backup Scheduler

Usage: $0 <command> [options]

Commands:
  install [hourly|daily|weekly] [remote|local]  Install backup cron job
  remove                                         Remove all backup cron jobs
  status                                         Show current schedule

Examples:
  $0 install daily remote    # Daily remote backup at 2 AM
  $0 install weekly local    # Weekly local backup on Sundays
  $0 status                  # Show current schedule
  $0 remove                  # Remove all backup jobs
EOF
}

# ============================================
# Main
# ============================================
main() {
    if [ $# -eq 0 ]; then
        show_help
        exit 0
    fi
    
    local command="$1"
    shift
    
    case "$command" in
        install)
            cmd_install "$@"
            ;;
        remove|uninstall)
            cmd_remove
            ;;
        status)
            cmd_status
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
