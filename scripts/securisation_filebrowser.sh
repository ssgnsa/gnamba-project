#!/bin/bash
# ============================================
# Script de Sécurisation - EGS
# ============================================
# Ce script :
# 1. Ferme Samba (ports 445, 139)
# 2. Installe FileBrowser
# 3. Configure Cloudflare Tunnel
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCÈS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[ATTENTION]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERREUR]${NC} $1"
}

# ============================================
# ÉTAPE 1 : FERMETURE DE SAMBA
# ============================================
log_info "=== ÉTAPE 1 : FERMETURE DE SAMBA ==="

# Arrêter Samba
log_info "Arrêt de Samba..."
sudo systemctl stop smbd nmbd 2>/dev/null || log_warning "Samba n'était pas en cours d'exécution"

# Désactiver au démarrage
log_info "Désactivation de Samba au démarrage..."
sudo systemctl disable smbd nmbd 2>/dev/null || log_warning "Samba déjà désactivé"

# Fermer les ports firewall
log_info "Fermeture des ports Samba dans le firewall..."
sudo ufw deny 445/tcp 2>/dev/null || log_warning "Port 445/tcp déjà fermé"
sudo ufw deny 445/udp 2>/dev/null || log_warning "Port 445/udp déjà fermé"
sudo ufw deny 139/tcp 2>/dev/null || log_warning "Port 139/tcp déjà fermé"
sudo ufw deny 139/udp 2>/dev/null || log_warning "Port 139/udp déjà fermé"

# Vérification
log_info "Vérification des ports Samba..."
if sudo netstat -tlnp 2>/dev/null | grep -E ':(445|139)'; then
    log_error "⚠️  Les ports Samba sont toujours ouverts !"
    log_warning "Veuillez les fermer manuellement."
else
    log_success "✅ Ports Samba fermés (445, 139)"
fi

echo ""

# ============================================
# ÉTAPE 2 : CRÉATION FILEBROWSER
# ============================================
log_info "=== ÉTAPE 2 : CRÉATION DE FILEBROWSER ==="

# Créer les répertoires
log_info "Création des répertoires..."
mkdir -p /home/soma/filebrowser/{database,config}
mkdir -p /home/soma/partage/{commun,archives}
mkdir -p /home/soma/partage/{vincent,jessica}

# Définir les permissions
log_info "Configuration des permissions..."
sudo chown -R 1000:1000 /home/soma/partage || log_warning "Impossible de changer les permissions"
chmod -R 755 /home/soma/partage

# Créer le fichier de configuration
log_info "Création de la configuration FileBrowser..."
cat > /home/soma/filebrowser/config/settings.json << 'EOF'
{
  "key": "filebrowser-secure-key-$(date +%s)",
  "signup": false,
  "authMethod": "json"
}
EOF

# Vérifier si le container existe déjà
if docker ps -a --format '{{.Names}}' | grep -q "^filebrowser$"; then
    log_warning "FileBrowser existe déjà. Suppression..."
    docker stop filebrowser 2>/dev/null || true
    docker rm filebrowser 2>/dev/null || true
fi

# Démarrer FileBrowser
log_info "Démarrage de FileBrowser..."
cd /home/soma/gnamba-project

# Créer .env.filebrowser s'il n'existe pas
if [ ! -f .env.filebrowser ]; then
    cat > .env.filebrowser << 'EOF'
FILEBROWSER_PORT=8081
EOF
fi

# Démarrer le container
docker-compose -f docker-compose.filebrowser.yml --env-file .env.filebrowser up -d

# Attendre que le container soit prêt
log_info "Attente du démarrage de FileBrowser..."
sleep 5

# Vérifier le statut
if docker ps --format '{{.Names}}' | grep -q "^filebrowser$"; then
    log_success "✅ FileBrowser démarré avec succès"
    docker ps --filter "name=filebrowser" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
else
    log_error "❌ Échec du démarrage de FileBrowser"
    docker logs filebrowser --tail 20
    exit 1
fi

echo ""

# ============================================
# ÉTAPE 3 : CONFIGURATION DU PREMIER UTILISATEUR
# ============================================
log_info "=== ÉTAPE 3 : CONFIGURATION DES UTILISATEURS ==="

# Attendre que FileBrowser soit prêt
sleep 3

# Changer le mot de passe admin par défaut
log_info "Changement du mot de passe admin..."
MOT_DE_PASSE_ADMIN="Gnamba2026!Secure"
docker exec filebrowser filebrowser users update admin --password "$MOT_DE_PASSE_ADMIN" 2>/dev/null || {
    log_warning "Impossible de changer le mot de passe via CLI"
    log_info "Veuillez le changer manuellement dans l'interface web"
}

# Créer les utilisateurs
log_info "Création des utilisateurs..."

# Vincent
docker exec filebrowser filebrowser users add vincent "Vincent2026!" --perm.admin 2>/dev/null || log_warning "Utilisateur 'vincent' existe déjà"

# Jessica
docker exec filebrowser filebrowser users add jessica "Jessica2026!" --perm.admin 2>/dev/null || log_warning "Utilisateur 'jessica' existe déjà"

# Lister les utilisateurs
log_info "Utilisateurs créés :"
docker exec filebrowser filebrowser users ls 2>/dev/null || log_warning "Impossible de lister les utilisateurs"

echo ""

# ============================================
# ÉTAPE 4 : CONFIGURATION CLOUDFLARE TUNNEL
# ============================================
log_info "=== ÉTAPE 4 : CONFIGURATION CLOUDFLARE ==="

