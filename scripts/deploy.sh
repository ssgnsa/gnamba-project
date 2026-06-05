#!/usr/bin/env bash

# ============================================
# SCRIPT DE DÉPLOIEMENT AUTOMATISÉ EGS
# ============================================
# Déploie automatiquement vers les environnements cibles
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
Script de déploiement automatisé EGS

USAGE:
    $0 <environment> [options]

ENVIRONMENTS:
    local-dev       http://localhost:8080/login
    local-server    http://192.168.1.58/login
    cloud-prod      https://gnambaservices.ci/

OPTIONS:
    --dry-run       Simulation du déploiement
    --force         Forcer le déploiement sans vérifications
    --backup        Créer un backup avant déploiement
    --rollback      Préparer un rollback en cas d'échec

EXEMPLES:
    $0 local-dev
    $0 local-server --backup
    $0 cloud-prod --dry-run

EOF
}

# Fonction principale de déploiement
deploy() {
    local env="$1"
    local dry_run=false
    local force=false
    local backup=false
    local rollback=false

    # Parser les options
    shift
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run) dry_run=true ;;
            --force) force=true ;;
            --backup) backup=true ;;
            --rollback) rollback=true ;;
            *) die "Option inconnue: $1" ;;
        esac
        shift
    done

    log_step "Déploiement vers $env"
    if [[ "$dry_run" == true ]]; then
        log_info "MODE DRY-RUN: Simulation uniquement"
    fi

    # Pré-vérifications
    if [[ "$force" != true ]]; then
        run_pre_checks "$env"
    fi

    # Backup si demandé
    if [[ "$backup" == true ]]; then
        create_backup "$env" "$dry_run"
    fi

    # Préparer le rollback si demandé
    if [[ "$rollback" == true ]]; then
        prepare_rollback "$env" "$dry_run"
    fi

    # Exécuter le déploiement selon l'environnement
    case "$env" in
        local-dev)
            deploy_local_dev "$dry_run"
            ;;
        local-server)
            deploy_local_server "$dry_run"
            ;;
        cloud-prod)
            deploy_cloud_prod "$dry_run"
            ;;
        *)
            die "Environnement inconnu: $env"
            ;;
    esac

    # Vérifications post-déploiement
    run_post_checks "$env" "$dry_run"

    # Nettoyer les anciens backups
    cleanup_old_backups "$dry_run"

    log_info "Déploiement vers $env terminé ✓"
}

# Vérifications pré-déploiement
run_pre_checks() {
    local env="$1"

    log_step "Vérifications pré-déploiement pour $env"

    # Vérifier que les fichiers de configuration existent
    check_config_files

    # Vérifier que le build est à jour
    check_build_freshness "$env"

    # Vérifier la connectivité
    check_connectivity "$env"

    # Vérifier les permissions
    check_permissions "$env"

    log_info "Pré-vérifications passées ✓"
}

