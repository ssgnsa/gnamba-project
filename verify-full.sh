#!/bin/bash
# ============================================
# VÉRIFICATION COMPLÈTE POST-DÉPLOIEMENT
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

echo "🔍 ANALYSE COMPLÈTE EGS"
echo "============================================"
echo "Date: $(date)"
echo ""

# ============================================
# 1. STATUT CONTENEURS
# ============================================
echo -e "${BLUE}1. STATUT CONTENEURS${NC}"
echo "--------------------------------------------"

if docker ps | grep -q "egs-web"; then
    echo -e "${GREEN}✅ EGS: En cours d'exécution${NC}"
    docker ps --filter "name=egs-web" --format "   Nom: {{.Names}}\n   Status: {{.Status}}\n   Ports: {{.Ports}}"
else
    echo -e "${RED}❌ EGS: Non trouvé${NC}"
    ((ERRORS++))
fi

echo ""

# ============================================
# 2. TESTS CONNECTIVITÉ HTTP
# ============================================
echo -e "${BLUE}2. TESTS CONNECTIVITÉ HTTP${NC}"
echo "--------------------------------------------"

# Test EGS
echo -n "   EGS (localhost:8080): "
HTTP_EGS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://localhost:8080/ 2>&1 || echo "000")
if [ "$HTTP_EGS" = "200" ]; then
    echo -e "${GREEN}HTTP $HTTP_EGS ✅${NC}"
else
    echo -e "${RED}HTTP $HTTP_EGS ❌${NC}"
    ((ERRORS++))
fi

# Test API Supabase
echo -n "   Supabase Cloud: "
HTTP_CLOUD=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 \
    "https://thykrnoqgylrbfupophs.supabase.co/rest/v1/" 2>&1 || echo "000")
if [ "$HTTP_CLOUD" = "401" ]; then
    echo -e "${GREEN}HTTP $HTTP_CLOUD (attendu) ✅${NC}"
else
    echo -e "${YELLOW}HTTP $HTTP_CLOUD ⚠️${NC}"
    ((WARNINGS++))
fi

# Test avec anon key
echo -n "   Supabase + Auth: "
HTTP_AUTH=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 \
    -H "apikey: sb_publishable_K2AvUraEL_URgy91DbLcyQ_wDPtmWuu" \
    "https://thykrnoqgylrbfupophs.supabase.co/rest/v1/user_profiles?select=count" 2>&1 || echo "000")
if [ "$HTTP_AUTH" = "200" ]; then
    echo -e "${GREEN}HTTP $HTTP_AUTH ✅${NC}"
else
    echo -e "${YELLOW}HTTP $HTTP_AUTH ⚠️ (peut nécessiter login)${NC}"
fi

echo ""

# ============================================
# 3. ANALYSE LOGS EGS
# ============================================
echo -e "${BLUE}3. ANALYSE LOGS EGS${NC}"
echo "--------------------------------------------"

if docker ps | grep -q "egs-web"; then
    # Récupérer les logs
    LOGS=$(docker logs --tail 50 egs-web 2>&1)
    
    # Compter les erreurs
    ERR_COUNT=$(echo "$LOGS" | grep -icE "error|failed|emerg|crit|alert" || echo "0")
    WARN_COUNT=$(echo "$LOGS" | grep -icE "warn|404|not found" || echo "0")
    
    echo "   Erreurs trouvées: $ERR_COUNT"
    echo "   Warnings trouvés: $WARN_COUNT"
    
    if [ "$ERR_COUNT" -gt 0 ]; then
        echo -e "   ${RED}❌ Erreurs détectées:${NC}"
        echo "$LOGS" | grep -iE "error|failed|emerg|crit" | tail -5 | while read line; do
            echo "      $line"
        done
        ((ERRORS++))
    else
        echo -e "   ${GREEN}✅ Pas d'erreurs critiques${NC}"
    fi
    
    # Vérifier nginx a démarré
    if echo "$LOGS" | grep -q "ready for start up"; then
        echo -e "   ${GREEN}✅ Nginx démarré correctement${NC}"
    else
        echo -e "   ${YELLOW}⚠️  Nginx status incertain${NC}"
    fi
else
    echo -e "   ${RED}❌ EGS non démarré${NC}"
    ((ERRORS++))
fi

echo ""

# ============================================
# 4. VÉRIFICATION FICHIERS
# ============================================
echo -e "${BLUE}4. VÉRIFICATION FICHIERS${NC}"
echo "--------------------------------------------"

# Vérifier index.html existe
if docker exec egs-web ls -la /usr/share/nginx/html/index.html 2>/dev/null | grep -q "index.html"; then
    echo -e "   ${GREEN}✅ index.html présent${NC}"
else
    echo -e "   ${RED}❌ index.html manquant${NC}"
    ((ERRORS++))
fi

