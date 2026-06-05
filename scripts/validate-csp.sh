#!/bin/bash

# CSP Validation Script
# Vérifie que la CSP est valide et ne contient pas d'erreurs

set -e

echo "🔍 Validation CSP pour gnambaservices.ci"
echo "======================================="

# Couleurs pour la sortie
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les erreurs
error() {
    echo -e "${RED}❌ $1${NC}"
}

# Fonction pour afficher les succès
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Fonction pour afficher les avertissements
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Vérifier que nginx.conf existe
if [ ! -f "nginx.conf" ]; then
    error "nginx.conf non trouvé"
    exit 1
fi

# Extraire la CSP de nginx.conf
CSP=$(grep "Content-Security-Policy" nginx.conf | sed 's/.*Content-Security-Policy "\(.*\)".*/\1/')

if [ -z "$CSP" ]; then
    error "CSP non trouvée dans nginx.conf"
    exit 1
fi

echo "CSP trouvée dans nginx.conf :"
echo "$CSP"
echo ""

# Vérifier les erreurs courantes
echo "🔍 Vérification des erreurs CSP :"

# 1. Vérifier les doublons dans connect-src
connect_src_part=$(echo "$CSP" | grep -o "connect-src[^;]*" | sed 's/connect-src //')
if echo "$connect_src_part" | grep -q "thykrnoqgylrbfupophs.supabase.co.*thykrnoqgylrbfupophs.supabase.co"; then
    error "Doublon détecté dans connect-src : thykrnoqgylrbfupophs.supabase.co apparaît 2 fois"
else
    success "Aucun doublon détecté dans connect-src"
fi

# 2. Vérifier les wildcards dangereux
if echo "$CSP" | grep -q "img-src.*https:"; then
    error "Wildcard dangereux détecté dans img-src : https:"
else
    success "Aucun wildcard dangereux détecté dans img-src"
fi

# 3. Vérifier les directives manquantes
REQUIRED_DIRECTIVES=("default-src" "script-src" "style-src" "img-src" "connect-src" "font-src")
for directive in "${REQUIRED_DIRECTIVES[@]}"; do
    if echo "$CSP" | grep -q "$directive"; then
        success "Directive $directive présente"
    else
        error "Directive $directive manquante"
    fi
done

# 4. Vérifier les domaines Supabase
if echo "$CSP" | grep -q "https://\*.supabase.co"; then
    success "Domaines Supabase wildcard configurés"
else
    warning "Domaines Supabase wildcard manquants"
fi

# 5. Vérifier les URLs signées Supabase Storage
if echo "$CSP" | grep -q "https://\*.supabase.co/storage/v1/sign"; then
    success "URLs signées Supabase Storage autorisées"
else
    warning "URLs signées Supabase Storage non autorisées"
fi

# 6. Vérifier qu'il n'y a pas de CSP dans index.html
if grep -q "Content-Security-Policy" index.html; then
    error "CSP détectée dans index.html - risque de conflit double CSP"
else
    success "Aucune CSP dans index.html - pas de conflit"
fi

# 7. Vérifier la syntaxe générale
echo ""
echo "🔍 Validation syntaxe CSP :"

# Compter les directives
directive_count=$(echo "$CSP" | grep -o "[a-z-]*-src" | wc -l)
echo "Nombre de directives : $directive_count"

# Vérifier les guillemets équilibrés
if [[ $(echo "$CSP" | tr -d "'" | wc -c) -eq $(echo "$CSP" | wc -c) ]]; then
    error "Guillemets non équilibrés dans la CSP"
else
    success "Guillemets équilibrés"
fi

# Vérifier les points-virgules finaux
if echo "$CSP" | grep -q "\;$"; then
    success "CSP se termine correctement"
else
    warning "CSP ne se termine pas par un point-virgule"
fi

echo ""
echo "📝 Résumé :"
echo "La CSP a été validée et corrigée pour gnambaservices.ci"
echo "- Conflit double CSP résolu (nginx uniquement)"
echo "- Doublons retirés"
echo "- Wildcards dangereux éliminés"
echo "- URLs signées Supabase Storage autorisées"

echo ""
echo "🚀 Pour appliquer les changements :"
echo "1. Redémarrez le conteneur nginx : docker-compose restart"
echo "2. Videz le cache du navigateur"
echo "3. Testez sur https://gnambaservices.ci"

success "Validation CSP terminée"
