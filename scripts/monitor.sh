#!/usr/bin/env bash

# ============================================
# MONITORING DES ENVIRONNEMENTS EGS
# ============================================
# Surveillance continue des environnements
# ============================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Charger la configuration
if [[ -f "$ROOT_DIR/.sync-config" ]]; then
    # shellcheck source=/home/soma/gnamba-project/.sync-config
    source "$ROOT_DIR/.sync-config"
fi

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $*" >&2; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $*" >&2; }
log_error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }
log_step() { echo -e "${BLUE}[STEP]${NC} $*" >&2; }

die() {
    log_error "$*"
    exit 1
}

usage() {
    cat <<EOF
Monitoring des environnements EGS

USAGE:
    $0 <command> [options]

COMMANDES:
    status          État actuel de tous les environnements
    watch           Surveillance continue
    health          Tests de santé détaillés
    alert           Vérifier et envoyer des alertes
    report          Générer un rapport de monitoring

OPTIONS:
    --env <env>     Environnement spécifique (local-dev, local-server)
    --interval <s>  Intervalle de surveillance en secondes (défaut: 300)
    --webhook <url> URL webhook pour les notifications

EXEMPLES:
    $0 status
    $0 watch --env local-server
    $0 health --env local-server
    $0 report

EOF
}

# État actuel des environnements
show_status() {
    local env_filter="${1:-all}"

    log_step "État des environnements EGS"
    echo "Timestamp: $(date)"
    echo "========================================"

    for env_entry in "${ENVIRONMENTS[@]}"; do
        local env="${env_entry%%:*}"
        local url="${env_entry#*:}"

        # Filtrer si demandé
        if [[ "$env_filter" != "all" && "$env_filter" != "$env" ]]; then
            continue
        fi

        echo
        echo "🏗️  $env ($url)"
        echo "   Statut: $(get_env_status "$env")"
        echo "   Uptime: $(get_env_uptime "$env")"
        echo "   DB: $(get_db_status "$env")"
        echo "   Dernière vérif: $(get_last_check "$env")"
    done

    echo
    echo "========================================"
}

# Obtenir le statut d'un environnement
get_env_status() {
    local env="$1"
    local health_check="${HEALTH_CHECKS[$env]}"

    if [[ -z "$health_check" ]]; then
        echo "❓ Non configuré"
        return
    fi

    if eval "$health_check" 2>/dev/null; then
        echo "✅ En ligne"
    else
        echo "❌ Hors ligne"
    fi
}

# Obtenir l'uptime d'un environnement
get_env_uptime() {
    local env="$1"
    local uptime_file="$ROOT_DIR/.uptime_$env"

    if [[ -f "$uptime_file" ]]; then
        local last_up
        last_up=$(cat "$uptime_file")
        local now
        now=$(date +%s)
        local uptime=$((now - last_up))

        if [[ $uptime -lt 3600 ]]; then
            echo "$((uptime / 60))m"
        elif [[ $uptime -lt 86400 ]]; then
            echo "$((uptime / 3600))h"
        else
            echo "$((uptime / 86400))j"
        fi
    else
        echo "N/A"
    fi
}

# Obtenir le statut de la base de données
get_db_status() {
    local env="$1"

    case "$env" in
        local-dev)
            if supabase status 2>/dev/null | grep -q "running"; then
                echo "✅ Local"
            else
                echo "❌ Local"
            fi
            ;;
        local-server)
            if supabase status 2>/dev/null | grep -q "running"; then
                echo "✅ Tunnel"
            else
                echo "❌ Tunnel"
            fi
            ;;
        *)
            echo "❓ Inconnu"
            ;;
    esac
}

# Obtenir la dernière vérification
get_last_check() {
    local env="$1"
    local check_file="$ROOT_DIR/.check_$env"

    if [[ -f "$check_file" ]]; then
        local last_check
        last_check=$(stat -c %Y "$check_file" 2>/dev/null || stat -f %m "$check_file" 2>/dev/null || echo "")
        if [[ -n "$last_check" ]]; then
            local now
            now=$(date +%s)
            local ago=$((now - last_check))

            if [[ $ago -lt 60 ]]; then
                echo "il y a ${ago}s"
            elif [[ $ago -lt 3600 ]]; then
                echo "il y a $((ago / 60))m"
            else
                echo "il y a $((ago / 3600))h"
            fi
        else
            echo "N/A"
        fi
    else
        echo "Jamais"
    fi
}

