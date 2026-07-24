#!/usr/bin/env bash
# scripts/check-erp.sh
#
# Vérificateur de santé pour l'ERP egs (gnamba-server / erp-prod).
# Code de sortie 0 = tout va bien. Code de sortie != 0 = STOP, le loop
# ne doit pas continuer ni marquer la tâche "done".
#
# À COMPLETER : remplacer les valeurs marquées TODO par les noms réels
# de conteneurs / ports / URLs de ton déploiement.

set -uo pipefail

# --- Config à adapter ---------------------------------------------------
CONTAINERS=("egs-backend" "egs-postgres" "egs-nginx")
HEALTH_URL="https://erp.gnambaservices.ci/health"
DB_CONTAINER="egs-postgres"                                                                                        # seuil alerte disque
# -------------------------------------------------------------------------

FAILURES=0
log()  { echo "[check-erp] $*"; }
fail() { echo "[check-erp][ECHEC] $*"; FAILURES=$((FAILURES+1)); }

echo "=== check-erp.sh : $(date -u +%FT%TZ) ==="

# 1. Conteneurs Docker en cours d'exécution
log "Vérification des conteneurs Docker..."
for c in "${CONTAINERS[@]}"; do
  if ! docker ps --format '{{.Names}}' | grep -qx "$c"; then
    fail "conteneur '$c' absent ou arrêté"
  else
    log "  ok: $c"
  fi
done

# 2. Endpoint santé HTTP de l'ERP
log "Vérification de l'endpoint santé ($HEALTH_URL)..."
if command -v curl >/dev/null 2>&1; then
  HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$HEALTH_URL" || echo "000")
  if [[ "$HTTP_CODE" == "200" ]]; then
    log "  ok: HTTP $HTTP_CODE"
  else
    fail "endpoint santé a répondu HTTP $HTTP_CODE (attendu 200)"
  fi
else
  fail "curl non disponible, impossible de vérifier l'endpoint"
fi

# 3. Connexion à la base PostgreSQL depuis son conteneur
log "Vérification de la base PostgreSQL..."
if docker exec "$DB_CONTAINER" pg_isready >/dev/null 2>&1; then
  log "  ok: PostgreSQL répond (pg_isready)"
else
  fail "PostgreSQL ne répond pas dans '$DB_CONTAINER'"
fi

# 4. Espace disque
log "Vérification de l'espace disque..."
DISK_USE=$(df -h / | awk 'NR==2 {gsub("%","",$5); print $5}')
if [[ -n "$DISK_USE" && "$DISK_USE" -ge "$DISK_THRESHOLD_PCT" ]]; then
  fail "disque à ${DISK_USE}% (seuil ${DISK_THRESHOLD_PCT}%)"
else
  log "  ok: disque à ${DISK_USE:-?}%"
fi

# 5. Logs d'erreurs récents (dernières 5 minutes) sur les conteneurs clés
log "Recherche d'erreurs critiques dans les logs récents..."
for c in "${CONTAINERS[@]}"; do
  ERR_COUNT=$(docker logs --since 5m "$c" 2>&1 | grep -Eic 'error|fatal|panic' || true)
  if [[ "$ERR_COUNT" -gt 0 ]]; then
    fail "$ERR_COUNT ligne(s) d'erreur dans les logs récents de '$c'"
  fi
done

echo "=== Résumé : $FAILURES échec(s) ==="
if [[ "$FAILURES" -gt 0 ]]; then
  exit 1
fi
exit 0
