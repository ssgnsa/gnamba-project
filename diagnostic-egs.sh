#!/bin/bash
# ============================================================================
# Script de diagnostic complet de la chaîne de publication EGS
# ============================================================================
# Usage: chmod +x diagnostic-egs.sh && ./diagnostic-egs.sh
# ============================================================================

set -e

# Couleurs pour la sortie
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

separator() {
    echo -e "\n${BLUE}============================================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================================================${NC}\n"
}

success() { echo -e "${GREEN}✓ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
error() { echo -e "${RED}✗ $1${NC}"; }

# ============================================================================
# 1. VÉRIFIER QUEL SERVICE RÉPOND SUR LES PORTS LOCAUX
# ============================================================================
separator "1. VÉRIFICATION DES SERVICES LOCAUX"

echo "--- Test http://127.0.0.1:8080/ ---"
curl -s -i -m 5 http://127.0.0.1:8080/ 2>&1 | head -20 || error "Aucun service sur 8080"

echo -e "\n--- Test http://127.0.0.1:8080/api/v1/health ---"
curl -s -i -m 5 http://127.0.0.1:8080/api/v1/health 2>&1 || error "Endpoint /health injoignable"

echo -e "\n--- Test http://127.0.0.1:8000/ (port FastAPI par défaut) ---"
curl -s -i -m 5 http://127.0.0.1:8000/ 2>&1 | head -10 || warning "Pas de service sur 8000"

echo -e "\n--- Test http://127.0.0.1:80/ (port Apache/Nginx) ---"
curl -s -i -m 5 http://127.0.0.1:80/ 2>&1 | head -10 || warning "Pas de service sur 80"

# ============================================================================
# 2. INSPECTION DU CONTENEUR egs-web
# ============================================================================
separator "2. INSPECTION DU CONTENEUR egs-web"

echo "--- État des conteneurs Docker ---"
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}\t{{.Image}}" | grep -E "NAMES|egs" || warning "Aucun conteneur egs trouvé"

echo -e "\n--- Architecture du conteneur egs-web ---"
if docker inspect egs-web >/dev/null 2>&1; then
    echo "Conteneur trouvé. Analyse..."
    
    echo -e "\n  [Variables d'environnement]"
    docker inspect egs-web --format='{{range .Config.Env}}{{println .}}{{end}}' | grep -E "API|BACKEND|FRONTEND|URL|PORT|HOST|PROXY" || echo "  Aucune variable pertinente"
    
    echo -e "\n  [Commande de démarrage]"
    docker inspect egs-web --format='{{.Config.Cmd}}'
    docker inspect egs-web --format='{{.Config.Entrypoint}}'
    
    echo -e "\n  [Ports exposés (EXPOSE)]"
    docker inspect egs-web --format='{{json .Config.ExposedPorts}}' | python3 -m json.tool 2>/dev/null || docker inspect egs-web --format='{{json .Config.ExposedPorts}}'
    
    echo -e "\n  [Ports liés (PORT MAPPING)]"
    docker inspect egs-web --format='{{json .HostConfig.PortBindings}}' | python3 -m json.tool 2>/dev/null || docker inspect egs-web --format='{{json .HostConfig.PortBindings}}'
    
    echo -e "\n  [Labels]"
    docker inspect egs-web --format='{{range $k, $v := .Config.Labels}}{{$k}}={{$v}}{{"\n"}}{{end}}' | head -20
    
    echo -e "\n  [Volumes montés]"
    docker inspect egs-web --format='{{range .Mounts}}{{.Source}} -> {{.Destination}}{{"\n"}}{{end}}'
    
    echo -e "\n  [Réseau]"
    docker inspect egs-web --format='{{range $net, $conf := .NetworkSettings.Networks}}{{$net}}: {{$conf.IPAddress}}{{"\n"}}{{end}}'
else
    error "Le conteneur egs-web n'existe pas"
fi

# ============================================================================
# 3. VÉRIFICATION DES PORTS EXPOSÉS
# ============================================================================
separator "3. PORTS RÉELLEMENT EXPOSÉS"

echo "--- docker ps (format étendu) ---"
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Ports}}"

echo -e "\n--- Ports écoutés sur la machine hôte ---"
echo "  [ss -lntp]"
sudo ss -lntp 2>/dev/null | grep -E "LISTEN|State" | head -30

