#!/usr/bin/env bash
set -euo pipefail

files=(
  "src/pages/Dashboard.tsx"
  "src/pages/Projets.tsx"
  "src/pages/Employes.tsx"
  "src/pages/Fournitures.tsx"
  "src/pages/Fournisseurs.tsx"
  "src/pages/Finances.tsx"
  "src/pages/Taches.tsx"
  "src/pages/Statistiques.tsx"
  "src/pages/Foncier.tsx"
  "src/pages/Immobilier.tsx"
  "src/pages/Documents.tsx"
  "src/pages/Leads.tsx"
  "src/pages/RegistreVisiteur.tsx"
  "src/pages/public/PublicHome.tsx"
  "src/pages/public/PublicLots.tsx"
  "src/pages/admin/SiteEditor.tsx"
  "src/components/page-builder/PageBuilder.tsx"
)

if rg -n "dbClient\.from" "${files[@]}"; then
  echo "Direct dbClient.from usage found in migrated ERP pages." >&2
  exit 1
fi

echo "Data layer check passed: no direct dbClient.from usage in migrated ERP pages."
