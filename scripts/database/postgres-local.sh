#!/usr/bin/env bash
# ============================================
# EGS - PostgreSQL Local Manager
# ============================================
# Usage: ./postgres-local.sh [start|stop|status|logs|reset|backup|shell]
# Gère PostgreSQL 15 en conteneur Docker pour développement local
# ============================================

set -euo pipefail

CONTAINER_NAME="egs-postgres-local"
VOLUME_NAME="egs_postgres_data"
PORT="54322"
PASSWORD="postgres"
DB_NAME="postgres"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }
info() { echo -e "${BLUE}[INFO]${NC} $1"; }

# ============================================
# Start PostgreSQL
# ============================================
cmd_start() {
    log "Démarrage PostgreSQL local..."
    
    # Check if already running
    if docker ps --filter "name=$CONTAINER_NAME" --filter "status=running" --format "{{.Names}}" | grep -q "$CONTAINER_NAME"; then
        warn "PostgreSQL local est déjà en cours d'exécution"
        cmd_status
        return 0
    fi
    
    # Check if container exists but stopped
    if docker ps -a --filter "name=$CONTAINER_NAME" --format "{{.Names}}" | grep -q "$CONTAINER_NAME"; then
        log "Redémarrage du conteneur existant..."
        docker start "$CONTAINER_NAME"
    else
        log "Création du conteneur PostgreSQL 15..."
        docker run -d \
            --name "$CONTAINER_NAME" \
            -e POSTGRES_PASSWORD="$PASSWORD" \
            -e POSTGRES_DB="$DB_NAME" \
            -p "${PORT}:5432" \
            -v "${VOLUME_NAME}:/var/lib/postgresql/data" \
            postgres:15-alpine \
            -c 'listen_addresses=*' \
            -c 'max_connections=100'
    fi
    
    # Wait for PostgreSQL to be ready
    log "Attente du démarrage PostgreSQL..."
    local retries=30
    local count=0
    
    while [ $count -lt $retries ]; do
        if docker exec "$CONTAINER_NAME" pg_isready -U postgres -d "$DB_NAME" >/dev/null 2>&1; then
            log "✅ PostgreSQL local démarré et prêt!"
            info "URL: postgresql://postgres:${PASSWORD}@localhost:${PORT}/${DB_NAME}"
            return 0
        fi
        sleep 1
        ((count++))
        echo -n "."
    done
    
    error "Timeout - PostgreSQL n'a pas démarré dans le temps imparti"
    docker logs "$CONTAINER_NAME" --tail 20
    return 1
}

# ============================================
# Stop PostgreSQL
# ============================================
cmd_stop() {
    log "Arrêt PostgreSQL local..."
    
    if ! docker ps --filter "name=$CONTAINER_NAME" --filter "status=running" --format "{{.Names}}" | grep -q "$CONTAINER_NAME"; then
        warn "PostgreSQL local n'est pas en cours d'exécution"
        return 0
    fi
    
    docker stop "$CONTAINER_NAME" >/dev/null
    log "✅ PostgreSQL local arrêté"
}

# ============================================
# Status
# ============================================
cmd_status() {
    info "=== STATUT POSTGRESQL LOCAL ==="
    echo ""
    
    if docker ps --filter "name=$CONTAINER_NAME" --filter "status=running" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -q "$CONTAINER_NAME"; then
        echo -e "${GREEN}● En cours d'exécution${NC}"
        docker ps --filter "name=$CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        echo ""
        info "Connexion:"
        echo "  URL: postgresql://postgres:${PASSWORD}@localhost:${PORT}/${DB_NAME}"
        echo "  CLI: docker exec -it $CONTAINER_NAME psql -U postgres"
        echo ""
        info "Test de connexion..."
        if docker exec "$CONTAINER_NAME" psql -U postgres -c "SELECT version();" 2>/dev/null | head -3; then
            echo -e "${GREEN}✅ Connexion OK${NC}"
        else
            echo -e "${RED}❌ Connexion échouée${NC}"
        fi
    else
        echo -e "${RED}● Arrêté${NC}"
        if docker ps -a --filter "name=$CONTAINER_NAME" --format "{{.Names}}" | grep -q "$CONTAINER_NAME"; then
            echo "Conteneur existe mais est arrêté"
            echo "Démarrer avec: $0 start"
        else
            echo "Conteneur n'existe pas"
            echo "Créer avec: $0 start"
        fi
    fi
}

# ============================================
# Logs
# ============================================
cmd_logs() {
    local lines="${1:-50}"
    log "Affichage des logs ($lines dernières lignes)..."
    docker logs "$CONTAINER_NAME" --tail "$lines" 2>&1
}

# ============================================
# Reset (destructive)
# ============================================
cmd_reset() {
    warn "⚠️  Cette action va SUPPRIMER toutes les données!"
    read -r -p "Êtes-vous sûr? Tapez 'RESET' pour confirmer: " confirm
    
    if [ "$confirm" != "RESET" ]; then
        log "Opération annulée"
        return 0
    fi
    
    log "Suppression du conteneur et des données..."
    docker rm -f "$CONTAINER_NAME" 2>/dev/null || true
    docker volume rm "$VOLUME_NAME" 2>/dev/null || true
    log "✅ Reset terminé - Exécutez '$0 start' pour recréer"
}

# ============================================
# Backup
# ============================================
cmd_backup() {
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_dir="./backups/postgres-local"
    local backup_file="${backup_dir}/postgres_local_${timestamp}.sql"
    
    mkdir -p "$backup_dir"
    
    log "Création du backup..."
    docker exec "$CONTAINER_NAME" pg_dump -U postgres -d "$DB_NAME" > "$backup_file"
    
    if [ -s "$backup_file" ]; then
        gzip "$backup_file"
        backup_file="${backup_file}.gz"
        local size=$(du -h "$backup_file" | cut -f1)
        log "✅ Backup créé: $backup_file ($size)"
    else
        error "Échec du backup"
        return 1
    fi
}

# ============================================
# Shell access
# ============================================
cmd_shell() {
    log "Connexion au shell PostgreSQL..."
    docker exec -it "$CONTAINER_NAME" psql -U postgres -d "$DB_NAME"
}

# ============================================
# Help
# ============================================
show_help() {
    cat <<EOF
EGS PostgreSQL Local Manager

Usage: $0 <command> [options]

Commands:
  start                    Démarrer PostgreSQL local
  stop                     Arrêter PostgreSQL local
  status                   Afficher le statut
  logs [n]                 Afficher les logs (défaut: 50 lignes)
  reset                    ⚠️  Supprimer conteneur et données
  backup                   Créer un backup SQL
  shell                    Connexion shell psql interactive

Exemples:
  $0 start                # Démarrer
  $0 status               # Vérifier statut
  $0 logs 100             # Voir 100 lignes de logs
  $0 backup               # Créer backup
  $0 shell                # Accès psql

Configuration:
  Port: $PORT
  Database: $DB_NAME
  User: postgres
  Password: $PASSWORD
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
        start)
            cmd_start
            ;;
        stop)
            cmd_stop
            ;;
        status)
            cmd_status
            ;;
        logs)
            cmd_logs "$@"
            ;;
        reset)
            cmd_reset
            ;;
        backup)
            cmd_backup
            ;;
        shell)
            cmd_shell
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            error "Commande inconnue: $command"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
