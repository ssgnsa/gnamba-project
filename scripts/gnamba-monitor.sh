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
GIT_ALERT_THRESHOLD="${GIT_ALERT_THRESHOLD:-100}"
SUPABASE_MODE="${SUPABASE_MODE:-}"
SUPABASE_URL="${SUPABASE_URL:-}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-}"
MONITOR_CONTAINERS="${MONITOR_CONTAINERS:-egs-frontend egs-nginx-proxy egs-filebrowser}"
MONITOR_CRITICAL_TABLES="${MONITOR_CRITICAL_TABLES:-app_settings user_profiles foncier_lots properties}"

# Charger la configuration si elle existe
if [ -f "${CONFIG_FILE}" ]; then
    source "${CONFIG_FILE}"
fi

get_env_value() {
    local key="$1"
    local fallback="${2:-}"

    if [ -n "${!key:-}" ]; then
        printf '%s' "${!key}"
        return 0
    fi

    local env_file
    for env_file in "${PROJECT_ROOT}/.env.server" "${PROJECT_ROOT}/.env"; do
        [ -f "${env_file}" ] || continue
        local value
        value="$(
            awk -v key="${key}" '
                BEGIN { FS = "=" }
                $1 == key {
                    value = $0
                    sub(/^[^=]*=/, "", value)
                    gsub(/^[[:space:]]+|[[:space:]]+$/, "", value)
                    gsub(/^"|"$/, "", value)
                    gsub(/^'\''|'\''$/, "", value)
                    print value
                    exit
                }
            ' "${env_file}"
        )"
        if [ -n "${value}" ]; then
            printf '%s' "${value}"
            return 0
        fi
    done

    printf '%s' "${fallback}"
}

resolve_supabase_config() {
    if [ -z "${SUPABASE_MODE}" ]; then
        SUPABASE_MODE="$(get_env_value VITE_SUPABASE_MODE cloud)"
    fi

    if [ "${SUPABASE_MODE}" = "cloud" ]; then
        [ -n "${SUPABASE_URL}" ] || SUPABASE_URL="$(get_env_value VITE_SUPABASE_URL)"
        [ -n "${SUPABASE_ANON_KEY}" ] || SUPABASE_ANON_KEY="$(get_env_value VITE_SUPABASE_ANON_KEY)"
    else
        [ -n "${SUPABASE_URL}" ] || SUPABASE_URL="$(get_env_value VITE_SUPABASE_LOCAL_URL http://localhost:54321)"
        [ -n "${SUPABASE_ANON_KEY}" ] || SUPABASE_ANON_KEY="$(get_env_value VITE_SUPABASE_LOCAL_ANON_KEY)"
    fi
}

