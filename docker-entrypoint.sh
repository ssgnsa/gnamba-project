#!/bin/sh
set -e

echo "🚀 Démarrage EGS avec configuration runtime..."

if [ "${VITE_API_MODE:-local}" != "local" ]; then
  echo "❌ VITE_API_MODE doit être local"
  exit 1
fi

if [ -z "$VITE_API_URL" ] && [ -z "$VITE_LOCAL_API_URL" ]; then
  echo "❌ VITE_API_URL/VITE_LOCAL_API_URL manquante"
  exit 1
fi

echo "📝 Configuration des variables d'environnement..."

API_BASE_URL="${VITE_API_URL:-${VITE_LOCAL_API_URL:-https://api.gnambaservices.ci}}"
RUNTIME_ASSET_DIR="/run/egs-runtime/assets"

if [ ! -f /etc/nginx/conf.d/default.conf ]; then
  echo "❌ Fichier de configuration nginx absent"
  exit 1
fi

mkdir -p "$RUNTIME_ASSET_DIR"

for file in /var/www/egs/current/assets/*.js; do
  if [ -f "$file" ]; then
    if grep -Eq '__VITE_API_URL__|__VITE_LOCAL_API_URL__|__VITE_API_MODE__' "$file"; then
      runtime_file="$RUNTIME_ASSET_DIR/${file##*/}"
      cp "$file" "$runtime_file"
      sed -i "s|__VITE_API_URL__|${API_BASE_URL}|g" "$runtime_file"
      sed -i "s|__VITE_LOCAL_API_URL__|${API_BASE_URL}|g" "$runtime_file"
      sed -i "s|__VITE_API_MODE__|${VITE_API_MODE:-local}|g" "$runtime_file"
    fi
  fi
done

echo "✅ Configuration appliquée"
exec "$@"
