#!/bin/bash
# Script de déploiement de la Edge Function "admin-create-user"
# pour Supabase Cloud - Version Automatisée

set -e

echo "=========================================="
echo "Déploiement de la Edge Function"
echo "admin-create-user pour Supabase Cloud"
echo "=========================================="
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Chemin vers Supabase CLI
INSTALL_DIR="$HOME/.local/bin"
SUPABASE_CMD="$INSTALL_DIR/supabase"

# Vérifier si Supabase CLI est installé
if [ ! -f "$SUPABASE_CMD" ]; then
    echo -e "${BLUE}Installation de Supabase CLI...${NC}"
    mkdir -p "$INSTALL_DIR"
    
    if curl -fsSL https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz -o /tmp/supabase.tar.gz; then
        tar -xzf /tmp/supabase.tar.gz -C "$INSTALL_DIR" supabase
        chmod +x "$SUPABASE_CMD"
        echo -e "${GREEN}✓ Supabase CLI installé${NC}"
    else
        echo -e "${RED}Erreur lors du téléchargement${NC}"
        exit 1
    fi
fi

# Ajouter au PATH
export PATH="$INSTALL_DIR:$PATH"

# Vérifier les variables d'environnement
echo "Vérification des variables d'environnement..."
if [ -f ".env" ]; then
    source .env
fi

SUPABASE_URL=${SUPABASE_URL:-$VITE_SUPABASE_URL}

if [ -z "$SUPABASE_URL" ]; then
    echo -e "${RED}Erreur: SUPABASE_URL ou VITE_SUPABASE_URL doit être défini${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Supabase URL: ${SUPABASE_URL}${NC}"

# Extraire le projet ID de l'URL Supabase
PROJECT_ID=$(echo "$SUPABASE_URL" | sed -n 's/.*\/\/\([^.]*\)\..*/\1/p')
echo -e "${GREEN}✓ Project ID: ${PROJECT_ID}${NC}"
echo ""

# Vérifier la connexion
echo "Vérification de la connexion Supabase..."
if ! $SUPABASE_CMD status > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠ Non connecté à Supabase${NC}"
    echo ""
    echo "=========================================="
    echo "CONNEXION REQUISE"
    echo "=========================================="
    echo ""
    echo "1. Ouvrez ce lien dans votre navigateur :"
    echo -e "${BLUE}https://supabase.com/dashboard/cli/log-in${NC}"
    echo ""
    echo "2. Connectez-vous avec votre compte Supabase"
    echo ""
    echo "3. Revenez ici et appuyez sur Entrée pour continuer..."
    read -p ""
    
    # Tenter la connexion
    if ! $SUPABASE_CMD login; then
        echo -e "${RED}Échec de la connexion${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Connecté avec succès${NC}"
fi

# Lier le projet
echo ""
echo "Liaison du projet Supabase..."
if ! $SUPABASE_CMD link --project-ref "$PROJECT_ID" 2>/dev/null; then
    echo -e "${YELLOW}⚠ Le projet n'est pas lié, tentative de liaison...${NC}"
    if ! $SUPABASE_CMD link --project-ref "$PROJECT_ID"; then
        echo -e "${RED}Échec de la liaison du projet${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✓ Projet lié avec succès${NC}"

# Vérifier que le fichier de fonction existe
echo ""
echo "Vérification des fichiers de fonction..."
if [ ! -f "supabase/functions/admin-create-user/index.ts" ]; then
    echo -e "${RED}Erreur: Le fichier de fonction n'existe pas${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Fonction trouvée: supabase/functions/admin-create-user/index.ts${NC}"

if [ ! -f "supabase/functions/admin-create-user/deno.json" ]; then
    echo -e "${YELLOW}⚠ deno.json manquant, création...${NC}"
    cat > supabase/functions/admin-create-user/deno.json << 'DENO_EOF'
{
  "imports": {
    "https://esm.sh/@supabase/supabase-js@2.57.4": "https://esm.sh/@supabase/supabase-js@2.57.4"
  },
  "compilerOptions": {
    "allowJs": true,
    "lib": ["deno.ns", "deno.unstable"],
    "strict": true
  }
}
DENO_EOF
    echo -e "${GREEN}✓ deno.json créé${NC}"
fi

# Déployer la fonction
echo ""
echo "=========================================="
echo "DÉPLOIEMENT DE LA EDGE FUNCTION"
echo "=========================================="
echo ""
echo "Déploiement de 'admin-create-user' en cours..."
echo ""

if $SUPABASE_CMD functions deploy admin-create-user; then
    echo ""
    echo -e "${GREEN}=========================================="
    echo "✅ DÉPLOIEMENT RÉUSSI !"
    echo -e "==========================================${NC}"
    echo ""
    echo "La fonction Edge 'admin-create-user' est maintenant déployée."
    echo ""
    echo "📝 Prochaines étapes :"
    echo ""
    echo "1. Configurez les secrets dans le Dashboard :"
    echo -e "   ${BLUE}https://supabase.com/dashboard/project/${PROJECT_ID}/functions${NC}"
    echo ""
    echo "2. Ajoutez les secrets suivants (onglet Secrets) :"
    echo -e "   ${YELLOW}SUPABASE_URL${NC} = https://${PROJECT_ID}.supabase.co"
    echo -e "   ${YELLOW}SUPABASE_ANON_KEY${NC} = (voir .env)"
    echo -e "   ${YELLOW}SUPABASE_SERVICE_ROLE_KEY${NC} = (Dashboard → Settings → API)"
    echo ""
    echo "3. Testez la création d'utilisateur dans le dashboard EGS"
    echo ""
    echo -e "${GREEN}✓ Tout est prêt !${NC}"
else
    echo ""
    echo -e "${RED}❌ Erreur lors du déploiement${NC}"
    echo ""
    echo "Pour déboguer, essayez :"
    echo "  supabase functions deploy admin-create-user --debug"
    exit 1
fi