supabase_health_code() {
    resolve_supabase_config

    if [ -z "${SUPABASE_URL}" ]; then
        printf '000'
        return 0
    fi

    if [ "${SUPABASE_MODE}" = "cloud" ]; then
        curl -sS -o /dev/null -w "%{http_code}" --max-time 15 \
            "${SUPABASE_URL%/}/auth/v1/health" \
            -H "apikey: ${SUPABASE_ANON_KEY}" 2>/dev/null || printf '000'
    else
        curl -sS -o /dev/null -w "%{http_code}" --max-time 10 \
            "${SUPABASE_URL%/}/health" 2>/dev/null || printf '000'
    fi
}

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

    read -r -a containers <<< "${MONITOR_CONTAINERS}"
    local failed_containers=()

    for container in "${containers[@]}"; do
        local status
        status="$(docker inspect -f '{{.State.Status}}{{if .State.Health}}/{{.State.Health.Status}}{{end}}' "${container}" 2>/dev/null || true)"

        if [[ "${status}" == running* ]] && [[ "${status}" != *"/unhealthy" ]]; then
            success "Conteneur ${container} actif (${status})"
        else
            error "Conteneur ${container} indisponible (${status:-absent})"
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

    resolve_supabase_config

    if [ "${SUPABASE_MODE}" = "cloud" ]; then
        if [ -z "${SUPABASE_URL}" ] || [ -z "${SUPABASE_ANON_KEY}" ]; then
            error "Configuration Supabase Cloud incomplète"
            alert "Supabase Cloud monitoring misconfigured"
            return 1
        fi

        local code
        code="$(supabase_health_code)"
        if [ "${code}" = "200" ]; then
            success "Supabase Cloud Auth health opérationnel (${SUPABASE_URL})"
            return 0
        fi

        error "Supabase Cloud Auth health inaccessible (HTTP ${code})"
        alert "Supabase Cloud health failed - HTTP ${code}"
        return 1
    fi

    if curl -s -f "${SUPABASE_URL%/}/health" >/dev/null 2>&1; then
        success "Supabase local API opérationnelle"
    else
        error "Supabase local API inaccessible"
        alert "Supabase local API down - ${SUPABASE_URL%/}/health inaccessible"
        return 1
    fi

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

    resolve_supabase_config

    read -r -a critical_tables <<< "${MONITOR_CRITICAL_TABLES}"
    local missing_tables=()
    local unreachable_tables=()

    for table in "${critical_tables[@]}"; do
        if [ "${SUPABASE_MODE}" = "cloud" ]; then
            local code
            code="$(
                curl -sS -o /dev/null -w "%{http_code}" --max-time 20 \
                    "${SUPABASE_URL%/}/rest/v1/${table}?select=*&limit=1" \
                    -H "apikey: ${SUPABASE_ANON_KEY}" \
                    -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" 2>/dev/null || printf '000'
            )"

            case "${code}" in
                200|206)
                    success "Table ${table} exposée via REST (HTTP ${code})"
                    ;;
                401|403)
                    success "Table ${table} existe mais accès REST restreint (HTTP ${code})"
                    ;;
                404)
                    error "Table ${table} manquante ou non exposée (HTTP 404)"
                    missing_tables+=("${table}")
                    ;;
                *)
                    error "Table ${table} inaccessible (HTTP ${code})"
                    unreachable_tables+=("${table}:${code}")
                    ;;
            esac
        elif supabase sql "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name='${table}');" 2>/dev/null | grep -q "t"; then
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

    if [ ${#unreachable_tables[@]} -gt 0 ]; then
        alert "Tables critiques inaccessibles: ${unreachable_tables[*]}"
        return 1
    fi

    return 0
}

check_backups() {
    info "Vérification des sauvegardes..."

    local backup_dir="${PROJECT_ROOT}/backups/supabase"
    if [ ! -d "${backup_dir}" ]; then
        error "Répertoire de sauvegarde inexistant: ${backup_dir}"
        alert "Backup directory missing: ${backup_dir}"
        return 1
    fi

    # Vérifier le dernier backup
    local last_backup_file
    last_backup_file="$(
        find "${backup_dir}" -type f -size +0c \( -name "*.dump" -o -name "*.sql" -o -name "*.json" -o -name "*.json.gz" \) \
            -printf '%T@ %p\n' 2>/dev/null |
            sort -n |
            tail -1 |
            cut -d' ' -f2-
    )"
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
        return 1
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
            if [ ${uncommitted} -gt ${GIT_ALERT_THRESHOLD} ]; then
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
    resolve_supabase_config

    local supabase_api_status
    supabase_api_status="$(supabase_health_code)"

    local database_status
    if [ "${SUPABASE_MODE}" = "cloud" ]; then
        database_status="Cloud REST/Auth ${supabase_api_status}"
    else
        database_status="$(supabase sql "SELECT 1;" 2>/dev/null && echo "OK" || echo "ERROR")"
    fi

    local last_backup
    last_backup="$(
        find "${PROJECT_ROOT}/backups" -type f -size +0c \( -name "*.dump" -o -name "*.sql" -o -name "*.json" -o -name "*.json.gz" \) \
            -printf '%T@ %p\n' 2>/dev/null |
            sort -n |
            tail -1 |
            cut -d' ' -f2- |
            xargs -r basename 2>/dev/null || true
    )"

    cat > "${report_file}" << EOF
# RAPPORT QUOTIDIEN GNAMBA SERVER
**Date**: $(date '+%Y-%m-%d %H:%M:%S')

## État des services
- Docker: $(docker ps | wc -l) conteneurs actifs
- Supabase mode: ${SUPABASE_MODE}
- Supabase API: ${supabase_api_status}
- Base de données: ${database_status}

## Sauvegardes
- Dernière sauvegarde non vide: ${last_backup:-Aucune}
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

    local checks=()
    [ "${MONITOR_DOCKER:-true}" = "true" ] && checks+=(check_docker_containers)
    [ "${MONITOR_SUPABASE:-true}" = "true" ] && checks+=(check_supabase_services)
    [ "${MONITOR_DATABASE:-true}" = "true" ] && checks+=(check_database_tables)
    [ "${MONITOR_BACKUPS:-true}" = "true" ] && checks+=(check_backups)
    [ "${MONITOR_DISK:-true}" = "true" ] && checks+=(check_disk_space)
    [ "${MONITOR_GIT:-true}" = "true" ] && checks+=(check_git_status)

    # Exécuter toutes les vérifications activées
    for check_func in "${checks[@]}"; do
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
