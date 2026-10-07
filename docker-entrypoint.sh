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

for file in /var/www/egs/current/assets/*.js; do
  if [ -f "$file" ]; then
    sed -i "s|__VITE_API_URL__|${API_BASE_URL}|g" "$file"
    sed -i "s|__VITE_LOCAL_API_URL__|${API_BASE_URL}|g" "$file"
    sed -i "s|__VITE_API_MODE__|${VITE_API_MODE:-local}|g" "$file"
  fi
done

if [ ! -f /etc/nginx/conf.d/default.conf ]; then
  echo "⚠️ Fichier de configuration nginx absent, création minimale"
  printf 'server { listen 80; root /var/www/egs/current; location / { try_files $uri $uri/ /index.html; } }\n' > /etc/nginx/conf.d/default.conf
fi

echo "✅ Configuration appliquée"
exec "$@"
