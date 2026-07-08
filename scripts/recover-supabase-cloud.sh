#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

PROJECT_REF="${SUPABASE_PROJECT_REF:-}"
if [[ -z "$PROJECT_REF" && -f supabase/.temp/project-ref ]]; then
  PROJECT_REF="$(tr -d '[:space:]' < supabase/.temp/project-ref)"
fi

if [[ -z "$PROJECT_REF" ]]; then
  echo "Projet Supabase introuvable. Exportez SUPABASE_PROJECT_REF." >&2
  exit 1
fi

if [[ -z "${SUPABASE_DB_PASSWORD:-}" && -z "${SUPABASE_CLOUD_DB_URL:-}" ]]; then
  cat >&2 <<'MSG'
Mot de passe DB Cloud manquant.

Exportez l'une de ces variables avant de relancer:
  SUPABASE_DB_PASSWORD='mot_de_passe_postgres_cloud'
  ou
  SUPABASE_CLOUD_DB_URL='postgresql://postgres.PROJECT_REF:...'

Le script ne stocke pas le secret dans un fichier.
MSG
  exit 1
fi

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_DIR="${BACKUP_DIR:-backups/supabase-cloud-$STAMP}"
mkdir -p "$BACKUP_DIR"

dump_args=()
if [[ -n "${SUPABASE_CLOUD_DB_URL:-}" ]]; then
  dump_args=(--db-url "$SUPABASE_CLOUD_DB_URL")
else
  dump_args=(--linked)
fi

echo "Projet Cloud: $PROJECT_REF"
echo "Dossier backup: $BACKUP_DIR"

SUPABASE_NO_TELEMETRY=1 supabase db dump "${dump_args[@]}" -f "$BACKUP_DIR/roles.sql" --role-only
SUPABASE_NO_TELEMETRY=1 supabase db dump "${dump_args[@]}" -f "$BACKUP_DIR/schema.sql"
SUPABASE_NO_TELEMETRY=1 supabase db dump "${dump_args[@]}" -f "$BACKUP_DIR/data.sql" --use-copy --data-only \
  -x "storage.buckets_vectors" \
  -x "storage.vector_indexes"

cat > "$BACKUP_DIR/manifest.txt" <<MSG
project_ref=$PROJECT_REF
generated_at=$STAMP
files=roles.sql,schema.sql,data.sql
restore_mode=dump_only
MSG

echo "Dump Cloud terminé."
echo "Fichiers:"
ls -lh "$BACKUP_DIR"/roles.sql "$BACKUP_DIR"/schema.sql "$BACKUP_DIR"/data.sql "$BACKUP_DIR"/manifest.txt

if [[ "${CONFIRM_RESTORE_LOCAL:-}" != "YES" ]]; then
  cat <<'MSG'

Restauration locale non exécutée.
Pour restaurer ensuite, relisez d'abord les fichiers SQL, puis exportez:
  CONFIRM_RESTORE_LOCAL=YES

La restauration complète peut écraser ou entrer en conflit avec l'état local actuel.
MSG
  exit 0
fi

LOCAL_DB_URL="${LOCAL_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
LOCAL_SNAPSHOT="$BACKUP_DIR/local-before-restore.sql"

echo "Snapshot local avant restauration: $LOCAL_SNAPSHOT"
SUPABASE_NO_TELEMETRY=1 supabase db dump --local -f "$LOCAL_SNAPSHOT"

echo "Restauration locale demandée explicitement."
psql \
  --single-transaction \
  --variable ON_ERROR_STOP=1 \
  --file "$BACKUP_DIR/roles.sql" \
  --file "$BACKUP_DIR/schema.sql" \
  --command 'SET session_replication_role = replica' \
  --file "$BACKUP_DIR/data.sql" \
  --dbname "$LOCAL_DB_URL"

echo "Restauration locale terminée."
