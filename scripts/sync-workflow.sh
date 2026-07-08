#!/usr/bin/env bash

# ============================================
# WORKFLOW DE SYNCHRONISATION EGS
# Synchronisation parfaite entre Développement Local ↔ Serveur Local via tunnel
# ============================================
# URLs cibles:
# - http://localhost/ (Serveur local)
# - http://localhost:8080/login (Développement Local)
# ============================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Charger la configuration si disponible
if [[ -f "$ROOT_DIR/.sync-config" ]]; then
    # shellcheck source=/dev/null
    source "$ROOT_DIR/.sync-config"
fi

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration des environnements
declare -A ENVIRONMENTS=(
    ["local-dev"]="http://localhost:8080/login"
    ["local-server"]="http://localhost/login"
)

# Fonctions utilitaires
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
Workflow de synchronisation EGS - Local ↔ Tunnel

USAGE:
    $0 <command> [options]

COMMANDES:
    status              Affiche l'état de tous les environnements
    sync <source> <target>  Synchronise les données de source vers target
    deploy <env>        Déploie vers l'environnement spécifié
    backup <env>        Crée un backup de l'environnement
    restore <env> <backup>  Restaure un backup dans l'environnement
    verify              Vérifie la cohérence entre tous les environnements

ENVIRONMENTS:
    local-dev           http://localhost:8080/login (développement)
    local-server        https://gnambaservices.ci/login (serveur local)

EXEMPLES:
    $0 status
    $0 sync local-dev local-server
    $0 deploy local-server
    $0 backup local-server
    $0 verify

EOF
}

# Vérifie les prérequis
check_prerequisites() {
    log_step "Vérification des prérequis..."

    # Vérifier les commandes nécessaires
    local commands=("docker" "docker-compose" "supabase" "npm" "node")
    for cmd in "${commands[@]}"; do
        if ! command -v "$cmd" >/dev/null 2>&1; then
            die "Commande requise introuvable: $cmd"
        fi
    done

    # Vérifier les fichiers de configuration
    local config_files=(".env" ".env.server" ".env.local.example")
    for file in "${config_files[@]}"; do
        if [[ ! -f "$ROOT_DIR/$file" ]]; then
            log_warn "Fichier de configuration manquant: $file"
        fi
    done

    log_info "Prérequis vérifiés ✓"
}

# Affiche l'état de tous les environnements
show_status() {
    log_step "Vérification de l'état des environnements..."

    echo "=== ÉTAT DES ENVIRONNEMENTS EGS ==="
    echo

    # État du développement local
    echo "🔧 DÉVELOPPEMENT LOCAL (localhost:8080)"
    if port_listening 8080; then
        echo "   ✅ Frontend: En ligne"
    else
        echo "   ❌ Frontend: Hors ligne"
    fi

    if supabase_local_running; then
        echo "   ✅ Supabase Local: En ligne"
    else
        echo "   ❌ Supabase Local: Hors ligne"
    fi
    echo

    # État du serveur local exposé via tunnel
    echo "🏠 SERVEUR LOCAL (gnambaservices.ci)"
    if server_reachable "gnambaservices.ci" 443; then
        echo "   ✅ Serveur: Accessible"
    else
        echo "   ❌ Serveur: Inaccessible"
    fi
    echo

    # État des bases de données
    echo "🗄️  BASES DE DONNÉES"
    echo "   Local: $(get_db_status "local")"
    echo "   Tunnel: $(get_db_status "local-server")"
    echo

    # Dernières synchronisations
    echo "🔄 DERNIÈRES SYNCHRONISATIONS"
    if [[ -f "$ROOT_DIR/.sync_history" ]]; then
        tail -5 "$ROOT_DIR/.sync_history" 2>/dev/null || echo "   Aucune synchronisation récente"
    else
        echo "   Aucune synchronisation récente"
    fi
}

# Vérifie si un port est ouvert
port_listening() {
    local port="$1"
    nc -z localhost "$port" 2>/dev/null
}

