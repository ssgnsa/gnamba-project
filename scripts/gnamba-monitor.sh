#!/usr/bin/env bash
# =============================================================================
# GNAMBA SERVER MONITORING SCRIPT
# Surveillance automatique des services critiques
# Date: 13 mai 2026
# =============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
LOG_DIR="${PROJECT_ROOT}/logs"
LOG_FILE="${LOG_DIR}/gnamba-monitor-$(date +%Y%m%d).log"
ALERT_LOG="${LOG_DIR}/alerts-$(date +%Y%m%d).log"
CONFIG_FILE="${SCRIPT_DIR}/monitor-config.env"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration par défaut
EMAIL_RECIPIENT="${EMAIL_RECIPIENT:-admin@gnamba-services.com}"
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-}"
DISK_THRESHOLD="${DISK_THRESHOLD:-90}"
BACKUP_MAX_AGE="${BACKUP_MAX_AGE:-24}" # heures

# Charger la configuration si elle existe
if [ -f "${CONFIG_FILE}" ]; then
    source "${CONFIG_FILE}"
fi

# Créer les répertoires de logs
mkdir -p "${LOG_DIR}"

# Fonctions de logging
log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[${timestamp}] [${level}] ${message}" >> "${LOG_FILE}"
    echo "[${level}] ${message}"
}

alert() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[${timestamp}] ALERT: ${message}" >> "${ALERT_LOG}"
    echo -e "${RED}🚨 ALERT: ${message}${NC}"

    # Envoyer les alertes
    send_email_alert "${message}"
    send_slack_alert "${message}"
    send_telegram_alert "${message}"
}

success() {
    local message="$1"
    echo -e "${GREEN}✅ ${message}${NC}"
    log "INFO" "${message}"
}

warning() {
    local message="$1"
    echo -e "${YELLOW}⚠️  ${message}${NC}"
    log "WARN" "${message}"
}

error() {
    local message="$1"
    echo -e "${RED}❌ ${message}${NC}"
    log "ERROR" "${message}"
}

info() {
    local message="$1"
    echo -e "${BLUE}ℹ️  ${message}${NC}"
    log "INFO" "${message}"
}

# Fonctions d'alerte
send_email_alert() {
    local message="$1"
    if command -v mail >/dev/null 2>&1 && [ -n "${EMAIL_RECIPIENT}" ]; then
        echo "${message}" | mail -s "🚨 ALERTE GNAMBA SERVER" "${EMAIL_RECIPIENT}"
        log "INFO" "Email alert sent to ${EMAIL_RECIPIENT}"
    fi
}

send_slack_alert() {
    local message="$1"
    if [ -n "${SLACK_WEBHOOK}" ]; then
        curl -s -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 GNAMBA ALERT: ${message}\"}" \
            "${SLACK_WEBHOOK}" >/dev/null 2>&1 && \
        log "INFO" "Slack alert sent"
    fi
}

send_telegram_alert() {
    local message="$1"
    if [ -n "${TELEGRAM_BOT_TOKEN}" ] && [ -n "${TELEGRAM_CHAT_ID}" ]; then
        curl -s -X POST \
            "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
            -d "chat_id=${TELEGRAM_CHAT_ID}&text=🚨 GNAMBA ALERT: ${message}" \
            >/dev/null 2>&1 && \
        log "INFO" "Telegram alert sent"
    fi
}

