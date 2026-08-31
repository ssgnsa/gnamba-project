#!/usr/bin/env bash

# ============================================
# INITIALISATION DU WORKFLOW DE SYNCHRONISATION
# ============================================
# Configure automatiquement tous les environnements
# ============================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

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
Initialisation du Workflow de Synchronisation EGS

USAGE:
    $0 [options]

OPTIONS:
    --force         Forcer la reinitialisation complete
    --skip-tests    Sauter les tests de validation
    --help          Afficher cette aide

EXEMPLES:
    $0              # Initialisation normale
    $0 --force      # Reinitialisation complete

EOF
}

# Fonction principale d'initialisation
initialize_workflow() {
    local force=false
    local skip_tests=false

    # Parser les options
    while [[ $# -gt 0 ]]; do
        case $1 in
            --force) force=true ;;
            --skip-tests) skip_tests=true ;;
            --help) usage; exit 0 ;;
            *) die "Option inconnue: $1" ;;
        esac
        shift
    done

    log_step "Initialisation du Workflow de Synchronisation EGS"

    # Verifier les prerequis
    check_prerequisites

    # Creer la structure de repertoires
    create_directory_structure

    # Configurer les environnements
    configure_environments "$force"

    # Installer les dependances si necessaire
    install_dependencies

    # Tests de validation (sauf si skip)
    if [[ "$skip_tests" != true ]]; then
        run_validation_tests
    fi

    # Creer les raccourcis
    create_shortcuts

    log_info "Workflow initialise avec succes ✓"
    show_next_steps
}

# Verifier les prerequis systeme
check_prerequisites() {
    log_step "Verification des prerequis systeme"

    local missing_deps=()

    # Commandes essentielles
    local commands=("node" "npm" "docker" "docker-compose" "curl" "git")
    for cmd in "${commands[@]}"; do
        if ! command -v "$cmd" >/dev/null 2>&1; then
            missing_deps+=("$cmd")
        fi
    done

    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        log_error "Dependances manquantes:"
        printf '  - %s\n' "${missing_deps[@]}"
        die "Installez les dependances manquantes avant de continuer"
    fi

    # Verifier Node.js version
    local node_version
    node_version=$(node --version | sed 's/v//' | cut -d. -f1)
    if [[ $node_version -lt 18 ]]; then
        die "Node.js 18+ requis (version actuelle: $(node --version))"
    fi

    # Verifier Docker
    if ! docker info >/dev/null 2>&1; then
        die "Docker n'est pas accessible. Demarrez Docker Desktop ou le service Docker."
    fi

    log_info "Prerequis verifies ✓"
}

# Creer la structure de repertoires
create_directory_structure() {
    log_step "Creation de la structure de repertoires"

    local directories=(
        "backups/local-dev"
        "backups/local-server"
        "backups/local-tunnel"
        "rollbacks/local-dev"
        "rollbacks/local-server"
        "rollbacks/local-tunnel"
        "reports"
        "logs"
        ".sync"
    )

    for dir in "${directories[@]}"; do
        if [[ ! -d "$ROOT_DIR/$dir" ]]; then
            mkdir -p "$ROOT_DIR/$dir"
            log_info "Cree: $dir"
        else
            log_info "Existe: $dir"
        fi
    done

    log_info "Structure de repertoires creee ✓"
}

# Configurer les environnements
configure_environments() {
    local force="$1"

    log_step "Configuration des environnements"

    # Configuration developpement local
    configure_local_dev "$force"

    # Configuration serveur local
    configure_local_server "$force"

    # Configuration serveur local exposé via tunnel
    configure_local_tunnel "$force"

    log_info "Environnements configures ✓"
}

# Configurer l'environnement de developpement local
configure_local_dev() {
    local force="$1"

    log_info "Configuration developpement local..."

    local env_file="$ROOT_DIR/.env"

    if [[ -f "$env_file" && "$force" != true ]]; then
        log_info "Fichier .env existe deja (utiliser --force pour ecraser)"
    else
        if [[ ! -f "$ROOT_DIR/.env.local.example" ]]; then
            die "Fichier .env.local.example manquant"
        fi

        cp "$ROOT_DIR/.env.local.example" "$env_file"
        log_info "Cree: .env depuis .env.local.example"

        # Configurer les valeurs specifiques
        configure_env_values "$env_file" "local-dev"
    fi
}

# Configurer l'environnement serveur local
configure_local_server() {
    local force="$1"

    log_info "Configuration serveur local..."

    local env_file="$ROOT_DIR/.env.server"

    if [[ -f "$env_file" && "$force" != true ]]; then
        log_info "Fichier .env.server existe deja (utiliser --force pour ecraser)"
    else
        # Creer un fichier .env.server base sur la configuration locale via tunnel
        cat > "$env_file" << 'EOF'
# Configuration Serveur Local EGS
WEB_PORT=80
VITE_SUPABASE_MODE=local
VITE_SUPABASE_LOCAL_URL=https://api.gnambaservices.ci
VITE_SUPABASE_LOCAL_ANON_KEY=<YOUR_SUPABASE_LOCAL_ANON_KEY>

# Cloudflare Turnstile
VITE_CLOUDFLARE_TURNSTILE_SITE_KEY=<YOUR_TURNSTILE_SITE_KEY>
CLOUDFLARE_TURNSTILE_SECRET_KEY=<YOUR_TURNSTILE_SECRET_KEY>

# Idle timeout
VITE_IDLE_TIMEOUT_MINUTES=30

# FileBrowser
VITE_FILEBROWSER_URL=https://fichiers.gnambaservices.ci

# Service Role Key (pour backups locaux)
JWT_SECRET=<YOUR_SERVICE_ROLE_KEY>
DB_PASSWORD=<YOUR_DB_PASSWORD>
EOF

        log_info "Cree: .env.server"
    fi
}