# Vérifie si le serveur est accessible
server_reachable() {
    local host="$1"
    local port="${2:-80}"
    nc -z "$host" "$port" 2>/dev/null
}

# Vérifie si le cloud est accessible
cloud_reachable() {
    curl -s --max-time 10 "http://localhost/" >/dev/null 2>&1
}

# Vérifie l'état des bases de données
get_db_status() {
    local env="$1"
    case "$env" in
        local)
            if supabase_local_running; then
                echo "✅ En ligne"
            else
                echo "❌ Hors ligne"
            fi
            ;;
        cloud)
            if cloud_db_reachable; then
                echo "✅ Accessible"
            else
                echo "❌ Inaccessible"
            fi
            ;;
    esac
}

# Vérifie si Supabase local fonctionne
supabase_local_running() {
    supabase status 2>/dev/null | grep -q "running"
}

# Synchronise les données entre environnements
sync_data() {
    local source="$1"
    local target="$2"

    log_step "Synchronisation $source → $target"

    # Validation des environnements
    validate_environment "$source"
    validate_environment "$target"

    if [[ "$source" == "$target" ]]; then
        log_info "Source et target identiques: aucun transfert requis"
        return 0
    fi

    # Créer un backup de la source
    log_info "Création d'un backup de $source..."
    create_backup "$source"

    # Selon le type de synchronisation
    case "$source-$target" in
        "local-dev-local-server")
            sync_local_to_server
            ;;
        "local-server-local-dev")
            sync_server_to_local
            ;;
        *)
            die "Synchronisation non supportée: $source → $target"
            ;;
    esac

    # Enregistrer la synchronisation
    log_sync "$source" "$target"

    log_info "Synchronisation terminée ✓"
}

# Valide qu'un environnement existe
validate_environment() {
    local env="$1"
    if [[ ! -v ENVIRONMENTS[$env] ]]; then
        die "Environnement inconnu: $env"
    fi
}

# Crée un backup d'un environnement
create_backup() {
    local env="$1"
    local timestamp
    timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_dir="$ROOT_DIR/backups/$env"
    local backup_file="$backup_dir/backup_$timestamp.sql"

    mkdir -p "$backup_dir"

    log_info "Backup $env vers $backup_file"

    case "$env" in
        local-dev|local-server)
            # Backup de la DB locale
            supabase db dump -f "$backup_file"
            ;;
    esac

    log_info "Backup créé: $backup_file"
}

# Trim whitespace, quotes and trailing semicolons
trim() {
    local value="$1"
    value="${value#${value%%[![:space:]]*}}"
    value="${value%${value##*[![:space:]]}}"
    value="${value#\"}"
    value="${value%\"}"
    value="${value%;}"
    value="${value%${value##*[![:space:]]}}"
    echo "$value"
}

read_env_value() {
    local file="$1"
    local key="$2"
    if [[ ! -f "$file" ]]; then
        return 1
    fi
    local line
    line=$(grep -E "^${key}=" "$file" | tail -n 1 || true)
    line="${line#*=}"
    echo "$(trim "$line")"
}

parse_project_ref_from_url() {
    local url="$1"
    echo "$url" | sed -n 's|https://\([^.]*\)\.supabase\.co.*|\1|p'
}

parse_db_password_from_url() {
    local url="$1"
    echo "$url" | sed -n 's|.*postgresql://[^:]*:\([^@]*\)@.*|\1|p'
}

get_local_db_password() {
    local password
    password=$(read_env_value "$ROOT_DIR/.env" "POSTGRES_PASSWORD" || true)
    if [[ -z "$password" ]]; then
        password="postgres"
    fi
    echo "$password"
}

get_local_db_url() {
    local password
    password=$(get_local_db_password)
    echo "postgresql://postgres:${password}@localhost:54322/postgres"
}

dump_remote_database() {
    local db_url="$1"
    local output_file="$2"
    local password

    log_info "Export de la base distante vers $output_file"
    mkdir -p "$(dirname "$output_file")"

    password=$(parse_db_password_from_url "$db_url" || true)
    if [[ -n "$password" ]]; then
        PGPASSWORD="$password" pg_dump --no-owner --no-privileges --clean --if-exists "$db_url" > "$output_file"
    else
        pg_dump --no-owner --no-privileges --clean --if-exists "$db_url" > "$output_file"
    fi
}

