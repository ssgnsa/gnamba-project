#!/bin/bash
# Alternative: Déploiement via l'API HTTP de Supabase
# Cette méthode nécessite le service role key

set -e

echo "=========================================="
echo "Déploiement via API HTTP Supabase"
echo "=========================================="
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Charger les variables
if [ -f ".env" ]; then
    source .env
fi

SUPABASE_URL=$VITE_SUPABASE_URL

echo "URL Supabase: $SUPABASE_URL"
echo ""

# Demander la Service Role Key (nécessaire pour déployer)
echo -e "${YELLOW}IMPORTANT:${NC}"
echo "Pour déployer une Edge Function, vous avez besoin de la"
echo "SUPABASE_SERVICE_ROLE_KEY (clé secrète)."
echo ""
echo "1. Allez sur: https://supabase.com/dashboard/project/_/settings/api"
echo "2. Copiez la clé 'service_role' (NE LA PARTAGEZ JAMAIS)"
echo ""
read -sp "Entrez votre SUPABASE_SERVICE_ROLE_KEY: " SERVICE_ROLE_KEY
echo ""

if [ -z "$SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}Erreur: La clé de service role est requise${NC}"
    exit 1
fi

# Extraire le projet ID
PROJECT_ID=$(echo "$SUPABASE_URL" | sed -n 's/.*\/\/\([^.]*\)\..*/\1/p')
echo -e "${GREEN}✓ Project ID: ${PROJECT_ID}${NC}"

# Vérifier le fichier de fonction
FUNCTION_FILE="supabase/functions/admin-create-user/index.ts"
if [ ! -f "$FUNCTION_FILE" ]; then
    echo -e "${RED}Erreur: $FUNCTION_FILE introuvable${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Fonction trouvée: $FUNCTION_FILE${NC}"

# Lire le contenu de la fonction
FUNCTION_CONTENT=$(cat "$FUNCTION_FILE")

# Encoder en base64
FUNCTION_B64=$(echo "$FUNCTION_CONTENT" | base64 -w 0)

echo ""
echo "Préparation du déploiement..."

# Note: L'API HTTP directe pour déployer des fonctions n'est pas documentée publiquement
# Cette section est informative - le déploiement doit se faire via le Dashboard ou CLI

echo ""
echo -e "${YELLOW}=========================================="
echo "MÉTHODE RECOMMANDÉE : Dashboard Supabase"
echo -e "==========================================${NC}"
echo ""
echo "Le déploiement via API HTTP n'est pas supporté officiellement."
echo "Utilisez plutôt le Dashboard Supabase :"
echo ""
echo "1. Allez sur: https://supabase.com/dashboard/project/$PROJECT_ID/functions"
echo "2. Cliquez sur 'New Function'"
echo "3. Nommez-la: admin-create-user"
echo "4. Copiez le contenu de: $FUNCTION_FILE"
echo "5. Cliquez sur 'Deploy'"
echo ""
echo "OU utilisez le script CLI:"
echo "  ./scripts/deploy-edge-function.sh"
echo ""