echo -e "\n  [netstat -lntp]"
sudo netstat -lntp 2>/dev/null | grep -E "LISTEN|Proto" | head -30 || warning "netstat non disponible"

echo -e "\n--- Ports ouverts dans les conteneurs Docker ---"
for container in $(docker ps -q); do
    name=$(docker inspect -f '{{.Name}}' $container | sed 's/^\///')
    echo "  Conteneur: $name"
    docker port $container 2>/dev/null | sed 's/^/    /' || echo "    Aucun port mappé"
done

# ============================================================================
# 4. VÉRIFIER SI FASTAPI ÉCOUTE RÉELLEMENT
# ============================================================================
separator "4. VÉRIFICATION DE L'ÉCOUTE FASTAPI"

echo "--- Processus Python dans les conteneurs ---"
for container in $(docker ps -q); do
    name=$(docker inspect -f '{{.Name}}' $container | sed 's/^\///')
    echo "  [$name]"
    docker exec $container ps aux 2>/dev/null | grep -E "python|uvicorn|gunicorn|fastapi" | grep -v grep || echo "    Pas de processus Python"
done

echo -e "\n--- Test de l'endpoint OpenAPI (signature FastAPI) ---"
curl -s -m 5 http://127.0.0.1:8080/openapi.json | head -c 500 || warning "Pas d'openapi.json sur 8080"
echo ""
curl -s -m 5 http://127.0.0.1:8000/openapi.json | head -c 500 || warning "Pas d'openapi.json sur 8000"
echo ""

echo -e "\n--- Test de l'endpoint docs (signature FastAPI) ---"
curl -s -i -m 5 http://127.0.0.1:8080/docs 2>&1 | head -10 || warning "Pas de /docs sur 8080"
echo ""
curl -s -i -m 5 http://127.0.0.1:8000/docs 2>&1 | head -10 || warning "Pas de /docs sur 8000"

# ============================================================================
# 5. CORRESPONDANCE DOMAINE / CONTENEUR
# ============================================================================
separator "5. CORRESPONDANCE api.gnambaservices.ci ↔ CONTENEUR"

echo "--- Résolution DNS du domaine ---"
dig +short api.gnambaservices.ci 2>/dev/null || nslookup api.gnambaservices.ci 2>/dev/null || host api.gnambaservices.ci 2>/dev/null || warning "Impossible de résoudre le domaine"

echo -e "\n--- Vérification Cloudflare (en-têtes) ---"
curl -s -I -m 10 https://api.gnambaservices.ci/ 2>&1 | grep -iE "server:|cf-|x-powered|x-real|x-forwarded" || warning "Pas d'en-têtes Cloudflare détectés"

echo -e "\n--- Test de la racine du domaine ---"
curl -s -i -m 10 https://api.gnambaservices.ci/ 2>&1 | head -25

# ============================================================================
# 6. TESTS COMPARATIFS LOCAL vs PUBLIC
# ============================================================================
separator "6. TESTS COMPARATIFS LOCAL vs PUBLIC"

echo "--- TEST A: curl -i http://127.0.0.1:8080/api/v1/health ---"
curl -s -i -m 10 http://127.0.0.1:8080/api/v1/health 2>&1
echo -e "\n"

echo "--- TEST B: curl -i https://api.gnambaservices.ci/api/v1/health ---"
curl -s -i -m 10 https://api.gnambaservices.ci/api/v1/health 2>&1
echo -e "\n"

echo "--- TEST C: curl -i https://api.gnambaservices.ci/openapi.json ---"
curl -s -i -m 10 https://api.gnambaservices.ci/openapi.json 2>&1 | head -30
echo -e "\n"

echo "--- TEST D: curl -i http://127.0.0.1:8080/openapi.json ---"
curl -s -i -m 10 http://127.0.0.1:8080/openapi.json 2>&1 | head -30
echo -e "\n"

# ============================================================================
# 7. TESTS CORS (OPTIONS)
# ============================================================================
separator "7. TESTS CORS (OPTIONS)"

echo "--- OPTIONS sur le domaine public ---"
curl -s -i -X OPTIONS -m 10 \
    -H "Origin: https://www.gnambaservices.ci" \
    -H "Access-Control-Request-Method: GET" \
    -H "Access-Control-Request-Headers: Content-Type" \
    https://api.gnambaservices.ci/api/v1/health 2>&1 | head -20
