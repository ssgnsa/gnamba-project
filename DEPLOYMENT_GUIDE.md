# 🚀 Guide de Déploiement EGS - Production

Ce guide explique comment déployer EGS en production avec :
- ✅ Filebrowser séparé (sans dépendance Nginx)
- ✅ HTTPS avec Let's Encrypt
- ✅ Variables d'environnement au runtime (pas dans le build)
- ✅ Backups automatiques Supabase
- ✅ Gestion des erreurs 401/404

---

## 📋 Table des Matières

1. [Architecture](#architecture)
2. [Fichiers Créés](#fichiers-créés)
3. [Déploiement Rapide](#déploiement-rapide)
4. [Configuration HTTPS](#configuration-https)
5. [Backups Automatiques](#backups-automatiques)
6. [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         INTERNET                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Traefik (Reverse Proxy)                                    │
│  ├─ Let's Encrypt SSL (HTTPS)                              │
│  ├─ HTTP → HTTPS redirection                               │
│  └─ Routing vers services                                   │
│      ├─ gnambaservices.ci → egs-web:80                     │
│      ├─ files.gnambaservices.ci → filebrowser:80         │
│      └─ traefik.gnambaservices.ci → Dashboard            │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
          ▼                  ▼                  ▼
   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
   │  EGS Web    │   │ Filebrowser │   │   Backup    │
   │  (Runtime)  │   │ (Standalone)│   │   Script    │
   └─────────────┘   └─────────────┘   └─────────────┘
          │                  │
          │                  │
          └──────────────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │   Supabase Cloud    │
        │  thykrnoqgylrbf...  │
        └─────────────────────┘
```

---

## 📁 Fichiers Créés

### Core Files
| Fichier | Description |
|---------|-------------|
| `Dockerfile.runtime` | Build sans secrets, runtime env vars |
| `docker-entrypoint.sh` | Substitution variables au démarrage |
| `nginx-standalone.conf` | Nginx sans filebrowser upstream |
| `startup.sh` | Script de démarrage complet |

### Docker Compose
| Fichier | Description |
|---------|-------------|
| `docker-compose.https.yml` | Production avec HTTPS/Let's Encrypt |
| `docker-compose.prod.yml` | Alternative simplifiée |

### Scripts
| Fichier | Description |
|---------|-------------|
| `scripts/backup-supabase.sh` | Backup automatique des données |
| `scripts/diagnose-and-fix.sh` | Diagnostic et correction automatique |

### Code
| Fichier | Description |
|---------|-------------|
| `src/lib/logoUtils.ts` | Gestion erreurs 401/404 avec fallback SVG |

---

## 🚀 Déploiement Rapide

Le chemin officiel de publication est:

```bash
bash scripts/deploy-production.sh
```

Ce script:

- installe les dépendances avec `npm ci`;
- construit `dist/` avec `npm run build`;
- génère `dist/VERSION.json`;
- valide la release avec `npm run release:check`;
- publie vers `/var/www/egs/current`;
- recharge Nginx si le service est disponible.

---

## 🔐 Configuration HTTPS

### Prérequis
1. Domaine `gnambaservices.ci` pointant vers votre serveur
2. Ports 80 et 443 ouverts dans le firewall
3. Docker et docker-compose installés

### Étapes

```bash
# 1. Créer le dossier letsencrypt
mkdir -p /home/soma/gnamba-project/letsencrypt

# 2. Lancer Traefik + services
cd /home/soma/gnamba-project
docker-compose -f docker-compose.https.yml up -d

# 3. Vérifier les certificats (peut prendre 1-2 min)
docker logs -f traefik

# 4. Test HTTPS
curl -I https://gnambaservices.ci
```

### Structure Let's Encrypt
```
letsencrypt/
└── acme.json          # Certificats SSL (ne pas modifier)
```

---

## 💾 Backups Automatiques

### Configuration

```bash
# 1. Créer le dossier de backup
mkdir -p /home/soma/backups

# 2. Définir la clé service role
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIs..."

# 3. Lancer le backup
./scripts/backup-supabase.sh
```

### Automatisation (Cron)

```bash
# Éditer crontab
crontab -e

# Ajouter ligne pour backup quotidien à 2h du matin
0 2 * * * cd /home/soma/gnamba-project && SUPABASE_SERVICE_ROLE_KEY="votre_clé" ./scripts/backup-supabase.sh >> /var/log/egs-backup.log 2>&1
```

### Structure des Backups
```
/home/soma/backups/
├── supabase_backup_20250115_020000.json.gz
├── supabase_backup_20250116_020000.json.gz
└── backup.log
```

---

## 🛠️ Troubleshooting

### Erreur: EGS ne démarre pas (upstream filebrowser)

**Cause**: L'ancienne image nginx attendait filebrowser.

**Solution**:
```bash
# Rebuild avec la nouvelle configuration
docker build -t egs-web:runtime -f Dockerfile.runtime .
docker stop egs-web && docker rm egs-web
docker run -d --name egs-web -p 8080:80 egs-web:runtime
```

### Erreur 401 sur Supabase Storage

**Cause**: Token invalide ou fichier inexistant.

**Solution**: Déjà corrigé dans `logoUtils.ts` avec fallback SVG automatique.

### Certificat Let's Encrypt échoue

**Vérifications**:
```bash
# Port 80 accessible ?
curl -I http://gnambaservices.ci

# Domaine pointe vers ce serveur ?
nslookup gnambaservices.ci

# Logs Traefik
docker logs traefik
```

### Filebrowser inaccessible

```bash
# Vérifier conteneur
docker ps | grep filebrowser

# Vérifier logs
docker logs filebrowser

# Redémarrer
docker restart filebrowser
```

---

## 🔧 Commandes Utiles

```bash
# Statut des services
docker ps

# Logs en temps réel
docker logs -f egs-web
docker logs -f filebrowser
docker logs -f traefik

# Redémarrage
docker restart egs-web filebrowser

# Arrêt complet
docker stop egs-web filebrowser traefik
docker rm egs-web filebrowser traefik

# Rebuild complet
docker-compose -f docker-compose.https.yml down
docker-compose -f docker-compose.https.yml up -d --build
```

---

## ✅ Checklist Production

- [ ] Image EGS rebuild avec `Dockerfile.runtime`
- [ ] Filebrowser démarré sur port 8081
- [ ] EGS démarré sur port 8080
- [ ] Variables d'environnement configurées
- [ ] HTTPS fonctionnel (Let's Encrypt)
- [ ] Backups automatiques configurés
- [ ] Logs vérifiés (pas d'erreurs critiques)
- [ ] Test connexion Supabase OK
- [ ] Fallback logos fonctionnel (erreurs 401/404 gérées)

---

**Document version**: 1.0
**Date**: 2025-01-15