# Vérifier les fichiers de configuration
check_config_files() {
    local missing_files=()

    for file in "${CONFIG_FILES[@]}"; do
        if [[ ! -f "$ROOT_DIR/$file" ]]; then
            missing_files+=("$file")
        fi
    done

    if [[ ${#missing_files[@]} -gt 0 ]]; then
        log_error "Fichiers de configuration manquants:"
        printf '  - %s\n' "${missing_files[@]}"
        die "Configuration incomplète"
    fi
}

# Vérifier que le build est récent
check_build_freshness() {
    local env="$1"
    local build_dir="${ENV_CONFIG[${env}:build_dir]:-dist}"
    local dist_dir="$ROOT_DIR/$build_dir"

    if [[ ! -d "$dist_dir" ]]; then
        log_warn "Dossier de build manquant: $dist_dir"
        log_info "Lancement du build..."
        cd "$ROOT_DIR"
        npm run build
    else
        # Vérifier si le build est plus vieux que les sources
        local latest_source
        local latest_build
        latest_source=$(
            find "$ROOT_DIR/src" -type f \
                \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
                -printf '%T@ %p\n' \
                | sort -nr \
                | awk 'NR == 1 { sub(/^[^ ]+ /, "", $0); print; }'
        )
        latest_build=$(
            find "$dist_dir" -type f -name "*.js" \
                -printf '%T@ %p\n' \
                | sort -nr \
                | awk 'NR == 1 { sub(/^[^ ]+ /, "", $0); print; }'
        )

        if [[ -n "$latest_source" && -n "$latest_build" ]]; then
            if [[ "$latest_source" -nt "$latest_build" ]]; then
                log_warn "Build obsolète détecté"
                log_info "Rebuild nécessaire..."
                cd "$ROOT_DIR"
                npm run build
            fi
        fi
    fi
}

# Vérifier la connectivité
check_connectivity() {
    local env="$1"
    local health_check="${HEALTH_CHECKS[$env]}"

    if [[ -n "$health_check" ]]; then
        log_info "Test de connectivité..."
        if ! eval "$health_check" 2>/dev/null; then
            log_warn "Connectivité $env défaillante - déploiement possible"
        else
            log_info "Connectivité $env OK"
        fi
    fi
}

# Vérifier les permissions
check_permissions() {
    local env="$1"

    # Pour la production, vérifier les credentials
    if [[ "$env" == "cloud-prod" ]]; then
        if [[ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
            die "SUPABASE_SERVICE_ROLE_KEY non défini pour le déploiement cloud"
        fi
    fi
}

# Valider l'artefact frontend généré par le build
validate_frontend_release_artifacts() {
    local env="$1"
    local build_dir="${ENV_CONFIG[${env}:build_dir]:-dist}"
    local html_file="$ROOT_DIR/$build_dir/index.html"

    if [[ ! -f "$html_file" ]]; then
        die "Artefact frontend introuvable: $html_file"
    fi

    log_info "Validation de l'artefact frontend: $html_file"
    bash "$ROOT_DIR/scripts/validate-frontend-release.sh" --html "$html_file" --strict
}

# Valider la version déployée sur les URLs publiques
validate_frontend_release_live() {
    local env="$1"
    local build_dir="${ENV_CONFIG[${env}:build_dir]:-dist}"
    local html_file="$ROOT_DIR/$build_dir/index.html"
    local urls=()

    case "$env" in
        local-server)
            urls=("http://192.168.1.58/")
            ;;
        cloud-prod)
            urls=("https://gnambaservices.ci/" "https://www.gnambaservices.ci/")
            ;;
        *)
            return 0
            ;;
    esac

    if [[ ! -f "$html_file" ]]; then
        die "Impossible de valider le live sans artefact buildé: $html_file"
    fi

    log_info "Validation live du frontend déployé pour $env"
    local args=(--html "$html_file" --strict)
    local url
    for url in "${urls[@]}"; do
        args+=(--url "$url")
    done

    bash "$ROOT_DIR/scripts/validate-frontend-release.sh" "${args[@]}"
}

# Créer un backup
create_backup() {
    local env="$1"
    local dry_run="$2"

    log_step "Création d'un backup pour $env"

    if [[ "$dry_run" == true ]]; then
        log_info "[DRY-RUN] Backup simulé"
        return
    fi

    local timestamp
    timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_dir="$ROOT_DIR/backups/$env"
    local backup_file="$backup_dir/backup_$timestamp.sql"

    mkdir -p "$backup_dir"

    case "$env" in
        local-dev)
            log_info "Backup Supabase local..."
            supabase db dump -f "$backup_file"
            ;;
        local-server)
            log_info "Backup base serveur local..."
            # Implémentation selon votre setup serveur
            log_warn "Backup serveur local non automatisé"
            ;;
        cloud-prod)
            log_info "Backup base cloud..."
            local db_url="${ENV_CONFIG["cloud-prod:db_url"]}"
            if [[ -n "$db_url" ]]; then
                pg_dump "$db_url" > "$backup_file"
            else
                log_warn "URL DB cloud non configurée"
            fi
            ;;
    esac

    log_info "Backup créé: $backup_file"
}

# Préparer un rollback
prepare_rollback() {
    local env="$1"
    local dry_run="$2"

    log_step "Préparation du rollback pour $env"

    if [[ "$dry_run" == true ]]; then
        log_info "[DRY-RUN] Rollback simulé"
        return
    fi

    # Créer un point de rollback
    local rollback_dir="$ROOT_DIR/rollbacks/$env"
    mkdir -p "$rollback_dir"

    # Sauvegarder l'état actuel
    local timestamp
    timestamp=$(date +%Y%m%d_%H%M%S)
    local rollback_file="$rollback_dir/rollback_$timestamp.tar.gz"

    log_info "Création du point de rollback: $rollback_file"

    # Archiver l'état actuel selon l'environnement
    case "$env" in
        local-dev)
            # Sauvegarder les fichiers locaux
            tar -czf "$rollback_file" -C "$ROOT_DIR" dist-local/ 2>/dev/null || true
            ;;
        local-server)
            # Pour le serveur, on ne peut pas facilement rollback
            log_warn "Rollback serveur limité - backup manuel recommandé"
            ;;
        cloud-prod)
            # Pour le cloud, rollback via backup
            log_warn "Rollback cloud via backup - déploiement manuel requis"
            ;;
    esac
}