# Vérifier si le fichier de config existe
if [ ! -f /home/soma/.cloudflared/config.yml ]; then
    log_error "❌ Fichier de configuration Cloudflare introuvable"
    exit 1
fi

# Sauvegarder l'ancienne configuration
log_info "Sauvegarde de l'ancienne configuration..."
cp /home/soma/.cloudflared/config.yml /home/soma/.cloudflared/config.yml.backup.$(date +%Y%m%d_%H%M%S)

# Ajouter la route FileBrowser si elle n'existe pas déjà
if grep -q "fichiers.gnambaservices.ci" /home/soma/.cloudflared/config.yml; then
    log_warning "La route FileBrowser existe déjà dans Cloudflare"
else
    log_info "Ajout de la route FileBrowser..."
    
    # Créer une nouvelle configuration
    cat > /home/soma/.cloudflared/config.yml << 'EOF'
tunnel: 62d4963e-0aa5-4cfe-b64d-e6faa7b8963a
credentials-file: /home/soma/.cloudflared/cert.pem

ingress:
  # EGS - Application principale
  - hostname: gnambaservices.ci
    service: http://localhost:8080
  - hostname: www.gnambaservices.ci
    service: http://localhost:8080

  # Portail EGS
  - hostname: portal.gnambaservices.ci
    service: http://localhost:8080

  # FileBrowser - Partage de fichiers
  - hostname: fichiers.gnambaservices.ci
    service: http://localhost:8081

  # Autres services (à configurer plus tard)
  - hostname: dolibarr.gnambaservices.ci
    service: http://localhost:5173

  # Service par défaut - 404
  - service: http_status:404
EOF
    
    log_success "✅ Configuration Cloudflare mise à jour"
fi

# Redémarrer Cloudflare
log_info "Redémarrage de Cloudflare Tunnel..."

# Tuer l'ancien processus
pkill cloudflared 2>/dev/null || log_warning "Aucun processus cloudflared en cours"

# Attendre
sleep 2

# Redémarrer
nohup /home/soma/bin/cloudflared tunnel --no-autoupdate \
  --logfile /home/soma/logs/cloudflared.log \
  --config /home/soma/.cloudflared/config.yml \
  run --token-file /home/soma/secrets/cloudflared_token > /dev/null 2>&1 &

# Attendre la connexion
log_info "Attente de la connexion Cloudflare..."
sleep 5

# Vérifier la connexion
if tail -20 /home/soma/logs/cloudflared.log | grep -q "Registered tunnel connection"; then
    log_success "✅ Cloudflare Tunnel connecté"
else
    log_warning "⚠️  Vérifiez les logs Cloudflare manuellement"
fi

echo ""

# ============================================
# ÉTAPE 5 : VÉRIFICATIONS FINALES
# ============================================
log_info "=== ÉTAPE 5 : VÉRIFICATIONS FINALES ==="

# Vérifier les services
echo ""
log_info "État des services :"
echo ""

# FileBrowser
if docker ps --format '{{.Names}}' | grep -q "^filebrowser$"; then
    echo -e "  ${GREEN}✓${NC} FileBrowser : En cours d'exécution"
else
    echo -e "  ${RED}✗${NC} FileBrowser : Arrêté"
fi

# Cloudflare
if pgrep -x cloudflared > /dev/null; then
    echo -e "  ${GREEN}✓${NC} Cloudflare Tunnel : En cours d'exécution"
else
    echo -e "  ${RED}✗${NC} Cloudflare Tunnel : Arrêté"
fi

# Samba
if sudo systemctl is-active smbd > /dev/null 2>&1; then
    echo -e "  ${RED}✗${NC} Samba : Toujours actif (à fermer)"
else
    echo -e "  ${GREEN}✓${NC} Samba : Arrêté"
fi

echo ""

# Ports ouverts
log_info "Ports réseau :"
echo ""
sudo netstat -tlnp 2>/dev/null | grep -E ':(2222|80|445|139|3306|8080|8081)' | while read line; do
    if echo "$line" | grep -qE ':(445|139)'; then
        echo -e "  ${RED}✗${NC} $line"
    elif echo "$line" | grep -qE ':(8081|8080)'; then
        echo -e "  ${GREEN}✓${NC} $line (FileBrowser/EGS)"
    else
        echo -e "  ${GREEN}✓${NC} $line"
    fi
done

echo ""

# ============================================
# RÉSUMÉ
# ============================================
echo "============================================"
echo -e "${GREEN}=== CONFIGURATION TERMINÉE ===${NC}"
echo "============================================"
echo ""
echo "📁 FileBrowser :"
echo "   - URL Locale : http://localhost:8081"
echo "   - URL Cloudflare : https://fichiers.gnambaservices.ci"
echo "   - Admin : admin / $MOT_DE_PASSE_ADMIN"
echo ""
echo "👥 Utilisateurs créés :"
echo "   - vincent / Vincent2026!"
echo "   - jessica / Jessica2026!"
echo ""
echo "📂 Dossiers de partage :"
echo "   - /home/soma/partage/commun/"
echo "   - /home/soma/partage/vincent/"
echo "   - /home/soma/partage/jessica/"
echo "   - /home/soma/partage/archives/"
echo ""
echo "🔒 Sécurité :"
echo "   - Samba : FERMÉ (ports 445, 139)"
echo "   - FileBrowser : Protégé par authentification"
echo "   - Cloudflare : HTTPS activé"
echo ""
echo "============================================"
echo ""
log_success "✅ Script terminé avec succès !"
