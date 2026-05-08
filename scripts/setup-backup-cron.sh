#!/usr/bin/env bash
# ============================================
# EGS — Setup Automated Supabase Backups
# ============================================
# Run ONCE to configure cron jobs for daily backups
# Requires: sudo access
# ============================================
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_SCRIPT="${PROJECT_DIR}/scripts/egs-supabase-backup.sh"
LOG_FILE="/var/log/egs-supabase-backup.log"
CRON_FILE="/etc/cron.d/egs-supabase-backup"
LOGROTATE_FILE="/etc/logrotate.d/egs-supabase-backup"
CURRENT_USER=$(whoami)

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "[${GREEN}INFO${NC}] $1"; }
warn() { echo -e "[${YELLOW}WARN${NC}] $1"; }
error() { echo -e "[${RED}ERROR${NC}] $1"; }

# ============================================
# Check sudo
# ============================================
if [ "$EUID" -ne 0 ]; then
    error "This script must be run with sudo"
    echo "Usage: sudo ${BASH_SOURCE[0]}"
    exit 1
fi

# ============================================
# Verify backup script exists
# ============================================
if [ ! -x "$BACKUP_SCRIPT" ]; then
    error "Backup script not found or not executable: ${BACKUP_SCRIPT}"
    error "Run: chmod +x ${BACKUP_SCRIPT}"
    exit 1
fi

log "Backup script found: ${BACKUP_SCRIPT}"

# ============================================
# Create log file
# ============================================
touch "$LOG_FILE"
chown root:root "$LOG_FILE"
chmod 644 "$LOG_FILE"
log "Log file ready: ${LOG_FILE}"

# ============================================
# Setup cron job
# ============================================
cat > "$CRON_FILE" << EOF
# EGS Supabase Cloud Backup Schedule
# Daily backup at 02:00 AM
0 2 * * * ${CURRENT_USER} ${BACKUP_SCRIPT} >> ${LOG_FILE} 2>&1
EOF

chown root:root "$CRON_FILE"
chmod 644 "$CRON_FILE"
log "Cron job installed: ${CRON_FILE}"

# ============================================
# Setup log rotation
# ============================================
cat > "$LOGROTATE_FILE" << EOF
${LOG_FILE} {
    weekly
    rotate 4
    compress
    delaycompress
    missingok
    notifempty
    create 0644 root root
}
EOF

log "Log rotation configured: ${LOGROTATE_FILE}"

# ============================================
# Reload cron
# ============================================
systemctl reload cron 2>/dev/null || service cron reload 2>/dev/null || true
log "Cron service reloaded"

# ============================================
# Summary
# ============================================
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}EGS Supabase Backup — Setup Complete${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "Schedule:  Daily at 02:00 AM"
echo "Script:    ${BACKUP_SCRIPT}"
echo "Logs:      ${LOG_FILE}"
echo "Backups:   ${PROJECT_DIR}/backups/supabase/"
echo "Retention: 30 days"
echo ""
echo "To run a manual backup now:"
echo "  ${BACKUP_SCRIPT}"
echo ""
echo "To check cron status:"
echo "  cat ${CRON_FILE}"
echo ""
echo "To check logs:"
echo "  tail -20 ${LOG_FILE}"
echo ""