# Déploiement développement local
deploy_local_dev() {
    local dry_run="$1"

    log_step "Déploiement développement local"

    if [[ "$dry_run" == true ]]; then
        log_info "[DRY-RUN] Démarrage simulé du serveur dev"
        return
    fi

    cd "$ROOT_DIR"

    # S'assurer que Supabase local est démarré
    if ! supabase status 2>/dev/null | grep -q "running"; then
        log_info "Démarrage de Supabase local..."
        supabase start
    fi

    # Configurer l'environnement
    export VITE_SUPABASE_MODE=local
    export VITE_SUPABASE_LOCAL_URL=http://localhost:54321

    # Le token local doit provenir de votre fichier .env ou de la variable d'environnement
    if [[ -z "${VITE_SUPABASE_LOCAL_ANON_KEY:-}" ]]; then
        log_warn "VITE_SUPABASE_LOCAL_ANON_KEY n'est pas défini. Assurez-vous que .env local contient la clé appropriée."
    fi

    # Démarrer le serveur de développement en arrière-plan
    log_info "Démarrage du serveur de développement..."
    nohup npm run dev > logs/dev-server.log 2>&1 &

    log_info "Serveur dev démarré sur http://localhost:8080"
}

# Déploiement serveur local
deploy_local_server() {
    local dry_run="$1"

    log_step "Déploiement serveur local (192.168.1.58)"

    if [[ "$dry_run" == true ]]; then
        log_info "[DRY-RUN] Déploiement serveur simulé"
        return
    fi

    cd "$ROOT_DIR"

    # Build pour production
    log_info "Build pour production..."
    npm run build

    validate_frontend_release_artifacts "local-server"

    # Configurer pour le serveur local
    export WEB_PORT=80
    export VITE_SUPABASE_MODE=cloud

    # Arrêter le serveur actuel
    log_info "Arrêt du serveur actuel..."
    docker-compose -f docker-compose.server.yml down 2>/dev/null || true

    # Démarrer le nouveau serveur
    log_info "Démarrage du nouveau serveur..."
    WEB_PORT=80 docker-compose -f docker-compose.server.yml up -d

    log_info "Serveur local déployé sur http://192.168.1.58"
}

# Déploiement production cloud
deploy_cloud_prod() {
    local dry_run="$1"

    log_step "Déploiement production cloud (gnambaservices.ci)"

    if [[ "$dry_run" == true ]]; then
        log_info "[DRY-RUN] Déploiement cloud simulé"
        log_info "[DRY-RUN] Fichiers seraient déployés vers gnambaservices.ci"
        return
    fi

    # Vérifier l'approbation pour la prod
    if [[ "$REQUIRE_APPROVAL" == true ]]; then
        log_warn "APPROBATION REQUISE pour le déploiement en production"
        read -p "Confirmer le déploiement en production ? (oui/non): " -r
        if [[ ! "$REPLY" =~ ^[Oo][Uu][Ii]$ ]]; then
            die "Déploiement annulé par l'utilisateur"
        fi
    fi

    cd "$ROOT_DIR"

    # Build pour production
    log_info "Build pour production..."
    npm run build

    validate_frontend_release_artifacts "cloud-prod"

    # Déploiement selon la méthode configurée
    local deploy_method="${ENV_CONFIG["cloud-prod:deploy_method"]}"

    case "$deploy_method" in
        manual)
            log_info "Déploiement manuel requis"
            log_info "Fichiers buildés dans: $ROOT_DIR/dist/"
            log_info "Déployez manuellement vers gnambaservices.ci"
            ;;
        ftp)
            deploy_via_ftp
            ;;
        rsync)
            deploy_via_rsync
            ;;
        *)
            die "Méthode de déploiement inconnue: $deploy_method"
            ;;
    esac
}