# Surveillance continue
watch_environments() {
    local env_filter="${1:-all}"
    local interval="${2:-300}"

    log_step "Surveillance continue (intervalle: ${interval}s)"
    log_info "Ctrl+C pour arrêter"

    # Initialiser les fichiers de statut
    for env_entry in "${ENVIRONMENTS[@]}"; do
        local env="${env_entry%%:*}"
        if [[ "$env_filter" == "all" || "$env_filter" == "$env" ]]; then
            touch "$ROOT_DIR/.check_$env"
        fi
    done

    while true; do
        # Vérifier chaque environnement
        for env_entry in "${ENVIRONMENTS[@]}"; do
            local env="${env_entry%%:*}"
            local url="${env_entry#*:}"

            # Filtrer si demandé
            if [[ "$env_filter" != "all" && "$env_filter" != "$env" ]]; then
                continue
            fi

            local status
            status=$(get_env_status "$env")

            # Mettre à jour l'uptime si en ligne
            if [[ "$status" == "✅ En ligne" ]]; then
                date +%s > "$ROOT_DIR/.uptime_$env"
            fi

            # Mettre à jour le timestamp de vérification
            touch "$ROOT_DIR/.check_$env"

            # Afficher le statut
            echo "$(date '+%H:%M:%S') - $env: $status"
        done

        # Vérifier les alertes
        check_alerts "$env_filter"

        # Attendre l'intervalle
        sleep "$interval"
    done
}

# Tests de santé détaillés
run_health_checks() {
    local env_filter="${1:-all}"

    log_step "Tests de santé détaillés"

    for env_entry in "${ENVIRONMENTS[@]}"; do
        local env="${env_entry%%:*}"
        local url="${env_entry#*:}"

        # Filtrer si demandé
        if [[ "$env_filter" != "all" && "$env_filter" != "$env" ]]; then
            continue
        fi

        echo
        echo "🔍 Tests pour $env ($url)"
        echo "========================================"

        # Test de connectivité HTTP
        echo "HTTP Connectivity:"
        if curl -s --max-time 10 "$url" >/dev/null 2>&1; then
            echo "   ✅ Page d'accueil accessible"
        else
            echo "   ❌ Page d'accueil inaccessible"
        fi

        # Test de l'API Supabase
        echo "Supabase API:"
        local api_status
        api_status=$(test_supabase_api "$env")
        echo "   $api_status"

        # Test de la base de données
        echo "Database:"
        local db_status
        db_status=$(test_database "$env")
        echo "   $db_status"

        # Test des fonctionnalités critiques
        echo "Critical Features:"
        test_critical_features "$env"

        # Performance
        echo "Performance:"
        test_performance "$env"

        echo "========================================"
    done
}

# Tester l'API Supabase
test_supabase_api() {
    local env="$1"

    case "$env" in
        local-dev)
            local api_url="${VITE_SUPABASE_LOCAL_URL:-http://localhost:8000}"
            if curl -s --max-time 5 "$api_url/rest/v1/" >/dev/null 2>&1; then
                echo "✅ API locale accessible"
            else
                echo "❌ API locale inaccessible"
            fi
            ;;
        local-server)
            local api_url="${VITE_SUPABASE_LOCAL_URL:-http://localhost:8000}"
            local api_key
            api_key=$(grep "VITE_SUPABASE_LOCAL_ANON_KEY" "$ROOT_DIR/.env.server" | cut -d'=' -f2 || echo "")

            if [[ -n "$api_key" ]] && curl -s --max-time 5 "$api_url/rest/v1/" -H "apikey: $api_key" >/dev/null 2>&1; then
                echo "✅ API tunnel accessible"
            else
                echo "❌ API tunnel inaccessible"
            fi
            ;;
        *)
            echo "❓ Test non configuré"
            ;;
    esac
}

# Tester la base de données
test_database() {
    local env="$1"

    case "$env" in
        local-dev)
            if supabase status 2>/dev/null | grep -q "running"; then
                echo "✅ DB locale opérationnelle"
            else
                echo "❌ DB locale arrêtée"
            fi
            ;;
        local-server)
            if supabase status 2>/dev/null | grep -q "running"; then
                echo "✅ DB tunnel opérationnelle"
            else
                echo "❌ DB tunnel arrêtée"
            fi
            ;;
        *)
            echo "❓ Test non configuré"
            ;;
    esac
}

# Tester les fonctionnalités critiques
test_critical_features() {
    local env="$1"

    # Test de la page de login
    local login_url
    case "$env" in
        local-dev) login_url="http://localhost:8080/login" ;;
        local-server) login_url="http://localhost/login" ;;
        *) return ;;
    esac

    if curl -s --max-time 10 "$login_url" | grep -q "login"; then
        echo "   ✅ Page de login accessible"
    else
        echo "   ❌ Page de login inaccessible"
    fi

    # Test d'une requête API simple (si possible)
    # Ici on pourrait ajouter des tests plus spécifiques selon les endpoints disponibles
}

