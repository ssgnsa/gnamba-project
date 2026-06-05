#!/bin/bash
# Sync simple - tables essentielles
set -e

echo "🔄 Sync Essentiel Cloud → Local"
echo "================================"

# Vérifier service role key
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Définissez: export SUPABASE_SERVICE_ROLE_KEY='...'"
    exit 1
fi

# Démarrer Supabase si nécessaire
if ! docker ps | grep -q supabase_db; then
    echo "🚀 Démarrage Supabase..."
    supabase start 2>&1 | tail -5
    sleep 10
fi

echo "✅ Supabase prêt"
echo ""

# Variables
CLOUD_URL="https://thykrnoqgylrbfupophs.supabase.co"
SERVICE_KEY="$SUPABASE_SERVICE_ROLE_KEY"

# Tables à sync
TABLES="user_profiles app_settings foncier_villages"

for TABLE in $TABLES; do
    echo "📥 Sync: $TABLE"
    
    # 1. Récupérer données Cloud
    DATA=$(curl -s "${CLOUD_URL}/rest/v1/${TABLE}?select=*" \
        -H "apikey: ${SERVICE_KEY}" \
        -H "Authorization: Bearer ${SERVICE_KEY}")
    
    COUNT=$(echo "$DATA" | jq 'length')
    echo "   Cloud: $COUNT records"
    
    if [ "$COUNT" -eq 0 ]; then
        echo "   ⏭️ Skip (vide)"
        continue
    fi
    
    # 2. Truncate local
    docker exec supabase_db_gnamba-project psql -U postgres -d postgres \
        -c "TRUNCATE TABLE public.${TABLE} CASCADE;" 2>/dev/null || true
    
    # 3. Insérer avec psql copy (plus rapide)
    echo "$DATA" | jq -r '.[] | [.[]] | @csv' > "/tmp/${TABLE}.csv"
    
    # Get column names
    COLS=$(echo "$DATA" | jq -r '.[0] | keys | @csv' | tr -d '"')
    
    # Copy data
    docker exec -i supabase_db_gnamba-project psql -U postgres -d postgres \
        -c "COPY public.${TABLE} (${COLS}) FROM STDIN WITH (FORMAT csv);" \
        < "/tmp/${TABLE}.csv" 2>/dev/null || {
        echo "   ⚠️ Copy échoué, essai ligne par ligne..."
        echo "$DATA" | jq -c '.[]' | while read row; do
            COLS=$(echo "$row" | jq -r 'keys | @csv' | tr -d '"')
            VALS=$(echo "$row" | jq -r '[.[]] | @csv')
            docker exec supabase_db_gnamba-project psql -U postgres -d postgres \
                -c "INSERT INTO public.${TABLE} (${COLS}) VALUES (${VALS});" 2>/dev/null || true
        done
    }
    
    # 4. Vérifier
    LOCAL=$(docker exec supabase_db_gnamba-project psql -U postgres -d postgres \
        -t -c "SELECT COUNT(*) FROM public.${TABLE};" 2>/dev/null | xargs || echo "0")
    
    echo "   Local: $LOCAL records"
    if [ "$LOCAL" = "$COUNT" ]; then
        echo "   ✅ OK"
    else
        echo "   ⚠️ Partiel"
    fi
    echo ""
done

echo "================================"
echo "✅ Sync terminé"
echo ""
echo "Vérification:"
for TABLE in $TABLES; do
    N=$(docker exec supabase_db_gnamba-project psql -U postgres -d postgres \
        -t -c "SELECT COUNT(*) FROM public.${TABLE};" 2>/dev/null | xargs || echo "0")
    echo "  $TABLE: $N"
done
