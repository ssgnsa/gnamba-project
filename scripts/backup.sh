#!/bin/bash
# ============================================
# EGS - Script de Sauvegarde de la Base de Données
# ============================================
# Usage: ./scripts/backup.sh [options]
# Options:
#   --full      Sauvegarde complète (schema + data)
#   --schema    Schema uniquement
#   --data      Données uniquement
#   --restore   Restaurer depuis un fichier
# ============================================

set -e

# Configuration
BACKUP_DIR="./backups/postgres"
DB_CONTAINER="egs-postgres"
DB_NAME="postgres"
DB_USER="postgres"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonctions utilitaires
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier que Docker est disponible
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker n'est pas installé ou n'est pas dans le PATH"
        exit 1
    fi
}

# Vérifier que le conteneur PostgreSQL est en cours d'exécution
check_postgres() {
    if ! docker ps | grep -q $DB_CONTAINER; then
        log_error "Le conteneur PostgreSQL ($DB_CONTAINER) n'est pas en cours d'exécution"
        exit 1
    fi
}

# Créer le répertoire de sauvegarde
ensure_backup_dir() {
    mkdir -p "$BACKUP_DIR"
}

# Sauvegarde complète
backup_full() {
    local backup_file="$BACKUP_DIR/backup_full_$TIMESTAMP.sql"
    log_info "Démarrage de la sauvegarde complète..."
    
    docker exec -t $DB_CONTAINER pg_dump -U $DB_USER -d $DB_NAME --format=plain --no-owner --no-privileges > "$backup_file"
    
    if [ -f "$backup_file" ]; then
        local size=$(du -h "$backup_file" | cut -f1)
        log_info "Sauvegarde complétée: $backup_file ($size)"
        
        # Compression
        log_info "Compression de la sauvegarde..."
        gzip "$backup_file"
        log_info "Sauvegarde compressée: ${backup_file}.gz"
    else
        log_error "Échec de la sauvegarde"
        exit 1
    fi
}

# Sauvegarde du schema uniquement
backup_schema() {
    local backup_file="$BACKUP_DIR/backup_schema_$TIMESTAMP.sql"
    log_info "Démarrage de la sauvegarde du schema..."
    
    docker exec -t $DB_CONTAINER pg_dump -U $DB_USER -d $DB_NAME --schema-only --no-owner --no-privileges > "$backup_file"
    
    if [ -f "$backup_file" ]; then
        local size=$(du -h "$backup_file" | cut -f1)
        log_info "Schema sauvegardé: $backup_file ($size)"
        gzip "$backup_file"
        log_info "Schema compressé: ${backup_file}.gz"
    else
        log_error "Échec de la sauvegarde du schema"
        exit 1
    fi
}

# Sauvegarde des données uniquement
backup_data() {
    local backup_file="$BACKUP_DIR/backup_data_$TIMESTAMP.sql"
    log_info "Démarrage de la sauvegarde des données..."
    
    docker exec -t $DB_CONTAINER pg_dump -U $DB_USER -d $DB_NAME --data-only --no-owner --no-privileges > "$backup_file"
    
    if [ -f "$backup_file" ]; then
        local size=$(du -h "$backup_file" | cut -f1)
        log_info "Données sauvegardées: $backup_file ($size)"
        gzip "$backup_file"
        log_info "Données compressées: ${backup_file}.gz"
    else
        log_error "Échec de la sauvegarde des données"
        exit 1
    fi
}

# Restaurer depuis un fichier
restore_backup() {
    local backup_file="$1"
    
    if [ ! -f "$backup_file" ]; then
        # Essayer avec .gz
        if [ -f "${backup_file}.gz" ]; then
            log_info "Fichier compressé détecté, décompression..."
            gunzip -k "${backup_file}.gz"
            backup_file="${backup_file}.gz"
            backup_file="${backup_file%.gz}"
        else
            log_error "Fichier de sauvegarde non trouvé: $backup_file"
            exit 1
        fi
    fi
    
    log_warn "ATTENTION: Cette opération va écraser les données existantes!"
    read -p "Êtes-vous sûr de vouloir continuer? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        log_info "Restauration annulée"
        exit 0
    fi
    
    log_info "Démarrage de la restauration..."
    
    if [[ "$backup_file" == *.gz ]]; then
        gunzip -c "$backup_file" | docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME
    else
        cat "$backup_file" | docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME
    fi
    
    log_info "Restauration terminée"
}

# Nettoyer les anciennes sauvegardes (> 30 jours)
cleanup_old() {
    log_info "Nettoyage des sauvegardes de plus de 30 jours..."
    find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete
    find "$BACKUP_DIR" -name "*.sql" -mtime +30 -delete
    log_info "Nettoyage terminé"
}

# Lister les sauvegardes disponibles
list_backups() {
    log_info "Sauvegardes disponibles:"
    echo ""
    ls -lh "$BACKUP_DIR"/*.sql* 2>/dev/null || echo "Aucune sauvegarde trouvée"
}

# Afficher l'aide
show_help() {
    echo "EGS - Script de Sauvegarde PostgreSQL"
    echo ""
    echo "Usage: $0 [commande]"
    echo ""
    echo "Commandes:"
    echo "  full        Sauvegarde complète (schema + data) - DÉFAUT"
    echo "  schema      Schema uniquement"
    echo "  data        Données uniquement"
    echo "  restore     Restaurer depuis un fichier (requires --file)"
    echo "  list        Lister les sauvegardes disponibles"
    echo "  cleanup     Supprimer les sauvegardes de > 30 jours"
    echo "  help        Afficher cette aide"
    echo ""
    echo "Options:"
    echo "  --file      Fichier de sauvegarde pour restore"
    echo ""
    echo "Exemples:"
    echo "  $0 full"
    echo "  $0 restore --file ./backups/postgres/backup_full_20240101_120000.sql.gz"
}

# ============================================
# Main
# ============================================

check_docker

case "${1:-full}" in
    full)
        check_postgres
        ensure_backup_dir
        backup_full
        ;;
    schema)
        check_postgres
        ensure_backup_dir
        backup_schema
        ;;
    data)
        check_postgres
        ensure_backup_dir
        backup_data
        ;;
    restore)
        check_postgres
        shift
        BACKUP_FILE=""
        while [[ $# -gt 0 ]]; do
            case $1 in
                --file)
                    BACKUP_FILE="$2"
                    shift 2
                    ;;
                *)
                    shift
                    ;;
            esac
        done
        if [ -z "$BACKUP_FILE" ]; then
            log_error "Fichier de sauvegarde requis. Utilisez --file"
            exit 1
        fi
        restore_backup "$BACKUP_FILE"
        ;;
    list)
        list_backups
        ;;
    cleanup)
        cleanup_old
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "Commande inconnue: $1"
        show_help
        exit 1
        ;;
esac