restore_database() {
    local db_url="$1"
    local sql_file="$2"
    local password

    if [[ ! -f "$sql_file" ]]; then
        die "Fichier SQL introuvable: $sql_file"
    fi

    log_info "Restauration de $sql_file vers $db_url"
    password=$(parse_db_password_from_url "$db_url" || true)

    if [[ -n "$password" ]]; then
        PGPASSWORD="$password" psql "$db_url" -v ON_ERROR_STOP=1 -f "$sql_file"
    else
        psql "$db_url" -v ON_ERROR_STOP=1 -f "$sql_file"
    fi
}

# Synchronisations spécifiques
sync_local_to_server() {
    log_info "Synchronisation développement local → serveur local"

    build_for_production
    stop_local_server
    start_local_server

    log_info "Aucun transfert de base de données requis : local-server utilise déjà la base locale"
}

sync_server_to_local() {
    log_info "Synchronisation serveur local → développement local"
    sync_local_to_server
}

# Fonctions de gestion du serveur local
stop_local_server() {
    log_info "Arrêt du serveur local..."
    cd "$ROOT_DIR"
    docker-compose -f docker-compose.server.yml down 2>/dev/null || true
}

start_local_server() {
    log_info "Démarrage du serveur local..."
    cd "$ROOT_DIR"
    WEB_PORT=80 docker-compose -f docker-compose.server.yml up -d --build
}

copy_build_to_server() {
    log_info "Copie des fichiers buildés vers le serveur..."
    cd "$ROOT_DIR"
    docker-compose -f docker-compose.server.yml build --no-cache || true
    log_info "Build de l'image du serveur local réalisé"
}

# Fonctions de synchronisation DB
sync_db_local_to_server() {
    log_info "Synchronisation DB local → serveur..."
    log_info "Pas de DB séparée à synchroniser : le serveur local partage la base cloud."
}

sync_db_server_to_cloud() {
    log_info "Synchronisation DB serveur → cloud..."
    log_info "Le serveur local utilise déjà la base cloud. Aucune action DB requise."
}

sync_db_cloud_to_local() {
    log_info "Synchronisation DB cloud → local..."
    sync_cloud_to_local
}

sync_db_cloud_to_server() {
    log_info "Synchronisation DB cloud → serveur..."
    sync_cloud_to_server
}

sync_db_server_to_local() {
    log_info "Synchronisation DB serveur → local..."
    sync_cloud_to_local
}

# Build pour production
build_for_production() {
    log_info "Build pour production..."
    cd "$ROOT_DIR"
    npm run build
}

# Déploiement cloud
# Enregistre une synchronisation
log_sync() {
    local source="$1"
    local target="$2"
    local timestamp
    timestamp=$(date +"%Y-%m-%d %H:%M:%S")

    echo "$timestamp: $source → $target" >> "$ROOT_DIR/.sync_history"
}

# Déploie vers un environnement spécifique
deploy_to_env() {
    local env="$1"

    log_step "Déploiement vers $env"

    case "$env" in
        local-dev)
            deploy_local_dev
            ;;
        local-server)
            deploy_local_server
            ;;
        *)
            die "Environnement de déploiement inconnu: $env"
            ;;
    esac

    log_info "Déploiement vers $env terminé ✓"
}

# Déploiements spécifiques
deploy_local_dev() {
    log_info "Déploiement développement local..."
    cd "$ROOT_DIR"

    # S'assurer que Supabase local est démarré
    if ! supabase_local_running; then
        log_info "Démarrage de Supabase local..."
        supabase start
    fi

    # Configurer pour le mode local
    export VITE_SUPABASE_MODE=local
    export VITE_SUPABASE_LOCAL_URL="${VITE_SUPABASE_LOCAL_URL:-http://localhost:54321}"

    if [[ -z "${VITE_SUPABASE_LOCAL_ANON_KEY:-}" ]]; then
        log_warn "VITE_SUPABASE_LOCAL_ANON_KEY n'est pas défini. Assurez-vous que .env local contient la clé appropriée."
    fi

    # Démarrer le serveur de développement
    bash -lc 'export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"; nvm use 20 >/dev/null 2>&1 || true; npm run dev'
}

