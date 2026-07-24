#!/usr/bin/env bash
# scripts/pre-commit-secret-guard.sh
#
# Garde-fou REEL (pas seulement une consigne donnée à l'agent) : bloque tout
# commit dont le diff indexé contient un motif ressemblant à un secret.
#
# Installation (une fois, sur le repo) :
#   ln -sf ../../scripts/pre-commit-secret-guard.sh .git/hooks/pre-commit
#   chmod +x .git/hooks/pre-commit .git/hooks/pre-commit
#
# S'applique à TOUT commit, qu'il vienne de l'agent autonome ou de toi.

set -euo pipefail

PATTERN='(api[_-]?key\s*=\s*["'\''][A-Za-z0-9_\-]{16,}|secret\s*=\s*["'\''][A-Za-z0-9_\-]{16,}|password\s*=\s*["'\''][^"'\'']{8,}|BEGIN[ ]?(RSA|EC|OPENSSH|PGP)?[ ]PRIVATE KEY)'

MATCHES=$(git diff --cached -U0 -- . ':(exclude)scripts/pre-commit-secret-guard.sh' \
  | grep -Ei "$PATTERN" || true)

if [[ -n "$MATCHES" ]]; then
  echo "==============================================================" >&2
  echo " COMMIT BLOQUE : motif ressemblant à un secret dans le diff." >&2
  echo " Vérifie manuellement avec : git diff --cached" >&2
  echo " Si c'est un faux positif, ajuste PATTERN dans" >&2
  echo " scripts/pre-commit-secret-guard.sh (ne contourne pas au cas par cas)." >&2
  echo "==============================================================" >&2
  exit 1
fi

exit 0