# Fonctions de vérification
check_docker_containers() {
    info "Vérification des conteneurs Docker..."

    local containers=("egs-web" "somagro-web" "filebrowser")
    local failed_containers=()

    for container in "${containers[@]}"; do
        if docker ps --format "table {{.Names}}" | grep -q "^${container}$"; then
            success "Conteneur ${container} actif"
        else
            error "Conteneur ${container} arrêté"
            failed_containers+=("${container}")
        fi
    done

    if [ ${#failed_containers[@]} -gt 0 ]; then
        alert "Conteneurs Docker arrêtés: ${failed_containers[*]}"
        return 1
    fi

    return 0
}

check_supabase_services() {
    info "Vérification des services Supabase..."

    # Vérifier l'API
    if curl -s -f http://localhost:54321/health >/dev/null 2>&1; then
        success "Supabase API opérationnel"
    else
        error "Supabase API inaccessible"
        alert "Supabase API down - port 54321 inaccessible"
        return 1
    fi

    # Vérifier Studio
    if curl -s -f http://localhost:54323 >/dev/null 2>&1; then
        success "Supabase Studio opérationnel"
    else
        warning "Supabase Studio inaccessible (optionnel)"
    fi

    # Vérifier la base de données
    if command -v supabase >/dev/null 2>&1; then
        if supabase status >/dev/null 2>&1; then
            success "Supabase local actif"
        else
            error "Supabase local arrêté"
            alert "Supabase local is not running"
            return 1
        fi
    else
        warning "CLI Supabase non installé - impossible de vérifier le statut détaillé"
    fi

    return 0
}

check_database_tables() {
    info "Vérification des tables critiques..."

    local critical_tables=("attestation_sequences" "foncier_lots" "properties" "user_profiles")
    local missing_tables=()

    for table in "${critical_tables[@]}"; do
        if supabase sql "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name='${table}');" 2>/dev/null | grep -q "t"; then
            success "Table ${table} existe"
        else
            error "Table ${table} manquante"
            missing_tables+=("${table}")
        fi
    done

    if [ ${#missing_tables[@]} -gt 0 ]; then
        alert "Tables manquantes: ${missing_tables[*]}"
        return 1
    fi

    return 0
}

check_backups() {
    info "Vérification des sauvegardes..."

    local backup_dir="${PROJECT_ROOT}/backups/supabase"
    local latest_backup="${backup_dir}/latest"

    if [ ! -d "${backup_dir}" ]; then
        error "Répertoire de sauvegarde inexistant: ${backup_dir}"
        alert "Backup directory missing: ${backup_dir}"
        return 1
    fi

    # Vérifier le dernier backup
    local last_backup_file=$(find "${backup_dir}" -name "*.dump" -o -name "*.sql" | sort | tail -1)
    if [ -z "${last_backup_file}" ]; then
        error "Aucun fichier de sauvegarde trouvé"
        alert "No backup files found in ${backup_dir}"
        return 1
    fi

    # Vérifier l'âge du backup
    local backup_age_hours=$(( ($(date +%s) - $(stat -c %Y "${last_backup_file}")) / 3600 ))
    if [ ${backup_age_hours} -gt ${BACKUP_MAX_AGE} ]; then
        warning "Dernière sauvegarde vieille de ${backup_age_hours}h (max: ${BACKUP_MAX_AGE}h)"
        alert "Last backup is ${backup_age_hours} hours old (threshold: ${BACKUP_MAX_AGE}h)"
    else
        success "Dernière sauvegarde: ${backup_age_hours}h (${last_backup_file##*/})"
    fi

    # Vérifier l'intégrité si c'est un dump PostgreSQL
    if [[ "${last_backup_file}" == *.dump ]]; then
        if command -v pg_restore >/dev/null 2>&1; then
            if pg_restore -l "${last_backup_file}" >/dev/null 2>&1; then
                success "Intégrité du backup vérifiée"
            else
                error "Backup corrompu: ${last_backup_file}"
                alert "Backup file corrupted: ${last_backup_file}"
                return 1
            fi
        else
            warning "pg_restore non disponible - impossible de vérifier l'intégrité"
        fi
    fi

    return 0
}

check_disk_space() {
    info "Vérification de l'espace disque..."

    local disk_usage=$(df "${PROJECT_ROOT}" | tail -1 | awk '{print $5}' | sed 's/%//')

    if [ ${disk_usage} -gt ${DISK_THRESHOLD} ]; then
        error "Espace disque critique: ${disk_usage}% utilisé"
        alert "Disk space critical: ${disk_usage}% used (threshold: ${DISK_THRESHOLD}%)"
        return 1
    else
        success "Espace disque: ${disk_usage}% utilisé"
    fi

    return 0
}

check_git_status() {
    info "Vérification du statut Git..."

    if [ -d "${PROJECT_ROOT}/.git" ]; then
        local uncommitted=$(git status --porcelain | wc -l)
        if [ ${uncommitted} -gt 0 ]; then
            warning "${uncommitted} fichiers non commitées"
            if [ ${uncommitted} -gt 10 ]; then
                alert "${uncommitted} uncommitted files - possible data loss risk"
            fi
        else
            success "Répertoire Git propre"
        fi
    else
        warning "Pas de dépôt Git détecté"
    fi

    return 0
}

generate_report() {
    info "Génération du rapport quotidien..."

    local report_file="${LOG_DIR}/daily-report-$(date +%Y%m%d).md"

    cat > "${report_file}" << EOF
# RAPPORT QUOTIDIEN GNAMBA SERVER
**Date**: $(date '+%Y-%m-%d %H:%M:%S')

## État des services
- Docker: $(docker ps | wc -l) conteneurs actifs
- Supabase API: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:54321/health)
- Supabase Studio: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:54323)
- Base de données: $(supabase sql "SELECT 1;" 2>/dev/null && echo "OK" || echo "ERROR")

## Sauvegardes
- Dernière sauvegarde: $(find "${PROJECT_ROOT}/backups" -name "*.dump" -o -name "*.sql" | sort | tail -1 | xargs basename 2>/dev/null || echo "Aucune")
- Espace disque: $(df "${PROJECT_ROOT}" | tail -1 | awk '{print $5}')

## Alertes du jour
$(cat "${ALERT_LOG}" 2>/dev/null || echo "Aucune alerte")

---
Rapport généré automatiquement par gnamba-monitor.sh
EOF

    success "Rapport généré: ${report_file}"
}

# Fonction principale
main() {
    echo "=========================================="
    echo "🔍 GNAMBA SERVER MONITORING"
    echo "Date: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "=========================================="

    local exit_code=0
    local checks_passed=0
    local checks_total=0

    # Exécuter toutes les vérifications
    for check_func in check_docker_containers check_supabase_services check_database_tables check_backups check_disk_space check_git_status; do
        checks_total=$((checks_total + 1))
        if ${check_func}; then
            checks_passed=$((checks_passed + 1))
        else
            exit_code=1
        fi
        echo
    done

    # Générer le rapport
    generate_report

    echo "=========================================="
    if [ ${exit_code} -eq 0 ]; then
        success "TOUTES LES VÉRIFICATIONS RÉUSSIES (${checks_passed}/${checks_total})"
    else
        error "PROBLÈMES DÉTECTÉS (${checks_passed}/${checks_total} vérifications réussies)"
    fi
    echo "Logs: ${LOG_FILE}"
    echo "Alertes: ${ALERT_LOG}"
    echo "=========================================="

    return ${exit_code}
}

# Mode interactif ou cron
if [ "${1:-}" = "--cron" ]; then
    # Mode cron: rediriger toute la sortie vers le log
    exec > >(tee -a "${LOG_FILE}") 2>&1
fi

# Exécuter le monitoring
main "$@"