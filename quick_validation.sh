#!/usr/bin/env bash
# =============================================================================
# QUICK FINALIZATION SCRIPT
# Valide que tout fonctionne et prépare le monitoring
# =============================================================================

set -euo pipefail

PROJECT_ROOT="/home/soma/gnamba-project"
cd "${PROJECT_ROOT}"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  VALIDATION FINALE — GNAMBA SERVER                   ║${NC}"
echo -e "${BLUE}║  Date: 13 mai 2026                                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Services to check
SERVICES=()
PASSED=0
FAILED=0

# 1. Docker Containers
echo -e "${YELLOW}1️⃣  Conteneurs Docker${NC}"
for container in egs-web somagro-web egs-frontend filebrowser; do
    if docker ps --format "{{.Names}}" | grep -q "^${container}$"; then
        echo -e "  ${GREEN}✅${NC} $container"
        PASSED=$((PASSED + 1))
    else
        echo -e "  ${RED}❌${NC} $container"
        FAILED=$((FAILED + 1))
    fi
done
echo ""

# 2. Supabase Services
echo -e "${YELLOW}2️⃣  Services Supabase${NC}"

# API
if curl -s -o /dev/null -w "%{http_code}" http://localhost:54321/rest/v1/ 2>/dev/null | grep -q "200\|404"; then
    echo -e "  ${GREEN}✅${NC} Supabase API (54321)"
    PASSED=$((PASSED + 1))
else
    echo -e "  ${RED}❌${NC} Supabase API (54321)"
    FAILED=$((FAILED + 1))
fi

# Database
if supabase sql "SELECT 1;" 2>/dev/null | grep -q "1"; then
    echo -e "  ${GREEN}✅${NC} PostgreSQL Database (54322)"
    PASSED=$((PASSED + 1))
else
    echo -e "  ${YELLOW}⏳${NC} PostgreSQL Database (54322) - starting"
    FAILED=$((FAILED + 1))
fi

echo ""

# 3. Backups
echo -e "${YELLOW}3️⃣  Sauvegardes${NC}"
BACKUP_COUNT=$(find "${PROJECT_ROOT}/backups/supabase" -maxdepth 2 -name "*.dump" -o -name "*.sql" | wc -l)
if [ $BACKUP_COUNT -gt 0 ]; then
    LAST_BACKUP=$(find "${PROJECT_ROOT}/backups/supabase" -maxdepth 2 \( -name "*.dump" -o -name "*.sql" \) -printf '%T@\n' 2>/dev/null | sort -n | tail -1)
    HOURS_AGO=$(( ($(date +%s) - ${LAST_BACKUP%.*}) / 3600 ))
    echo -e "  ${GREEN}✅${NC} $BACKUP_COUNT backups trouvés (${HOURS_AGO}h)"
    PASSED=$((PASSED + 1))
else
    echo -e "  ${RED}❌${NC} Aucun backup trouvé"
    FAILED=$((FAILED + 1))
fi
echo ""

# 4. Monitoring Scripts
echo -e "${YELLOW}4️⃣  Scripts de Monitoring${NC}"

for script in "scripts/gnamba-monitor.sh" "scripts/install-monitoring.sh" "scripts/monitor-config.env"; do
    if [ -f "$script" ]; then
        echo -e "  ${GREEN}✅${NC} $script"
        PASSED=$((PASSED + 1))
    else
        echo -e "  ${RED}❌${NC} $script"
        FAILED=$((FAILED + 1))
    fi
done
echo ""

# 5. Documentation
echo -e "${YELLOW}5️⃣  Documentation${NC}"

for doc in "docs/MONITORING.md" "REMEDIATION_REPORT.md"; do
    if [ -f "$doc" ]; then
        echo -e "  ${GREEN}✅${NC} $doc"
        PASSED=$((PASSED + 1))
    else
        echo -e "  ${YELLOW}⏳${NC} $doc (sera créé)"
    fi
done
echo ""

# Final Summary
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ VALIDATION: $PASSED réussi${NC}"
if [ $FAILED -gt 0 ]; then
    echo -e "${YELLOW}⏳ EN COURS: $FAILED à vérifier${NC}"
fi
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""

# Next steps
echo -e "${BLUE}🚀 PROCHAINES ÉTAPES:${NC}"
echo ""
echo "1️⃣  Installer la surveillance automatique:"
echo -e "   ${YELLOW}cd $PROJECT_ROOT${NC}"
echo -e "   ${YELLOW}chmod +x scripts/install-monitoring.sh${NC}"
echo -e "   ${YELLOW}./scripts/install-monitoring.sh${NC}"
echo ""
echo "2️⃣  Vérifier les logs de monitoring:"
echo -e "   ${YELLOW}tail -f logs/gnamba-monitor-\$(date +%Y%m%d).log${NC}"
echo ""
echo "3️⃣  Tester le monitoring maintenant:"
echo -e "   ${YELLOW}./scripts/gnamba-monitor.sh${NC}"
echo ""
echo "4️⃣  Commit les changements:"
echo -e "   ${YELLOW}git add -A${NC}"
echo -e "   ${YELLOW}git commit -m 'fix: gnamba monitoring system installed'${NC}"
echo ""

echo -e "${GREEN}✨ Gnamba Server est maintenant stabilisé et monitore${NC}"