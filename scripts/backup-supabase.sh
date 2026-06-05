#!/bin/bash
# ============================================
# Backup Automatique Supabase
# ============================================

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/home/soma/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/supabase_backup_${DATE}.sql"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "$1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "${BACKUP_DIR}/backup.log"
}

# Créer le dossier de backup
mkdir -p "$BACKUP_DIR"

log "${BLUE}══════════════════════════════════════════════════════${NC}"
log "${BLUE}  BACKUP SUPABASE - ${DATE}${NC}"
log "${BLUE}══════════════════════════════════════════════════════${NC}"

# Vérifier les credentials
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    log "${RED}❌ SUPABASE_SERVICE_ROLE_KEY non défini${NC}"
    exit 1
fi

# Backup via pg_dump (nécessite connexion directe) ou API
log "${YELLOW}📦 Création du backup...${NC}"

# Méthode 1: Via l'API REST (téléchargement des données)
CLOUD_URL="https://thykrnoqgylrbfupophs.supabase.co"
TABLES=("user_profiles" "app_settings" "foncier_villages" "foncier_lots" "foncier_attestations" "foncier_owners" "foncier_payments" "foncier_config" "media_files" "media_versions" "media_usage" "page_layouts" "site_content")

# Créer un fichier JSON avec toutes les données
BACKUP_JSON="${BACKUP_DIR}/supabase_backup_${DATE}.json"
echo "{" > "$BACKUP_JSON"
echo "  \"backup_date\": \"$(date -Iseconds)\"," >> "$BACKUP_JSON"
echo "  \"source\": \"supabase_cloud\"," >> "$BACKUP_JSON"
echo "  \"project_id\": \"thykrnoqgylrbfupophs\"," >> "$BACKUP_JSON"
echo "  \"tables\": {" >> "$BACKUP_JSON"

FIRST_TABLE=true
for TABLE in "${TABLES[@]}"; do
    log "   📥 Export: $TABLE"
    
    DATA=$(curl -s --max-time 60 "${CLOUD_URL}/rest/v1/${TABLE}?select=*" \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Range: 0-999" 2>/dev/null || echo "[]")
    
    # Vérifier si c'est un tableau JSON valide
    if echo "$DATA" | jq -e 'type == "array"' >/dev/null 2>&1; then
        if [ "$FIRST_TABLE" = true ]; then
            FIRST_TABLE=false
        else
            echo "," >> "$BACKUP_JSON"
        fi
        echo "    \"${TABLE}\": $DATA" >> "$BACKUP_JSON"
    else
        log "   ⚠️  Erreur export $TABLE"
    fi
done

echo "" >> "$BACKUP_JSON"
echo "  }" >> "$BACKUP_JSON"
echo "}" >> "$BACKUP_JSON"

# Vérifier backup créé
if [ -f "$BACKUP_JSON" ]; then
    SIZE=$(du -h "$BACKUP_JSON" | cut -f1)
    log "${GREEN}✅ Backup créé: ${BACKUP_JSON} (${SIZE})${NC}"
else
    log "${RED}❌ Échec création backup${NC}"
    exit 1
fi

# Compression
gzip -f "$BACKUP_JSON"
log "${GREEN}✅ Backup compressé: ${BACKUP_JSON}.gz${NC}"

# Nettoyage des anciens backups
log "${YELLOW}🧹 Nettoyage des backups anciens (> ${RETENTION_DAYS} jours)...${NC}"
DELETED=$(find "$BACKUP_DIR" -name "supabase_backup_*.json.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)
log "   ${GREEN}$DELETED fichier(s) supprimé(s)${NC}"

# Liste des backups existants
log "${BLUE}📁 Backups disponibles:${NC}"
ls -lh "$BACKUP_DIR"/supabase_backup_*.json.gz 2>/dev/null | tail -5 | while read line; do
    log "   $line"
done

log "${BLUE}══════════════════════════════════════════════════════${NC}"
log "${GREEN}✅ Backup terminé avec succès${NC}"
