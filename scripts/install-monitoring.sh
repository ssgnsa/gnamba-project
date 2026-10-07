#!/usr/bin/env bash
# Installation du monitoring automatique Gnamba Server
# Date: 13 mai 2026

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
MONITOR_SCRIPT="${SCRIPT_DIR}/gnamba-monitor.sh"

# Vérifier que le script de monitoring existe
if [ ! -f "${MONITOR_SCRIPT}" ]; then
    echo "❌ Script de monitoring introuvable: ${MONITOR_SCRIPT}"
    exit 1
fi

# Rendre le script exécutable
chmod +x "${MONITOR_SCRIPT}"

echo "🔧 Installation du monitoring automatique Gnamba Server"
echo "======================================================="

# Créer le répertoire de logs
mkdir -p "${PROJECT_ROOT}/logs"

# Installer les dépendances (optionnel)
echo "📦 Vérification des dépendances..."
if ! command -v curl >/dev/null 2>&1; then
    echo "⚠️  curl non installé - alertes HTTP limitées"
fi

if ! command -v mail >/dev/null 2>&1; then
    echo "⚠️  mail non installé - alertes email désactivées"
    echo "   Pour activer: sudo apt install mailutils"
fi

# Configuration du cron
CRON_JOB="*/30 * * * * cd ${PROJECT_ROOT} && ${MONITOR_SCRIPT} --cron"

# Vérifier si le cron job existe déjà
if crontab -l 2>/dev/null | grep -q "gnamba-monitor"; then
    echo "⚠️  Cron job déjà configuré. Suppression de l'ancien..."
    crontab -l 2>/dev/null | grep -v "gnamba-monitor" | crontab -
fi

# Ajouter le nouveau cron job
(crontab -l 2>/dev/null; echo "${CRON_JOB}") | crontab -

echo "✅ Cron job installé:"
echo "   Fréquence: Toutes les 30 minutes"
echo "   Commande: ${CRON_JOB}"
echo ""

# Tester le monitoring immédiatement
echo "🧪 Test du monitoring..."
if ${MONITOR_SCRIPT}; then
    echo "✅ Test réussi"
else
    echo "⚠️  Test échoué - vérifier les logs"
fi

echo ""
echo "📊 Fichiers créés/modifiés:"
echo "   - scripts/gnamba-monitor.sh (script principal)"
echo "   - scripts/monitor-config.env (configuration)"
echo "   - logs/gnamba-monitor-YYYYMMDD.log (logs quotidiens)"
echo "   - logs/alerts-YYYYMMDD.log (alertes)"
echo "   - logs/daily-report-YYYYMMDD.md (rapports)"
echo ""

echo "🔧 Configuration recommandée:"
echo "1. Éditer scripts/monitor-config.env pour configurer les alertes"
echo "2. Tester manuellement: ./scripts/gnamba-monitor.sh"
echo "3. Vérifier les logs: tail -f logs/gnamba-monitor-$(date +%Y%m%d).log"
echo ""

echo "🚀 Monitoring automatique opérationnel !"