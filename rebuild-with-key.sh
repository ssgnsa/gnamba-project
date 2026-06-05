#!/bin/bash
# Usage: ./rebuild-with-key.sh "eyJhbGci..."
# Fournir la nouvelle clé anon depuis le Dashboard Supabase

set -e

NEW_KEY="${1:-}"

if [ -z "$NEW_KEY" ]; then
    echo "Usage: $0 '<nouvelle_clé_anon>'"
    echo ""
    echo "Récupérez la clé sur:"
    echo "https://supabase.com/dashboard/project/thykrnoqgylrbfupophs/settings/api"
    exit 1
fi

if [[ ! "$NEW_KEY" =~ ^eyJ ]]; then
    echo "❌ La clé doit commencer par 'eyJ'"
    exit 1
fi

SUPABASE_URL="https://thykrnoqgylrbfupophs.supabase.co"

echo "🔍 Test de la clé..."
HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 \
  -H "apikey: $NEW_KEY" \
  "${SUPABASE_URL}/rest/v1/app_settings?select=key")

if [ "$HTTP" != "200" ]; then
    echo "❌ Clé invalide (HTTP $HTTP) — vérifiez sur le Dashboard Supabase"
    exit 1
fi

echo "✅ Clé valide (HTTP 200)"
echo ""

# Mettre à jour .env
sed -i "s|VITE_SUPABASE_ANON_KEY=.*|VITE_SUPABASE_ANON_KEY=$NEW_KEY|" /home/soma/gnamba-project/.env
echo "✅ .env mis à jour"

# Rebuild
echo "🔧 Rebuild Docker..."
cd /home/soma/gnamba-project
docker build \
  --build-arg VITE_SUPABASE_MODE=cloud \
  --build-arg VITE_SUPABASE_URL="$SUPABASE_URL" \
  --build-arg VITE_SUPABASE_ANON_KEY="$NEW_KEY" \
  -t egs-web:v5 -f Dockerfile . 2>&1 | tail -8

# Redémarrer
docker stop egs-web && docker rm egs-web
docker run -d --name egs-web -p 8080:80 --restart unless-stopped \
  -v /home/soma/gnamba-project/nginx-fixed.conf:/etc/nginx/conf.d/default.conf:ro \
  egs-web:v5

sleep 3
HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/)
echo "✅ EGS démarré — HTTP $HTTP"
echo ""
echo "🎉 Terminé ! Testez : http://localhost:8080"
