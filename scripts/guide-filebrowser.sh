#!/bin/bash
# ============================================
# Guide d'Utilisation - Intégration FileBrowser
# ============================================

echo "============================================"
echo "  INTÉGRATION FILEBROWSER - GUIDE"
echo "============================================"
echo ""

# 1. État des services
echo "📊 1. ÉTAT DES SERVICES"
echo "-------------------------------------------"
docker ps --filter "name=filebrowser" --filter "name=egs-web" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# 2. URLs d'accès
echo "🌐 2. URLs D'ACCÈS"
echo "-------------------------------------------"
echo "EGS Portal : https://portal.gnambaservices.ci"
echo "FileBrowser : https://fichiers.gnambaservices.ci"
echo ""
echo "Local EGS : http://localhost:8080"
echo "Local FileBrowser : http://localhost:8081"
echo ""

# 3. Identifiants
echo "🔐 3. IDENTIFIANTS FILEBROWSER"
echo "-------------------------------------------"
echo "Username : admin"
echo "Password : Récupérez-le avec :"
echo "  docker logs filebrowser --tail 5 | grep password"
echo ""

# 4. Instructions
echo "📝 4. COMMENT UTILISER"
echo "-------------------------------------------"
echo ""
echo "A) Via le Module Documents (Recommandé)"
echo "   1. Ouvrez : https://portal.gnambaservices.ci"
echo "   2. Allez dans : Documents (sidebar)"
echo "   3. Cliquez sur l'onglet : 'Partage de Fichiers'"
echo "   4. Connectez-vous avec les identifiants admin"
echo "   5. Naviguez et gérez vos fichiers"
echo ""
echo "B) Via FileBrowser Direct"
echo "   1. Ouvrez : https://fichiers.gnambaservices.ci"
echo "   2. Connectez-vous"
echo "   3. Interface complète FileBrowser"
echo ""

# 5. Dépannage
echo "🔧 5. DÉPANNAGE"
echo "-------------------------------------------"
echo ""
echo "Problème : Onglet 'Partage' non visible"
echo "Solution : Vider le cache navigateur (Ctrl+Shift+R)"
echo ""
echo "Problème : FileBrowser 404"
echo "Solution : C'est normal ! Il faut s'authentifier d'abord"
echo ""
echo "Problème : Connection refused localhost:8081"
echo "Solution : Vérifiez que FileBrowser tourne"
echo "  docker ps --filter name=filebrowser"
echo ""

# 6. Commandes utiles
echo "⚙️  6. COMMANDES UTILES"
echo "-------------------------------------------"
echo ""
echo "# Redémarrer FileBrowser"
echo "docker restart filebrowser"
echo ""
echo "# Voir les logs"
echo "docker logs filebrowser --tail 20"
echo ""
echo "# Changer mot de passe admin"
echo "docker exec filebrowser filebrowser users update admin --password 'NouveauMDP'"
echo ""
echo "# Vider le cache EGS"
echo "docker exec egs-web rm -rf /usr/share/nginx/html/assets/*"
echo "npm run build && ./deploy.sh"
echo ""

echo "============================================"
echo "  FIN DU GUIDE"
echo "============================================"