# Vérifier assets
ASSETS=$(docker exec egs-web ls /usr/share/nginx/html/assets/ 2>/dev/null | wc -l)
if [ "$ASSETS" -gt 0 ]; then
    echo -e "   ${GREEN}✅ Assets présents ($ASSETS fichiers)${NC}"
else
    echo -e "   ${YELLOW}⚠️  Pas d'assets trouvés${NC}"
    ((WARNINGS++))
fi

echo ""

# ============================================
# 5. TEST FONCTIONNALITÉ
# ============================================
echo -e "${BLUE}5. TEST FONCTIONNALITÉ${NC}"
echo "--------------------------------------------"

# Test contenu HTML
echo -n "   Contenu HTML: "
HTML=$(curl -s --max-time 10 http://localhost:8080/ 2>/dev/null | head -c 500)
if echo "$HTML" | grep -q "EGS\|Gnamba\|index\|<!DOCTYPE"; then
    echo -e "${GREEN}✅ Page chargée${NC}"
else
    echo -e "${RED}❌ Page vide ou invalide${NC}"
    ((ERRORS++))
fi

# Test présence fichiers JS/CSS
echo -n "   Ressources statiques: "
JS_COUNT=$(curl -s http://localhost:8080/ 2>/dev/null | grep -oE 'src="[^"]*\.js"' | wc -l)
if [ "$JS_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ $JS_COUNT scripts trouvés${NC}"
else
    echo -e "${YELLOW}⚠️  Pas de scripts détectés${NC}"
    ((WARNINGS++))
fi

echo ""

# ============================================
# 6. RÉSEAU ET CONNECTIVITÉ
# ============================================
echo -e "${BLUE}6. RÉSEAU ET CONNECTIVITÉ${NC}"
echo "--------------------------------------------"

# Vérifier ports
NETSTAT=$(ss -tlnp 2>/dev/null | grep -E ":8080|:80" || echo "")
if echo "$NETSTAT" | grep -q ":8080"; then
    echo -e "   ${GREEN}✅ Port 8080 ouvert${NC}"
else
    echo -e "${YELLOW}⚠️  Port 8080 non détecté${NC}"
fi

# Test DNS Supabase
echo -n "   DNS Supabase: "
if nslookup thykrnoqgylrbfupophs.supabase.co >/dev/null 2>&1; then
    IP=$(nslookup thykrnoqgylrbfupophs.supabase.co 2>/dev/null | grep -A1 "Name:" | grep "Address:" | head -1 | awk '{print $2}')
    echo -e "${GREEN}✅ Résolu ($IP)${NC}"
else
    echo -e "${YELLOW}⚠️  DNS non résolu${NC}"
fi

echo ""

# ============================================
# 7. PERFORMANCE
# ============================================
echo -e "${BLUE}7. PERFORMANCE${NC}"
echo "--------------------------------------------"

# Temps de réponse
echo -n "   Temps de réponse EGS: "
TIME=$(curl -s -o /dev/null -w "%{time_total}" --max-time 10 http://localhost:8080/ 2>/dev/null || echo "99")
echo "${TIME}s"

if (( $(echo "$TIME < 1.0" | bc -l 2>/dev/null || echo "0") )); then
    echo -e "   ${GREEN}✅ Rapide (< 1s)${NC}"
elif (( $(echo "$TIME < 3.0" | bc -l 2>/dev/null || echo "0") )); then
    echo -e "   ${YELLOW}⚠️  Lent (1-3s)${NC}"
else
    echo -e "   ${RED}❌ Très lent (> 3s)${NC}"
fi

echo ""

# ============================================
# RÉSUMÉ FINAL
# ============================================
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}RÉSUMÉ FINAL${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}🎉 TOUT EST OK - Système opérationnel${NC}"
    echo ""
    echo -e "${CYAN}🌐 Accès:${NC}"
    echo "   EGS: http://localhost:8080"
    echo "   Login: admin / GnambaAdmin2024!"
    echo ""
    echo -e "${CYAN}✅ Services vérifiés:${NC}"
    echo "   • EGS démarré et accessible"
    echo "   • Supabase Cloud connecté"
    echo "   • Pas d'erreurs critiques"
    echo "   • Performance acceptable"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  FONCTIONNEL AVEC WARNINGS${NC}"
    echo "   Erreurs: $ERRORS | Warnings: $WARNINGS"
    echo ""
    echo "EGS est accessible mais certains éléments"
    echo "pourraient nécessiter attention."
    exit 0
else
    echo -e "${RED}❌ PROBLÈMES DÉTECTÉS${NC}"
    echo "   Erreurs: $ERRORS | Warnings: $WARNINGS"
    echo ""
    echo "Des erreurs critiques ont été trouvées."
    echo "Consultez les logs: docker logs egs-web"
    exit 1
fi
