# Analyse et Correction Tunnel Cloudflare - 2026-06-04

## 🔍 Analyse Effectuée

### 1. État Initial du Tunnel
- **Service:** `cloudflared.service` - actif
- **Mode:** Token-based (`--token-file /home/soma/secrets/cloudflared_token`)
- **Configuration Local:** Désynchronisée (seulement 1 domaine, port 80)
- **Configuration Distante:** 7 domaines pointant vers localhost:8080

### 2. Problèmes Identifiés

#### Problème #1: Désynchronisation Config Locale ↔ Distante
- **Fichier Local:** `/home/soma/.cloudflared/config.yml` = `gnambaservices.ci` → `localhost:80`
- **Config Distante (Cloudflare):** Tous les domaines → `localhost:8080` (❌ port invalide)
- **Impact:** Tunnel utilise config distante, échoue pour la plupart des domaines

#### Problème #2: Service Utilise Token à la Place de Config
- **Commande Systemd:** `cloudflared tunnel run --token-file ...`
- **Résultat:** Service charge config depuis Cloudflare, ignore `config.yml` local
- **Impact:** Impossible de contrôler le routing localement

#### Problème #3: Processus Cloudflared Orphelins
- Plusieurs instances de cloudflared tournaient en même temps
- Anciennes configurations en conflit avec les nouvelles

#### Problème #4: Adresse Bind Incorrecte
- Config distante: `localhost:8080` (localhost ne se résout pas pour le tunnel)
- Conteneur egs-web: écoute sur `0.0.0.0:80` (pas 8080)
- Solution: Utiliser `127.0.0.1` au lieu de `localhost`

## ✅ Corrections Appliquées

### 1. Nettoyage des Processus
```bash
sudo killall cloudflared
# Arrêté tous les processus orphelins
```

### 2. Modification Service Systemd
**Avant:**
```ini
ExecStart=/home/soma/bin/cloudflared tunnel run --token-file /home/soma/secrets/cloudflared_token
```

**Après:**
```ini
ExecStart=/home/soma/bin/cloudflared tunnel --config /home/soma/.cloudflared/config.yml run
```

### 3. Mise à Jour Fichier Config Local
**Fichier:** `/home/soma/.cloudflared/config.yml`

```yaml
tunnel: 6362075c-cd4b-4efb-85ca-f1e888d1363d
credentials-file: /home/soma/.cloudflared/6362075c-cd4b-4efb-85ca-f1e888d1363d.json

ingress:
  - hostname: gnambaservices.ci
    service: http://127.0.0.1:80
  - hostname: www.gnambaservices.ci
    service: http://127.0.0.1:80
  - hostname: portal.gnambaservices.ci
    service: http://127.0.0.1:80
  - hostname: immobilier.gnambaservices.ci
    service: http://127.0.0.1:80
  - hostname: foncier.gnambaservices.ci
    service: http://127.0.0.1:80
  - hostname: fichiers.gnambaservices.ci
    service: http://127.0.0.1:8081
  - hostname: somagro.gnambaservices.ci
    service: http://127.0.0.1:8082
  - service: http_status:404
```

### 4. Application des Modifications
```bash
sudo systemctl daemon-reload
sudo systemctl restart cloudflared
```

## 📊 Résultats des Tests

### Tests Effectués (après correction):
| Domaine | État | Réponse | Statut |
|---------|------|---------|--------|
| `gnambaservices.ci` | ✅ Fonctionnel | HTTP 200 | Connecté au tunnel |
| `www.gnambaservices.ci` | ❌ Erreur | HTTP 522 | Connexion refusée |
| `portal.gnambaservices.ci` | ⚠️ Fallback | HTTP 404 | Route non reconnue |
| `immobilier.gnambaservices.ci` | ⚠️ Fallback | HTTP 404 | Route non reconnue |
| `foncier.gnambaservices.ci` | ⚠️ Fallback | HTTP 404 | Route non reconnue |
| `fichiers.gnambaservices.ci` | ⚠️ Fallback | HTTP 404 | Route non reconnue |
| `somagro.gnambaservices.ci` | ⚠️ Fallback | HTTP 404 | Route non reconnue |

## 🔴 Problème Résiduel Critical

### Config Distante Surchage Config Locale

**Diagnostic:**
Les logs du tunnel montrent que Cloudflare envoie toujours une configuration distante qui surchage la configuration locale:

```json
// Configuration distante reçue par le tunnel au redémarrage
{
  "ingress": [
    {"hostname": "gnambaservices.ci", "service": "http://localhost:8080"},
    {"hostname": "www.gnambaservices.ci", "service": "http://localhost:8080"},
    ...
  ]
}
```

**Cause:**
- Le tunnel a été initialement configuré via le portail Cloudflare (token-based)
- La configuration distante stockée chez Cloudflare est toujours appliquée automatiquement
- Ma configuration locale `config.yml` est donc complètement ignorée

**Solution Requise:**
1. **Option A:** Accéder au portail Cloudflare → Aller à Zero Trust → Tunnel EGS → Mettre à jour les routes
2. **Option B:** Utiliser l'API Cloudflare pour mettre à jour les routes programmatiquement
3. **Option C:** Déployer un nouveau tunnel sans configuration distante (token method vs config method)

## 🎯 Actions Recommandées (PRIORITÉ)

### 1. **URGENT:** Mettre à Jour la Configuration Distante Cloudflare
- Se connecter au portail Cloudflare (https://dash.cloudflare.com)
- Naviguer à: Zero Trust → Access → Tunnels → EGS Tunnel (ID: `6362075c-cd4b-4efb-85ca-f1e888d1363d`)
- Cliquer sur "Edit" ou "Public Hostnames"
- Modifier les routes pour utiliser les bons ports:
  - `gnambaservices.ci` → `http://127.0.0.1:80` (ou IP serveur:80)
  - `www.gnambaservices.ci` → `http://127.0.0.1:80`
  - `portal.gnambaservices.ci` → `http://127.0.0.1:80`
  - `immobilier.gnambaservices.ci` → `http://127.0.0.1:80`
  - `foncier.gnambaservices.ci` → `http://127.0.0.1:80`
  - `fichiers.gnambaservices.ci` → `http://127.0.0.1:8081`
  - `somagro.gnambaservices.ci` → `http://127.0.0.1:8082`

### 2. Vérifier après Update
Après mise à jour dans Cloudflare, redémarrer le tunnel:
```bash
sudo systemctl restart cloudflared
sleep 5
curl -I https://www.gnambaservices.ci  # Devrait retourner HTTP 200
curl -I https://fichiers.gnambaservices.ci  # Devrait retourner HTTP 200 (filebrowser)
```

### 3. Alternative: Automatiser avec API Cloudflare
Si l'accès au portail n'est pas possible, utiliser l'API de gestion:
- Récupérer le token d'API Cloudflare
- Utiliser `cloudflared tunnel route` ou API REST pour mettre à jour les routes

### 4. Documentation
- Mettre à jour `/home/soma/gnamba-project/DEPLOYMENT_GUIDE.md` avec les nouveaux ports
- Documenter la procédure de gestion des routes Cloudflare

## 📝 Fichiers Modifiés

1. `/etc/systemd/system/cloudflared.service` - Changé de token-based à config-based
2. `/home/soma/.cloudflared/config.yml` - Ajouté tous les subdomains et les bons ports
3. `/memories/repo/cloudflare_analysis.md` - Documentation de l'analyse

## 🔧 Commandes Utiles pour Déboguer

```bash
# Voir l'état du service
sudo systemctl status cloudflared

# Voir les logs en temps réel
sudo journalctl -u cloudflared -f

# Voir les logs filtrés (configuration)
sudo journalctl -u cloudflared | grep -i "updated to new configuration"

# Tester les domaines
curl -v https://gnambaservices.ci
curl -v https://www.gnambaservices.ci
curl -v https://fichiers.gnambaservices.ci
curl -v https://somagro.gnambaservices.ci

# Vérifier la configuration du tunnel
cloudflared tunnel info 6362075c-cd4b-4efb-85ca-f1e888d1363d
```

## 📌 Notes Techniques

- **Tunnel ID:** `6362075c-cd4b-4efb-85ca-f1e888d1363d`
- **Credential File:** `/home/soma/.cloudflared/6362075c-cd4b-4efb-85ca-f1e888d1363d.json`
- **Config File:** `/home/soma/.cloudflared/config.yml`
- **Logs:** `/home/soma/logs/cloudflared.log`
- **Connexions Établies:** 4 (2 x FCO01, 2 x ABJ01)
- **Protocole:** QUIC avec fallback HTTP/2

---

**Prochaine étape:** Accéder au portail Cloudflare et mettre à jour les routes!
