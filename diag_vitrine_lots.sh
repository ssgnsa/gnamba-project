#!/usr/bin/env bash
# ============================================================
# DIAGNOSTIC vitrine-lots — EGS ERP
# Teste les 4 causes racines sur les 2 chemins backend
#  A: /api/v1/site/vitrine-lots  (route dédiée, Pydantic)
#  B: /api/v1/tables/vitrine_lots (route générique)
# ============================================================
set -u

API="${API_BASE:-http://localhost:8000}"
TOKEN="${VITE_LOCAL_API_KEY:-}"

# --- couleurs / helper
OK(){ printf "  [OK] %s\n" "$*"; }
FAIL(){ printf "  [ECHEC] %s\n" "$*"; }
sep(){ printf "\n=== %s ===\n" "$*"; }

for BASE in "$API/api/v1/site/vitrine-lots" "$API/api/v1/tables/vitrine_lots"; do
  sep "CHEMIN: $BASE"

  # --- 1. RESEAU + CORS (OPTIONS preflight)
  sep "1) CORS/OPTIONS"
  out=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "$BASE" \
        -H "Origin: http://localhost:8080" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: content-type,authorization" 2>&1)
  echo "     HTTP OPTIONS -> $out (attendu 200/204)"
  curl -s -X OPTIONS "$BASE" -D - -o /dev/null \
        -H "Origin: http://localhost:8080" | grep -iE "^(allow|access-control)" | sed 's/^/     /' || FAIL "pas de header CORS"

  # --- 2. AUTH : GET sans token puis avec token
  sep "2) AUTH GET"
  code_n=$(curl -s -o /dev/null -w "%{http_code}" "$BASE")
  echo "     GET sans token -> $code_n (200=pas d'auth requise / 401/403=require token)"
  if [ -n "$TOKEN" ]; then
    code_t=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" "$BASE")
    echo "     GET avec token  -> $code_t"
  else
    echo "     (pas de VITE_LOCAL_API_KEY dans l'env — POST avec token ignoré)" 
  fi
  [ "$code_n" = "200" ] && OK "GET ouvert" || FAIL "GET code=$code_n"

  # --- 3. PAYLOAD : POST prix en NUMBER puis en STRING (piège float Pydantic)
  sep "3) POST payload (prix/surface)"
  for pt in number string; do
    if [ "$pt" = "number" ]; then
      body='{"titre":"Diag-TEST","prix":25000000,"surface":1500,"publier_sur_vitrine":true}'
    else
      body='{"titre":"Diag-TEST","prix":"25000000","surface":"1500","publier_sur_vitrine":true}'
    fi
    code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE" \
           -H "Content-Type: application/json" \
           -H "Authorization: Bearer $TOKEN" -d "$body")
    resp=$(curl -s -X POST "$BASE" \
           -H "Content-Type: application/json" \
           -H "Authorization: Bearer $TOKEN" -d "$body")
    echo "     POST prix en $pt -> HTTP $code"
    echo "$resp" | head -c 600 | sed 's/^/       /'
    echo
  done

  # --- 4. FORMAT REPONSE : nom analyse du JSON de retour
  sep "4) Format reponse"
  sample=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE" | head -c 800)
  echo "$sample" | sed 's/^/     /'
  echo
done
sep "FIN"
