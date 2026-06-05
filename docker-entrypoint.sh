#!/bin/bash
# ============================================
# Entrypoint - Substitution des variables au runtime
# ============================================

set -e

echo "🚀 Démarrage EGS avec configuration runtime..."

# Vérifier les variables requises
if [ -z "$VITE_SUPABASE_URL" ]; then
    echo "❌ VITE_SUPABASE_URL non définie"
    exit 1
fi

if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "❌ VITE_SUPABASE_ANON_KEY non définie"
    exit 1
fi

# Substitution dans les fichiers JS
echo "📝 Configuration des variables d'environnement..."

# Trouver les fichiers JS dans assets
for file in /usr/share/nginx/html/assets/*.js; do
    if [ -f "$file" ]; then
        # Remplacer les placeholders
        sed -i "s|__VITE_SUPABASE_URL__|$VITE_SUPABASE_URL|g" "$file"
        sed -i "s|__VITE_SUPABASE_ANON_KEY__|$VITE_SUPABASE_ANON_KEY|g" "$file"
        sed -i "s|__VITE_SUPABASE_MODE__|$VITE_SUPABASE_MODE|g" "$file"
    fi
done

# Substitution dans nginx config
envsubst '${VITE_SUPABASE_URL} ${VITE_SUPABASE_ANON_KEY}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

echo "✅ Configuration appliquée"
echo "   Mode: $VITE_SUPABASE_MODE"
echo "   URL: $VITE_SUPABASE_URL"
echo ""

# Exécuter la commande principale
exec "$@"
