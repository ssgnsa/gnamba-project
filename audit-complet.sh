#!/bin/bash
# audit-complet.sh - Analyse des capacités du serveur
# À exécuter avec : bash audit-complet.sh

echo "╔════════════════════════════════════════╗"
echo "║   AUDIT CAPACITÉS - GNAMBA SERVER      ║"
echo "╚════════════════════════════════════════╝"
echo "Date: $(date)"
echo "Hôte: $(hostname)"
echo "Utilisateur: $(whoami)"
echo ""

# ────────────────────────────────────────────
# 🔧 SYSTÈME & NOYAU
# ────────────────────────────────────────────
echo "🔹 SYSTÈME"
lsb_release -a 2>/dev/null || cat /etc/os-release | grep PRETTY_NAME
echo "Noyau: $(uname -r)"
echo "Architecture: $(uname -m)"
echo "Uptime: $(uptime -p)"
echo ""

# ────────────────────────────────────────────
# 💻 HARDWARE - CPU & MÉMOIRE
# ────────────────────────────────────────────
echo "🔹 CPU"
lscpu | grep -E "Model name|CPU\(s\)|Thread|Core|Socket|Vendor"
echo ""

echo "🔹 MÉMOIRE"
free -h
echo ""

# ────────────────────────────────────────────
# 💾 STOCKAGE & DISQUES
# ────────────────────────────────────────────
echo "🔹 DISQUES PHYSIQUES"
lsblk -o NAME,SIZE,TYPE,MOUNTPOINT,FSTYPE 2>/dev/null || df -hT
echo ""

echo "🔹 ESPACE UTILISÉ PAR POINT DE MONTAGE"
df -h --output=source,size,used,avail,pcent,target | grep -E "Filesystem|/dev|/mnt"
echo ""

# ────────────────────────────────────────────
# 🌐 RÉSEAU
# ────────────────────────────────────────────
echo "🔹 INTERFACES RÉSEAU"
ip -br a 2>/dev/null || ifconfig -a 2>/dev/null || echo "Commande réseau indisponible"
echo ""

echo "🔹 PORTS ÉCOUTANT"
ss -tulpn 2>/dev/null | head -20
echo ""

echo "🔹 PASSERELLE & DNS"
ip route | grep default
cat /etc/resolv.conf | grep nameserver
echo ""

# ────────────────────────────────────────────
# 🐳 SERVICES & CONTENEURS
# ────────────────────────────────────────────
echo "🔹 SERVICES SYSTEMD (actifs)"
systemctl list-units --type=service --state=running --no-pager | head -25
echo ""

echo "🔹 DOCKER"
if command -v docker &>/dev/null; then
    echo "Docker: $(docker --version)"
    echo "Conteneurs actifs:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "Aucun conteneur ou permission refusée"
else
    echo "Docker: non installé"
fi
echo ""

# ────────────────────────────────────────────
# 📦 LOGICIELS CLÉS
# ────────────────────────────────────────────
echo "🔹 LOGICIELS INSTALLÉS"
for pkg in nginx apache2 mysql mariadb postgresql docker node npm php python3 java git curl wget; do
    if dpkg -l | grep -q "^ii  $pkg "; then
        version=$(dpkg -l | grep "^ii  $pkg " | awk '{print $3}')
        echo "✓ $pkg : $version"
    fi
done
echo ""

# ────────────────────────────────────────────
# 🔐 SÉCURITÉ & ACCÈS
# ────────────────────────────────────────────
echo "🔹 SSH"
grep -E "^Port|^PermitRootLogin" /etc/ssh/sshd_config 2>/dev/null || echo "Config SSH non lisible"
echo ""

echo "🔹 UTILISATEURS AVEC SHELL"
grep -E "bash|sh$" /etc/passwd | cut -d: -f1,7
echo ""

# ────────────────────────────────────────────
# ⚡ CAPACITÉS SPÉCIALES
# ────────────────────────────────────────────
echo "🔹 VIRTUALISATION"
systemd-detect-virt 2>/dev/null || echo "Détection VM indisponible"
echo ""

echo "🔹 SUPPORT HARDWARE"
echo "GPU: $(lspci | grep -i vga 2>/dev/null | cut -d: -f3- || echo 'Non détecté')"
echo "USB: $(lsusb 2>/dev/null | wc -l) périphériques détectés"
echo ""

echo "🔹 MODULES NOYAU CHARGÉS (sélection)"
lsmod | grep -E "docker|overlay|tun|veth|nft|ipt" | head -10
echo ""

# ────────────────────────────────────────────
# 📊 PERFORMANCE
# ────────────────────────────────────────────
echo "🔹 CHARGE SYSTÈME"
uptime
echo ""

echo "🔹 PROCESSUS TOP (CPU)"
ps aux --sort=-%cpu | head -10
echo ""

echo "╔════════════════════════════════════════╗"
echo "║           AUDIT TERMINÉ                ║"
echo "╚════════════════════════════════════════╝"