# Configurer l'environnement serveur local exposé via tunnel
configure_local_tunnel() {
    local force="$1"

    log_info "Configuration serveur local via tunnel..."

    # La configuration locale via tunnel est deja dans .env.server
    # Verifier qu'elle existe
    if [[ ! -f "$ROOT_DIR/.env.server" ]]; then
        die "Configuration locale via tunnel manquante dans .env.server"
    fi

    log_info "Configuration locale via tunnel OK"
}

# Configurer les valeurs specifiques d'un fichier .env
configure_env_values() {
    local env_file="$1"
    local env_type="$2"

    case "$env_type" in
        local-dev)
            # Configurer pour le developpement local
            sed -i 's/VITE_SUPABASE_MODE=.*/VITE_SUPABASE_MODE=local/' "$env_file" 2>/dev/null || true
            sed -i 's/WEB_PORT=.*/WEB_PORT=8080/' "$env_file" 2>/dev/null || true
            ;;
    esac
}

# Installer les dependances
install_dependencies() {
    log_step "Installation des dependances"

    # Verifier si node_modules existe
    if [[ ! -d "$ROOT_DIR/node_modules" ]]; then
        log_info "Installation des dependances npm..."
        cd "$ROOT_DIR"
        npm install
    else
        log_info "Dependances deja installees"
    fi

    # Verifier Supabase CLI
    if ! command -v supabase >/dev/null 2>&1; then
        log_warn "Supabase CLI non installe"
        log_info "Installez Supabase CLI: npm install -g supabase"
    else
        log_info "Supabase CLI OK"
    fi

    log_info "Dependances verifiees ✓"
}

# Configurer les services
configure_services() {
    log_step "Configuration des services"

    # Verifier Docker Compose
    if [[ ! -f "$ROOT_DIR/docker-compose.yml" ]]; then
        log_warn "docker-compose.yml manquant"
    else
        log_info "Docker Compose OK"
    fi

    # Verifier la configuration Supabase
    if [[ ! -f "$ROOT_DIR/supabase/config.toml" ]]; then
        log_warn "Configuration Supabase manquante"
        log_info "Initialisez Supabase: supabase init"
    else
        log_info "Configuration Supabase OK"
    fi

    log_info "Services configures ✓"
}

# Tests de validation
run_validation_tests() {
    log_step "Tests de validation"

    # Tester la compilation
    log_info "Test de compilation TypeScript..."
    cd "$ROOT_DIR"
    if npm run typecheck >/dev/null 2>&1; then
        log_info "Compilation TypeScript OK"
    else
        log_warn "Erreurs de compilation TypeScript"
    fi

    # Tester le build
    log_info "Test de build..."
    if npm run build >/dev/null 2>&1; then
        log_info "Build OK"
    else
        log_warn "Echec du build"
    fi

    # Tester les scripts
    log_info "Test des scripts du workflow..."
    if [[ -x "$ROOT_DIR/scripts/sync-workflow.sh" ]]; then
        if "$ROOT_DIR/scripts/sync-workflow.sh" status >/dev/null 2>&1; then
            log_info "Script sync-workflow.sh OK"
        else
            log_warn "Script sync-workflow.sh defectueux"
        fi
    fi

    log_info "Tests de validation termines"
}

# Creer des raccourcis
create_shortcuts() {
    log_step "Creation des raccourcis"

    local bin_dir="$HOME/.local/bin"
    mkdir -p "$bin_dir"

    # Raccourci pour sync-workflow
    local sync_shortcut="$bin_dir/egs-sync"
    cat > "$sync_shortcut" << EOF
#!/bin/bash
cd "$ROOT_DIR" && ./scripts/sync-workflow.sh "\$@"
EOF
    chmod +x "$sync_shortcut"

    # Raccourci pour deploy
    local deploy_shortcut="$bin_dir/egs-deploy"
    cat > "$deploy_shortcut" << EOF
#!/bin/bash
cd "$ROOT_DIR" && ./scripts/deploy.sh "\$@"
EOF
    chmod +x "$deploy_shortcut"

    # Raccourci pour monitor
    local monitor_shortcut="$bin_dir/egs-monitor"
    cat > "$monitor_shortcut" << EOF
#!/bin/bash
cd "$ROOT_DIR" && ./scripts/monitor.sh "\$@"
EOF
    chmod +x "$monitor_shortcut"

    log_info "Raccourcis crees dans $bin_dir"
    log_info "Utilisation: egs-sync status, egs-deploy local-dev, egs-monitor watch"
}

# Afficher les prochaines etapes
show_next_steps() {
    cat << 'EOF'

🎉 Workflow de synchronisation initialise avec succes !

Prochaines etapes recommandees:

1. 🚀 Demarrer l'environnement de developpement:
   npm run deploy:dev

2. 🔍 Verifier l'etat des environnements:
   npm run sync:status

3. 📊 Activer le monitoring:
   npm run monitor:watch

4. 🔄 Tester une synchronisation:
   npm run sync:dev-to-server

Documentation complete: SYNC_WORKFLOW_README.md

Commandes rapides:
• npm run sync:status     - Etat des environnements
• npm run deploy:dev      - Deploiement developpement
• npm run monitor:health  - Tests de sante

EOF
}

# Fonction principale
main() {
    # Verifier si on est dans le bon repertoire
    if [[ ! -f "$ROOT_DIR/package.json" ]]; then
        die "Executez ce script depuis la racine du projet EGS"
    fi

    initialize_workflow "$@"
}

# Point d'entree
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
