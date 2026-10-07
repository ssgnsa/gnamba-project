#!/usr/bin/env bash
# scripts/run-loop.sh
# Orchestrateur de loop autonome pour Claude Code (mode headless -p).
# N'utilise JAMAIS --dangerously-skip-permissions : seulement une liste
# explicite d'outils autorisés (acceptEdits + allowedTools scopés).
#
# Usage : bash scripts/run-loop.sh [nombre_de_cycles]
# Prérequis : claude (Claude Code CLI) et python3 installés, exécuté
# depuis la racine du repo (là où se trouvent LOOP.md, loop_state.json).

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

STATE_FILE="loop_state.json"
LOG_FILE="loop-run-log.md"
MAX_CYCLES="${1:-5}"

if ! command -v claude >/dev/null 2>&1; then
  echo "[run-loop] Claude Code CLI ('claude') introuvable dans le PATH. Abandon." >&2
  exit 1
fi

if [[ ! -f "$STATE_FILE" ]]; then
  echo "[run-loop] $STATE_FILE introuvable à la racine du repo. Abandon." >&2
  exit 1
fi

touch "$LOG_FILE"

# Outils explicitement autorisés sans prompt : lecture, édition, build,
# tests, vérificateur infra, déploiement OFFICIEL uniquement.
# Volontairement absents : rm, db:local:reset, git push --force, et tout
# chemin de déploiement alternatif.
ALLOWED_TOOLS="Read,Edit,Grep,Glob,Bash(npm run build),Bash(npm run lint),Bash(npm run typecheck),Bash(npm run release:check),Bash(npm run validate:frontend),Bash(npm test *),Bash(pytest *),Bash(PYTHONPATH=* pytest *),Bash(git status),Bash(git diff *),Bash(git add *),Bash(git commit *),Bash(bash scripts/check-erp.sh),Bash(bash scripts/deploy-production.sh),Bash(docker ps),Bash(docker logs *),Bash(docker exec * pg_isready)"

echo "=== run-loop.sh démarré : $(date -u +%FT%TZ) — max ${MAX_CYCLES} cycles ===" | tee -a "$LOG_FILE"

for ((i = 1; i <= MAX_CYCLES; i++)); do
  echo "--- Cycle $i/$MAX_CYCLES : $(date -u +%FT%TZ) ---" | tee -a "$LOG_FILE"

  PROMPT="Applique le loop défini dans LOOP.md et la politique AUTONOMY_POLICY.md pour ce cycle unique.
Lis d'abord AGENTS.md, LOOP.md, AUTONOMY_POLICY.md, loop-constraints.md, loop-budget.md et loop_state.json.
Choisis la tâche todo la plus prioritaire non bloquée, exécute-la, vérifie avec les commandes officielles (npm run build/lint/typecheck/release:check/validate:frontend, pytest backend/tests, scripts/check-erp.sh), puis mets à jour loop_state.json et ajoute une entrée dans loop-run-log.md.
Ne pose aucune question : en cas d'ambiguïté, applique AUTONOMY_POLICY.md. Le seul cas d'arrêt dur est la détection d'un secret dans un diff à committer (AUTONOMY_POLICY.md section F) — dans ce cas, ne committe rien et marque le blocage dans loop_state.json avec status blocked.
Termine ta réponse par un résumé court : fait / bloqué / proposé ensuite."

  set +e
  RESULT_JSON=$(claude -p "$PROMPT" \
    --permission-mode acceptEdits \
    --allowedTools "$ALLOWED_TOOLS" \
    --max-turns 40 \
    --output-format json)
  EXIT_CODE=$?
  set -e

  echo "$RESULT_JSON" > ".last-cycle-result.json"

  if ! python3 scripts/loop_report.py ".last-cycle-result.json" "$STATE_FILE" "$LOG_FILE" "$i"; then
    echo "[run-loop] Cycle $i : échec de mise à jour de l'état (loop_report.py). Arrêt par prudence." | tee -a "$LOG_FILE"
    exit 1
  fi

  if [[ "$EXIT_CODE" -ne 0 ]]; then
    echo "[run-loop] Cycle $i : Claude Code a retourné un code d'erreur ($EXIT_CODE). Arrêt." | tee -a "$LOG_FILE"
    exit 1
  fi

  STOP_REASON=$(python3 -c "
import json
try:
    with open('$STATE_FILE') as f:
        s = json.load(f)
    print(s.get('last_stop_reason') or '')
except Exception:
    print('')
")

  if [[ -n "$STOP_REASON" ]]; then
    echo "[run-loop] Arrêt dur signalé par le cycle $i : $STOP_REASON" | tee -a "$LOG_FILE"
    break
  fi
done

echo "=== run-loop.sh terminé : $(date -u +%FT%TZ) ===" | tee -a "$LOG_FILE"
