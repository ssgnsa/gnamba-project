#!/usr/bin/env bash

# ============================================
# WORKFLOW DE SYNCHRONISATION EGS
# Synchronisation parfaite entre Local ↔ Cloud
# ============================================
# URLs cibles:
# - https://gnambaservices.ci/ (Production Cloud)
# - http://192.168.1.58/login (Serveur Local)
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
    ["local-server"]="http://192.168.1.58/login"
    ["cloud-prod"]="https://gnambaservices.ci/"
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
Workflow de synchronisation EGS - Local ↔ Cloud

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
    local-server        http://192.168.1.58/login (serveur local)
    cloud-prod          https://gnambaservices.ci/ (production)

EXEMPLES:
    $0 status
    $0 sync local-dev cloud-prod
    $0 deploy local-server
    $0 backup cloud-prod
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

    # État du serveur local
    echo "🏠 SERVEUR LOCAL (192.168.1.58)"
    if server_reachable "192.168.1.58" 80; then
        echo "   ✅ Serveur: Accessible"
    else
        echo "   ❌ Serveur: Inaccessible"
    fi
    echo

    # État de la production cloud
    echo "☁️  PRODUCTION CLOUD (gnambaservices.ci)"
    if cloud_reachable; then
        echo "   ✅ Cloud: Accessible"
    else
        echo "   ❌ Cloud: Inaccessible"
    fi
    echo

    # État des bases de données
    echo "🗄️  BASES DE DONNÉES"
    echo "   Local: $(get_db_status "local")"
    echo "   Cloud: $(get_db_status "cloud")"
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
    curl -s --max-time 10 "https://gnambaservices.ci/" >/dev/null 2>&1
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

# Vérifie si la DB cloud est accessible
cloud_db_reachable() {
    # Test de connexion à la DB cloud via les credentials
    # Cette fonction devrait être implémentée selon vos credentials
    curl -s --max-time 5 "https://thykrnoqgylrbfupophs.supabase.co/rest/v1/" \
         -H "apikey: $(get_cloud_api_key)" >/dev/null 2>&1
}

# Récupère la clé API cloud depuis .env.server
get_cloud_api_key() {
    grep "VITE_SUPABASE_ANON_KEY" "$ROOT_DIR/.env.server" | cut -d'=' -f2
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
        die "Source et target ne peuvent pas être identiques"
    fi

    # Créer un backup de la source
    log_info "Création d'un backup de $source..."
    create_backup "$source"

    # Selon le type de synchronisation
    case "$source-$target" in
        "local-dev-local-server")
            sync_local_to_server
            ;;
        "local-dev-cloud-prod")
            sync_local_to_cloud
            ;;
        "local-server-cloud-prod")
            sync_server_to_cloud
            ;;
        "cloud-prod-local-dev")
            sync_cloud_to_local
            ;;
        "cloud-prod-local-server")
            sync_cloud_to_server
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
        cloud-prod)
            # Backup de la DB cloud
            backup_cloud_db "$backup_file"
            ;;
    esac

    log_info "Backup créé: $backup_file"
}

