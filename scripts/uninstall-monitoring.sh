#!/usr/bin/env bash
# Désinstallation du monitoring automatique Gnamba Server
# Date: 13 mai 2026

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "🗑️  Désinstallation du monitoring Gnamba Server"
echo "==============================================="

# Supprimer le cron job
echo "Suppression du cron job..."
if crontab -l 2>/dev/null | grep -q "gnamba-monitor"; then
    crontab -l 2>/dev/null | grep -v "gnamba-monitor" | crontab -
    echo "✅ Cron job supprimé"
else
    echo "ℹ️  Aucun cron job trouvé"
fi

# Supprimer les fichiers (optionnel)
read -p "Voulez-vous supprimer les fichiers de monitoring ? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -f "${SCRIPT_DIR}/gnamba-monitor.sh"
    rm -f "${SCRIPT_DIR}/monitor-config.env"
    rm -f "${SCRIPT_DIR}/install-monitoring.sh"
    rm -f "${SCRIPT_DIR}/uninstall-monitoring.sh"
    echo "✅ Fichiers de monitoring supprimés"
else
    echo "ℹ️  Fichiers conservés"
fi

# Supprimer les logs (optionnel)
read -p "Voulez-vous supprimer les logs de monitoring ? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf "${PROJECT_ROOT}/logs"
    echo "✅ Logs supprimés"
else
    echo "ℹ️  Logs conservés"
fi

echo ""
echo "✅ Désinstallation terminée"