# Tester les performances
test_performance() {
    local env="$1"
    local url

    case "$env" in
        local-dev) url="http://localhost:8080" ;;
        local-server) url="https://gnambaservices.ci" ;;
        *) return ;;
    esac

    local response_time
    response_time=$(curl -s -w "%{time_total}" -o /dev/null "$url" 2>/dev/null || echo "N/A")

    if [[ "$response_time" != "N/A" ]]; then
        local time_ms
        time_ms=$(printf "%.0f" "$(echo "$response_time * 1000" | bc -l 2>/dev/null || echo "0")")

        if [[ $time_ms -lt 1000 ]]; then
            echo "   ✅ Temps de réponse: ${time_ms}ms"
        elif [[ $time_ms -lt 3000 ]]; then
            echo "   ⚠️  Temps de réponse: ${time_ms}ms (lent)"
        else
            echo "   ❌ Temps de réponse: ${time_ms}ms (très lent)"
        fi
    else
        echo "   ❌ Impossible de mesurer le temps de réponse"
    fi
}

# Vérifier les alertes
check_alerts() {
    local env_filter="${1:-all}"

    # Vérifier les environnements hors ligne
    for env_entry in "${ENVIRONMENTS[@]}"; do
        local env="${env_entry%%:*}"

        # Filtrer si demandé
        if [[ "$env_filter" != "all" && "$env_filter" != "$env" ]]; then
            continue
        fi

        local status
        status=$(get_env_status "$env")

        if [[ "$status" == "❌ Hors ligne" ]]; then
            send_alert "Environment $env is DOWN" "L'environnement $env n'est pas accessible"
        fi
    done
}

# Envoyer une alerte
send_alert() {
    local title="$1"
    local message="$2"

    log_error "ALERTE: $title - $message"

    # Si un webhook est configuré, l'utiliser
    if [[ -n "${MONITORING_WEBHOOK:-}" ]]; then
        curl -s -X POST "$MONITORING_WEBHOOK" \
             -H "Content-Type: application/json" \
             -d "{\"title\": \"$title\", \"message\": \"$message\"}" >/dev/null 2>&1 || true
    fi
}

# Générer un rapport de monitoring
generate_report() {
    local report_file="$ROOT_DIR/reports/monitoring-$(date +%Y%m%d-%H%M%S).md"

    mkdir -p "$ROOT_DIR/reports"

    log_step "Génération du rapport de monitoring: $report_file"

    {
        echo "# Rapport de Monitoring EGS"
        echo "Généré le: $(date)"
        echo

        echo "## Résumé"
        echo

        # Compter les environnements en ligne/hors ligne
        local online=0
        local offline=0

        for env_entry in "${ENVIRONMENTS[@]}"; do
            local env="${env_entry%%:*}"
            local status
            status=$(get_env_status "$env")

            if [[ "$status" == "✅ En ligne" ]]; then
                ((online++))
            else
                ((offline++))
            fi
        done

        echo "- Environnements en ligne: $online"
        echo "- Environnements hors ligne: $offline"
        echo

        echo "## Détail par environnement"
        echo

        for env_entry in "${ENVIRONMENTS[@]}"; do
            local env="${env_entry%%:*}"
            local url="${env_entry#*:}"

            echo "### $env ($url)"
            echo "- Statut: $(get_env_status "$env")"
            echo "- Uptime: $(get_env_uptime "$env")"
            echo "- Base de données: $(get_db_status "$env")"
            echo "- Dernière vérification: $(get_last_check "$env")"
            echo
        done

        echo "## Tests de santé"
        echo
        # Ici on pourrait ajouter les résultats détaillés des tests de santé

        echo "## Recommandations"
        echo
        if [[ $offline -gt 0 ]]; then
            echo "- ⚠️  $offline environnement(s) hors ligne - investigation requise"
        fi

        if [[ $online -eq ${#ENVIRONMENTS[@]} ]]; then
            echo "- ✅ Tous les environnements opérationnels"
        fi

    } > "$report_file"

    log_info "Rapport généré: $report_file"
}

# Fonction principale
main() {
    local command="${1:-}"

    case "$command" in
        status)
            show_status "${2:-all}"
            ;;
        watch)
            local env="all"
            local interval="300"

            shift
            while [[ $# -gt 0 ]]; do
                case $1 in
                    --env) env="$2"; shift ;;
                    --interval) interval="$2"; shift ;;
                    *) die "Option inconnue: $1" ;;
                esac
                shift
            done

            watch_environments "$env" "$interval"
            ;;
        health)
            local env="all"
            shift
            while [[ $# -gt 0 ]]; do
                case $1 in
                    --env) env="$2"; shift ;;
                    *) die "Option inconnue: $1" ;;
                esac
                shift
            done

            run_health_checks "$env"
            ;;
        alert)
            check_alerts "${2:-all}"
            ;;
        report)
            generate_report
            ;;
        *)
            usage
            exit 1
            ;;
    esac
}

# Point d'entrée
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