# Backup de la DB cloud
backup_cloud_db() {
    local output_file="$1"

    # Utiliser pg_dump avec les credentials cloud
    local db_url
    db_url=$(get_cloud_db_url)

    if [[ -z "$db_url" ]]; then
        die "URL de base de données cloud non configurée"
    fi

    pg_dump "$db_url" > "$output_file"
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

get_cloud_db_url() {
    local supabase_url
    local password
    supabase_url=$(read_env_value "$ROOT_DIR/.env.server" "VITE_SUPABASE_URL" || true)
    password=$(read_env_value "$ROOT_DIR/.env.server" "SUPABASE_DB_PASSWORD" || true)

    if [[ -z "$supabase_url" || -z "$password" ]]; then
        die "VITE_SUPABASE_URL ou SUPABASE_DB_PASSWORD introuvable dans .env.server"
    fi

    local project_ref
    project_ref=$(parse_project_ref_from_url "$supabase_url")
    if [[ -z "$project_ref" ]]; then
        die "Impossible de parser le project ref depuis VITE_SUPABASE_URL"
    fi

    echo "postgresql://postgres:${password}@db.${project_ref}.supabase.co:5432/postgres"
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

    log_info "Aucun transfert de base de données requis : local-server utilise déjà la base cloud"
}

sync_local_to_cloud() {
    log_info "Synchronisation développement local → production cloud"

    build_for_production
    if ! supabase_local_running; then
        supabase start
    fi

    local dump_file="$ROOT_DIR/.sync/local-to-cloud-$(date +%Y%m%d_%H%M%S).sql"
    dump_remote_database "$(get_local_db_url)" "$dump_file"
    restore_database "$(get_cloud_db_url)" "$dump_file"

    deploy_to_cloud
}

sync_server_to_cloud() {
    log_info "Synchronisation serveur local → production cloud"
    log_info "Le serveur local utilise déjà la base cloud. Le déploiement cloud sera exécuté."
    build_for_production
    deploy_to_cloud
}

sync_cloud_to_local() {
    log_info "Synchronisation production cloud → développement local"

    if ! supabase_local_running; then
        supabase start
    fi

    local dump_file="$ROOT_DIR/.sync/cloud-to-local-$(date +%Y%m%d_%H%M%S).sql"
    dump_remote_database "$(get_cloud_db_url)" "$dump_file"
    restore_database "$(get_local_db_url)" "$dump_file"
}

sync_cloud_to_server() {
    log_info "Synchronisation production cloud → serveur local"
    log_info "La base de données est partagée ; redéploiement du frontend local-server."
    build_for_production
    stop_local_server
    start_local_server
}

sync_server_to_local() {
    log_info "Synchronisation serveur local → développement local"
    sync_cloud_to_local
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
deploy_to_cloud() {
    log_info "Déploiement vers le cloud..."

    local deploy_method="${ENV_CONFIG["cloud-prod:deploy_method"]:-manual}"
    case "$deploy_method" in
        rsync)
            deploy_cloud_via_rsync
            ;;
        ftp)
            deploy_cloud_via_ftp
            ;;
        manual|*)
            log_warn "Déploiement cloud manuel requis"
            log_info "Fichiers buildés dans: $ROOT_DIR/dist/"
            log_info "Déployez manuellement vers gnambaservices.ci"
            ;;
    esac
}

deploy_cloud_via_rsync() {
    local host="${ENV_CONFIG["cloud-prod:deploy_host"]:-}"
    local path="${ENV_CONFIG["cloud-prod:deploy_path"]:-}"
    local user="${ENV_CONFIG["cloud-prod:deploy_user"]:-}"

    if [[ -z "$host" || -z "$path" ]]; then
        die "cloud-prod:deploy_host ou cloud-prod:deploy_path non configuré dans .sync-config"
    fi

    if [[ -z "$user" ]]; then
        user="$USER"
    fi

    log_info "Déploiement cloud via rsync vers $user@$host:$path"
    rsync -avz --delete --exclude='.git' --exclude='node_modules' "$ROOT_DIR/dist/" "$user@$host:$path"
}

deploy_cloud_via_ftp() {
    log_warn "Déploiement FTP non configuré"
    log_info "Ajoutez les paramètres FTP dans .sync-config pour activer cette option."
}

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
        cloud-prod)
            deploy_cloud_prod
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
    export VITE_SUPABASE_LOCAL_URL=http://localhost:54321

    if [[ -z "${VITE_SUPABASE_LOCAL_ANON_KEY:-}" ]]; then
        log_warn "VITE_SUPABASE_LOCAL_ANON_KEY n'est pas défini. Assurez-vous que .env local contient la clé appropriée."
    fi

    # Démarrer le serveur de développement
    npm run dev
}

deploy_local_server() {
    log_info "Déploiement serveur local..."
    cd "$ROOT_DIR"

    # Build pour production
    build_for_production

    # Configurer pour le serveur local
    export WEB_PORT=80
    export VITE_SUPABASE_MODE=cloud  # Le serveur local utilise le cloud

    # Démarrer le container serveur
    start_local_server
}

deploy_cloud_prod() {
    log_info "Déploiement production cloud..."
    cd "$ROOT_DIR"

    # Build pour production
    build_for_production

    # Déployer les fichiers (manuel pour l'instant)
    log_warn "Déploiement cloud manuel requis vers gnambaservices.ci"
    log_info "Fichiers buildés dans: $ROOT_DIR/dist/"
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
    local_key=$(grep "VITE_SUPABASE_ANON_KEY" "$local_env" | cut -d'=' -f2 || echo "")
    server_key=$(grep "VITE_SUPABASE_ANON_KEY" "$server_env" | cut -d'=' -f2 || echo "")

    if [[ "$local_key" != "$server_key" ]]; then
        log_warn "Clés API différentes entre local et serveur"
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

    # Tester 192.168.1.58
    if ! server_reachable "192.168.1.58" 80; then
        log_warn "192.168.1.58:80 non accessible"
        ((accessible++))
    fi

    # Tester gnambaservices.ci
    if ! cloud_reachable; then
        log_warn "gnambaservices.ci non accessible"
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