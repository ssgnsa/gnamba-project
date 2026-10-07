#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOCS_DIR="${ROOT_DIR}/docs/governance"
STATE_FILE="${ROOT_DIR}/PROGRESS_STATE.json"
REVIEW_LOG="${DOCS_DIR}/GOVERNANCE_REVIEW_LOG.md"
BACKUP_LOG="${DOCS_DIR}/BACKUP_RESTORE_LOG.md"
START_HERE="${ROOT_DIR}/docs/START_HERE.md"

DISK_THRESHOLD="${DISK_THRESHOLD:-90}"
CRITICAL_CONTAINERS=(
  ${GOVERNANCE_CRITICAL_CONTAINERS:-egs-frontend egs-nginx-proxy egs-filebrowser}
)

mkdir -p "${DOCS_DIR}"
touch "${REVIEW_LOG}" "${BACKUP_LOG}"

json_string() {
  local key="$1"
  if [ ! -f "${STATE_FILE}" ]; then
    return 0
  fi
  sed -n "s/.*\"${key}\"[[:space:]]*:[[:space:]]*\"\([^\"]*\)\".*/\1/p" "${STATE_FILE}" | head -n1
}

json_bool() {
  local key="$1"
  if [ ! -f "${STATE_FILE}" ]; then
    return 0
  fi
  sed -n "s/.*\"${key}\"[[:space:]]*:[[:space:]]*\(true\|false\).*/\1/p" "${STATE_FILE}" | head -n1
}

json_number() {
  local key="$1"
  if [ ! -f "${STATE_FILE}" ]; then
    return 0
  fi
  sed -n "s/.*\"${key}\"[[:space:]]*:[[:space:]]*\([0-9][0-9]*\).*/\1/p" "${STATE_FILE}" | head -n1
}

today_utc() {
  date -u +%Y-%m-%d
}

timestamp_utc() {
  date -u +%Y-%m-%dT%H:%M:%SZ
}

days_ago() {
  local from="$1"
  if [ -z "${from}" ]; then
    echo ""
    return 0
  fi
  local from_epoch now_epoch
  from_epoch="$(date -u -d "${from}" +%s 2>/dev/null || echo 0)"
  now_epoch="$(date -u +%s)"
  if [ "${from_epoch}" -le 0 ]; then
    echo ""
    return 0
  fi
  echo $(( (now_epoch - from_epoch) / 86400 ))
}

disk_usage_percent() {
  df -P "${ROOT_DIR}" | awk 'NR==2 {gsub(/%/, "", $5); print $5}'
}

container_status() {
  local name="$1"
  if ! command -v docker >/dev/null 2>&1; then
    echo "unavailable"
    return 0
  fi
  if ! docker info >/dev/null 2>&1; then
    echo "unavailable"
    return 0
  fi
  if docker ps --format '{{.Names}}' 2>/dev/null | grep -qx "${name}"; then
    echo "running"
  else
    echo "stopped"
  fi
}

absence_mode="$(json_bool absence_mode)"
absence_mode="${absence_mode:-false}"
absence_until="$(json_string absence_until)"
mode_solo="$(json_bool mode_solo)"
mode_solo="${mode_solo:-true}"
program_health_score="$(json_number program_health_score)"
program_health_score="${program_health_score:-n/a}"
last_backup_restore_test="$(json_string last_backup_restore_test)"
last_backup_restore_result="$(json_string last_backup_restore_result)"
codex_version="$(json_string codex_version)"
codex_version="${codex_version:-unknown}"

review_date="$(today_utc)"
review_ts="$(timestamp_utc)"
disk_usage="$(disk_usage_percent)"
disk_usage="${disk_usage:-0}"

if [ -z "${START_HERE}" ] || [ ! -f "${START_HERE}" ]; then
  start_here_state="missing"
else
  start_here_state="present"
fi

if [ "${mode_solo}" = "true" ]; then
  restore_interval_days=180
else
  restore_interval_days=90
fi

if [ -n "${last_backup_restore_test}" ]; then
  next_backup_restore_due="$(date -u -d "${last_backup_restore_test} + ${restore_interval_days} days" +%Y-%m-%d 2>/dev/null || true)"
else
  next_backup_restore_due="$(date -u -d "+${restore_interval_days} days" +%Y-%m-%d 2>/dev/null || true)"
fi

{
  echo "## Revue — ${review_date}"
  echo "- Horodatage UTC : ${review_ts}"
  echo "- Codex : ${codex_version}"
  echo "- START_HERE.md : ${start_here_state}"
  echo "- MODE_SOLO : ${mode_solo}"
  echo "- absence_mode : ${absence_mode}"
  if [ "${absence_mode}" = "true" ]; then
    echo "- absence_until : ${absence_until:-null}"
  fi
  echo "- Programme Health Score lu : ${program_health_score}"
  echo
  echo "### Vérification disque"
  echo "- Usage disque sur le workspace : ${disk_usage}%"
  if [ "${disk_usage}" -ge "${DISK_THRESHOLD}" ]; then
    echo "- Statut : ❌ seuil critique atteint (>= ${DISK_THRESHOLD}%)"
  else
    echo "- Statut : ✅ correct"
  fi
  echo
  echo "### Conteneurs critiques"

  container_failures=0
  if [ "${absence_mode}" = "true" ]; then
    echo "- Mode veille : vérification des conteneurs et du score désactivée par conception"
  else
    for container in "${CRITICAL_CONTAINERS[@]}"; do
      status="$(container_status "${container}")"
      echo "- ${container} : ${status}"
      if [ "${status}" = "stopped" ]; then
        container_failures=$((container_failures + 1))
      fi
    done
  fi

  echo
  echo "### Sauvegarde"
  if [ -n "${last_backup_restore_test}" ]; then
    echo "- Dernier test de restauration : ${last_backup_restore_test}"
    echo "- Résultat : ${last_backup_restore_result:-unknown}"
    if [ -n "${next_backup_restore_due}" ]; then
      echo "- Prochain test attendu : ${next_backup_restore_due}"
    fi
  else
    echo "- Aucun test de restauration enregistré à ce jour"
    if [ -n "${next_backup_restore_due}" ]; then
      echo "- Premier test à planifier avant : ${next_backup_restore_due}"
    fi
  fi

  echo
  echo "### Conclusion"
  if [ "${absence_mode}" = "true" ]; then
    echo "- Période d'absence active : score gelé et vérification limitée."
  elif [ "${disk_usage}" -ge "${DISK_THRESHOLD}" ] || [ "${container_failures:-0}" -gt 0 ]; then
    echo "- Action requise : au moins un point critique nécessite suivi."
  else
    echo "- Aucun incident constaté sur cette revue."
  fi
  echo
} >> "${REVIEW_LOG}"

if [ "${last_backup_restore_test}" = "" ]; then
  {
    echo "## Planification — ${review_date}"
    echo "- Mode solo : ${mode_solo}"
    echo "- Échéance indicative du premier test : ${next_backup_restore_due:-à calculer}"
    echo "- Service cible : postgresql (egs-db)"
    echo "- Statut : à planifier"
    echo
  } >> "${BACKUP_LOG}"
fi

if [ "${absence_mode}" = "true" ]; then
  echo "[GOVERNANCE] Mode veille actif : revue limitée au disque"
else
  echo "[GOVERNANCE] Revue exécutée"
fi