echo -e "\n"

echo "--- OPTIONS en local ---"
curl -s -i -X OPTIONS -m 10 \
    -H "Origin: https://www.gnambaservices.ci" \
    -H "Access-Control-Request-Method: GET" \
    -H "Access-Control-Request-Headers: Content-Type" \
    http://127.0.0.1:8080/api/v1/health 2>&1 | head -20
echo -e "\n"

# ============================================================================
# 8. INSPECTION DES PROXIES (Kong, Nginx, etc.)
# ============================================================================
separator "8. INSPECTION DES PROXIES INTERNES"

echo "--- Conteneurs liés à un reverse proxy ---"
docker ps -a --format "{{.Names}}\t{{.Image}}" | grep -iE "nginx|kong|traefik|caddy|haproxy|apache" || warning "Aucun proxy détecté dans Docker"

echo -e "\n--- Services Nginx/Apache sur l'hôte ---"
systemctl list-units --type=service --state=running 2>/dev/null | grep -iE "nginx|apache|httpd|kong" || warning "Aucun proxy sur l'hôte"

echo -e "\n--- Fichiers de configuration Nginx (si présents) ---"
if [ -d /etc/nginx ]; then
    echo "  Sites activés:"
    ls -la /etc/nginx/sites-enabled/ 2>/dev/null || echo "  Aucun site activé"
    echo -e "\n  Conf de api.gnambaservices.ci:"
    grep -r "api.gnambaservices.ci\|gnamba" /etc/nginx/ 2>/dev/null | head -10 || echo "  Non trouvé"
else
    echo "  Pas de répertoire /etc/nginx"
fi

echo -e "\n--- Fichiers de configuration Kong (si présents) ---"
if [ -d /etc/kong ]; then
    echo "  kong.conf:"
    grep -vE "^#|^$" /etc/kong/kong.conf 2>/dev/null | head -20
else
    echo "  Pas de répertoire /etc/kong"
fi

echo -e "\n--- Tracing de la requête (verbose) ---"
curl -s -v -m 10 https://api.gnambaservices.ci/api/v1/health 2>&1 | grep -E "^[*<>]|Trying|Connected|SSL|HTTP/" | head -30

# ============================================================================
# 9. RÉSUMÉ ET DIAGNOSTIC
# ============================================================================
separator "9. RÉSUMÉ DU DIAGNOSTIC"

echo "État des composants:"
echo ""

# Vérification locale 8080
if curl -s -m 3 http://127.0.0.1:8080/api/v1/health >/dev/null 2>&1; then
    success "http://127.0.0.1:8080/api/v1/health répond"
else
    error "http://127.0.0.1:8080/api/v1/health NE répond PAS"
fi

# Vérification publique
if curl -s -m 10 https://api.gnambaservices.ci/api/v1/health >/dev/null 2>&1; then
    success "https://api.gnambaservices.ci/api/v1/health répond"
else
    error "https://api.gnambaservices.ci/api/v1/health NE répond PAS"
fi

# Vérification openapi.json
if curl -s -m 10 https://api.gnambaservices.ci/openapi.json >/dev/null 2>&1; then
    success "https://api.gnambaservices.ci/openapi.json accessible"
else
    error "https://api.gnambaservices.ci/openapi.json NON accessible"
fi

# Comparaison des réponses
echo -e "\nComparaison des réponses /health:"
LOCAL=$(curl -s -m 5 http://127.0.0.1:8080/api/v1/health 2>/dev/null)
PUBLIC=$(curl -s -m 10 https://api.gnambaservices.ci/api/v1/health 2>/dev/null)

if [ -n "$LOCAL" ] && [ -n "$PUBLIC" ]; then
    if [ "$LOCAL" = "$PUBLIC" ]; then
        success "Les réponses local et public sont IDENTIQUES"
    else
        warning "Les réponses local et public sont DIFFÉRENTES:"
        echo "  Local :  $LOCAL"
        echo "  Public : $PUBLIC"
    fi
else
    error "Impossible de comparer (une ou deux réponses manquantes)"
fi

separator "FIN DU DIAGNOSTIC"
echo "Copie-colle la sortie complète pour analyse."
echo "============================================================================"