deploy_local_server() {
    log_info "Déploiement serveur local..."
    cd "$ROOT_DIR"

    # Build pour production
    build_for_production

    # Configurer pour le serveur local
    export WEB_PORT=80
    export VITE_SUPABASE_MODE=local
    export VITE_SUPABASE_LOCAL_URL="${VITE_SUPABASE_LOCAL_URL:-https://api.gnambaservices.ci}"

    # Démarrer le container serveur
    start_local_server
}

# Vérifie la cohérence entre environnements
verify_consistency() {
    log_step "Vérification de cohérence..."

    local issues=0

    # Vérifier les versions des schémas
    log_info "Vérification des versions de schéma..."
    if ! check_schema_versions; then
        ((issues++))
    fi

    # Vérifier les configurations
    log_info "Vérification des configurations..."
    if ! check_configurations; then
        ((issues++))
    fi

    # Vérifier l'accessibilité
    log_info "Vérification de l'accessibilité..."
    if ! check_accessibility; then
        ((issues++))
    fi

    if [[ $issues -eq 0 ]]; then
        log_info "Tous les environnements sont cohérents ✓"
    else
        log_warn "$issues problème(s) de cohérence détecté(s)"
    fi
}

# Vérifie les versions de schéma
check_schema_versions() {
    # Implémentation à faire
    log_warn "Vérification des schémas non implémentée"
    return 0
}

# Vérifie les configurations
check_configurations() {
    # Vérifier que les .env sont cohérents
    local local_env="$ROOT_DIR/.env"
    local server_env="$ROOT_DIR/.env.server"

    if [[ ! -f "$local_env" ]]; then
        log_error "Fichier .env manquant"
        return 1
    fi

    if [[ ! -f "$server_env" ]]; then
        log_error "Fichier .env.server manquant"
        return 1
    fi

    # Vérifier les clés API
    local local_key
    local server_key
    local_key=$(grep "VITE_SUPABASE_LOCAL_ANON_KEY" "$local_env" | cut -d'=' -f2 || echo "")
    server_key=$(grep "VITE_SUPABASE_LOCAL_ANON_KEY" "$server_env" | cut -d'=' -f2 || echo "")

    if [[ "$local_key" != "$server_key" ]]; then
        log_warn "Clés API locales différentes entre local et serveur"
        return 1
    fi

    return 0
}

# Vérifie l'accessibilité
check_accessibility() {
    local accessible=0

    # Tester localhost:8080
    if ! port_listening 8080; then
        log_warn "localhost:8080 non accessible"
        ((accessible++))
    fi

    # Tester le serveur local exposé via tunnel
    if ! server_reachable "gnambaservices.ci" 443; then
        log_warn "gnambaservices.ci:443 non accessible"
        ((accessible++))
    fi

    return $accessible
}

# Fonction principale
main() {
    local command="${1:-}"

    case "$command" in
        status)
            check_prerequisites
            show_status
            ;;
        sync)
            local source="${2:-}"
            local target="${3:-}"
            if [[ -z "$source" || -z "$target" ]]; then
                die "Usage: $0 sync <source> <target>"
            fi
            check_prerequisites
            sync_data "$source" "$target"
            ;;
        deploy)
            local env="${2:-}"
            if [[ -z "$env" ]]; then
                die "Usage: $0 deploy <env>"
            fi
            check_prerequisites
            deploy_to_env "$env"
            ;;
        backup)
            local env="${2:-}"
            if [[ -z "$env" ]]; then
                die "Usage: $0 backup <env>"
            fi
            check_prerequisites
            create_backup "$env"
            ;;
        verify)
            check_prerequisites
            verify_consistency
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