# Déploiement via FTP
deploy_via_ftp() {
    log_warn "Déploiement FTP non configuré"
    log_info "Ajoutez la configuration FTP dans .sync-config si vous souhaitez automatiser cette méthode."
}

# Déploiement via rsync
deploy_via_rsync() {
    local host="${ENV_CONFIG["cloud-prod:deploy_host"]:-}"
    local path="${ENV_CONFIG["cloud-prod:deploy_path"]:-}"
    local user="${ENV_CONFIG["cloud-prod:deploy_user"]:-}"

    if [[ -z "$host" || -z "$path" ]]; then
        die "Déploiement rsync impossible : cloud-prod:deploy_host ou cloud-prod:deploy_path non configurés"
    fi

    if [[ -z "$user" ]]; then
        user="$USER"
    fi

    log_info "Déploiement rsync vers $user@$host:$path"
    rsync -avz --delete --exclude='.git' --exclude='node_modules' "$ROOT_DIR/dist/" "$user@$host:$path"
    log_info "Déploiement rsync terminé"
}

# Vérifications post-déploiement
run_post_checks() {
    local env="$1"
    local dry_run="$2"

    log_step "Vérifications post-déploiement pour $env"

    if [[ "$dry_run" == true ]]; then
        log_info "[DRY-RUN] Vérifications post-déploiement simulées"
        return
    fi

    # Attendre que le déploiement soit effectif
    sleep 10

    # Tester la connectivité
    local health_check="${HEALTH_CHECKS[$env]}"
    if [[ -n "$health_check" ]]; then
        log_info "Test de l'application déployée..."
        local retries=3
        local success=false

        for ((i=1; i<=retries; i++)); do
            if eval "$health_check" 2>/dev/null; then
                success=true
                break
            fi
            log_warn "Tentative $i/$retries échouée, retry dans 5s..."
            sleep 5
        done

        if [[ "$success" == true ]]; then
            log_info "Application $env accessible ✓"
        else
            log_error "Application $env inaccessible après déploiement"
            return 1
        fi
    fi

    # Vérifier les fonctionnalités critiques
    check_critical_features "$env"

    # Valider le rendu HTML et les headers de cache sur le site réellement servi
    validate_frontend_release_live "$env"
}

# Vérifier les fonctionnalités critiques
check_critical_features() {
    local env="$1"

    log_info "Vérification des fonctionnalités critiques..."

    # Test de connexion à Supabase
    case "$env" in
        local-dev)
            # Tester la connexion locale
            if supabase status 2>/dev/null | grep -q "running"; then
                log_info "Supabase local OK"
            else
                log_warn "Supabase local KO"
            fi
            ;;
        local-server|cloud-prod)
            # Tester la connexion cloud
            local api_url="https://thykrnoqgylrbfupophs.supabase.co"
            local api_key
            api_key=$(grep "VITE_SUPABASE_ANON_KEY" "$ROOT_DIR/.env.server" | cut -d'=' -f2)

            if curl -s --max-time 10 "$api_url/rest/v1/" -H "apikey: $api_key" >/dev/null 2>&1; then
                log_info "Supabase cloud OK"
            else
                log_warn "Supabase cloud KO"
            fi
            ;;
    esac
}

# Nettoyer les anciens backups
cleanup_old_backups() {
    local dry_run="$1"

    if [[ "$dry_run" == true ]]; then
        log_info "[DRY-RUN] Nettoyage des backups simulé"
        return
    fi

    log_info "Nettoyage des anciens backups..."

    # Supprimer les backups plus vieux que BACKUP_RETENTION_DAYS
    find "$ROOT_DIR/backups" -name "*.sql" -type f -mtime +"$BACKUP_RETENTION_DAYS" -delete 2>/dev/null || true
    find "$ROOT_DIR/rollbacks" -name "*.tar.gz" -type f -mtime +"$BACKUP_RETENTION_DAYS" -delete 2>/dev/null || true

    log_info "Anciens backups nettoyés"
}

# Fonction principale
main() {
    local env="${1:-}"

    if [[ -z "$env" ]]; then
        usage
        exit 1
    fi

    # Vérifier que l'environnement est valide
    local valid_env=false
    for e in "${ENVIRONMENTS[@]}"; do
        if [[ "$e" == "$env:"* ]]; then
            valid_env=true
            break
        fi
    done

    if [[ "$valid_env" != true ]]; then
        die "Environnement invalide: $env"
    fi

    deploy "$@"
}

# Point d'entrée
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
