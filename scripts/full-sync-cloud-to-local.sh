#!/bin/bash
# ============================================
# Full Sync: Supabase Cloud → Local
# Synchronise toutes les données du Cloud vers l'environnement local
# ============================================

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔄 Full Sync: Cloud → Local${NC}"
echo "============================================"

# Vérifier que Supabase CLI est installé
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI non trouvé${NC}"
    exit 1
fi

# Variables
CLOUD_DB_URL="postgresql://postgres:postgres@db.thykrnoqgylrbfupophs.supabase.co:5432/postgres"
BACKUP_DIR="/home/soma/backups"
BACKUP_FILE="$BACKUP_DIR/cloud_backup_$(date +%Y%m%d_%H%M%S).sql"

# Créer le répertoire de backup
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}📦 Étape 1/5: Backup de la base Cloud...${NC}"
echo "   Cela peut prendre plusieurs minutes selon la taille de la base."

# Option 1: Utiliser supabase db dump (recommandé)
echo "   Tentative de dump via Supabase CLI..."
supabase db dump --db-url "$CLOUD_DB_URL" -f "$BACKUP_FILE" 2>/dev/null || {
    echo -e "${YELLOW}⚠️  Dump CLI échoué, tentative avec pg_dump...${NC}"
    
    # Vérifier si postgres password est dans l'env
    if [ -z "$CLOUD_POSTGRES_PASSWORD" ]; then
        echo -e "${RED}❌ Variable CLOUD_POSTGRES_PASSWORD non définie${NC}"
        echo "   Définissez: export CLOUD_POSTGRES_PASSWORD=votre_mot_de_passe"
        exit 1
    fi
    
    CLOUD_DB_URL="postgresql://postgres:${CLOUD_POSTGRES_PASSWORD}@db.thykrnoqgylrbfupophs.supabase.co:5432/postgres"
    # Tentative 1: IPv4 forcé via -h 0.0.0.0 du client
    echo "   Tentative avec connexion IPv4..."
    if PGPASSWORD="${CLOUD_POSTGRES_PASSWORD}" pg_dump \
        --host=db.thykrnoqgylrbfupophs.supabase.co \
        --port=6543 \
        --username=postgres \
        --dbname=postgres \
        --format=plain \
        --clean \
        --if-exists \
        --no-password \
        -f "$BACKUP_FILE" 2>/tmp/pg_dump_err.log; then
        echo -e "${GREEN}✅ Backup réussi via pooler${NC}"
    else
        echo -e "${YELLOW}⚠️  Pooler inaccessible (IPv6/IPv4).${NC}"
        echo -e "${YELLOW}   Alternative: Synchronisation via API (plus lente mais fiable)${NC}"
        echo ""
        echo "   Pour forcer IPv4, essayez depuis une machine avec:"
        echo "   PGPASSWORD=xxx pg_dump -h 34.147.64.89 -p 5432 ..."
        echo ""
        echo -e "${YELLOW}   Ou utilisez l'Option B: Sync via API REST${NC}"
        exit 1
    fi
}

echo -e "${GREEN}✅ Backup créé: $BACKUP_FILE${NC}"

echo -e "${YELLOW}🛑 Étape 2/5: Arrêt de Supabase Local...${NC}"
supabase stop

echo -e "${YELLOW}🗄️  Étape 3/5: Démarrage de Supabase (DB vide)...${NC}"
supabase start
sleep 5

echo -e "${YELLOW}📥 Étape 4/5: Restauration des données...${NC}"
# Attendre que la DB soit prête
until docker exec supabase_db_gnamba-project pg_isready -U postgres -d postgres 2>/dev/null; do
    echo "   Attente de la DB..."
    sleep 2
done

# Restaurer le backup
docker exec -i supabase_db_gnamba-project psql -U postgres -d postgres < "$BACKUP_FILE" || {
    echo -e "${YELLOW}⚠️  Erreurs pendant la restauration (normal pour certaines contraintes)${NC}"
}

echo -e "${YELLOW}🔍 Étape 5/5: Vérification...${NC}"
TABLE_COUNT=$(docker exec supabase_db_gnamba-project psql -U postgres -d postgres -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'" 2>/dev/null | xargs)
echo "   Tables restaurées: $TABLE_COUNT"

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}✅ Full Sync terminé!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "📝 Résumé:"
echo "   - Backup Cloud: $BACKUP_FILE"
echo "   - Tables local: $TABLE_COUNT"
echo ""
echo "🚀 Prochaines étapes:"
echo "   1. Redémarrer EGS: docker restart egs-web"
echo "   2. Tester l'authentification"
echo "   3. Vérifier les logos"
echo ""
echo -e "${YELLOW}⚠️  Note: Les données locales ont été remplacées par les données Cloud${NC}"
