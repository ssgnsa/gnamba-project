#!/usr/bin/env bash
set -euo pipefail

if rg -n "dbClient\.from" src/lib --glob '!**/__tests__/**' --glob '!**/*.test.*' --glob '!**/*.spec.*'; then
  echo "Direct dbClient.from usage found in src/lib." >&2
  exit 1
fi

echo "Data layer check passed: no direct dbClient.from usage in src/lib."
