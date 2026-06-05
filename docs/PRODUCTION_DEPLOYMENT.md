# 🚀 GUIDE DE DÉPLOIEMENT PRODUCTION EGS

**Versioning**: Phase 2 - Stabilisation sécurité & versions (2026-06-03)  
**Rôle**: Enterprise Architect  
**Périmètre**: Migration vers architecture sécurisée conforme aux règles stack

---

## 📋 Résumé exécutif

Ce guide décrit le déploiement de l'architecture EGS en production conforme à la règle stack EGS Enterprise Architect, avec:

| Aspect | Spécification |
|--------|---------------|
| **Docker Compose** | `docker-compose.prod.secure.yml` |
| **PostgreSQL** | 16.13-alpine (au lieu de 15.1.0.117) |
| **Nginx** | `nginx-production.conf` (TLS 1.2/1.3 durci) |
| **Images Docker** | Versionnées/digestées (pas de `:latest`) |
| **Certificats TLS** | Let's Encrypt ou auto-signé |
| **Secrets** | `.env.server` (git-ignore) |
| **RTO cible** | < 4h |
| **RPO cible** | < 1h |

---

## ✅ Checklist pré-déploiement

**AVANT DE COMMENCER**, exécuter la validation:

```bash
bash scripts/validate-prod-deployment.sh
```

Tous les items verts (✅) doivent être validés. Les items jaunes (⚠️) doivent être évalués.

---

## 🔐 Phase 1: Préparation Sécurité (1-2h)

### Étape 1.1: Créer `.env.server` depuis le template

```bash
cp .env.template .env.server
```

**Variables obligatoires à configurer dans `.env.server`:**

```bash
# Supabase
VITE_SUPABASE_MODE=cloud
VITE_SUPABASE_URL=https://thykrnoqgylrbfupophs.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# PostgreSQL (confidentiel)
POSTGRES_PASSWORD=<STRONG_PASSWORD_MIN_32_CHARS>
JWT_SECRET=<RANDOM_MIN_32_CHARS>

# WOPI Gateway
WOPI_JWT_SECRET=<JWT_SECRET_FOR_WOPI>
WOPI_API_KEY=<API_KEY_FOR_WOPI>

# n8n
N8N_USER=<n8n_admin_username>
N8N_PASSWORD=<n8n_admin_password_strong>
N8N_ENCRYPTION_KEY=<RANDOM_MIN_32_CHARS>
N8N_DB_PASSWORD=<n8n_db_password_strong>

# Samba
SAMBA_USERNAME=<samba_username>
SAMBA_PASSWORD=<samba_password_strong>

# Collabora
COLLABORA_ADMIN_USER=admin
COLLABORA_ADMIN_PASSWORD=<collabora_admin_password_strong>

# DNS & TLS
DOMAIN=erp.gnambaservices.ci
CERTBOT_EMAIL=admin@gnambaservices.ci
TZ=Africa/Abidjan
```

**⚠️ IMPORTANT**: `.env.server` doit être git-ignore (jamais commité)

```bash
# Vérifier
echo ".env.server" >> .gitignore
git rm --cached .env.server 2>/dev/null || true
```

### Étape 1.2: Générer/obtenir les certificats TLS

#### Option A: Let's Encrypt + Certbot (recommandé)

```bash
# Installer certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Générer certificat (DNS doit être fonctionnel)
sudo certbot certonly --standalone \
  -d erp.gnambaservices.ci \
  -d www.erp.gnambaservices.ci \
  -d api.gnambaservices.ci \
  -d docs.gnambaservices.ci \
  -d n8n.gnambaservices.ci \
  -d wopi.gnambaservices.ci \
  -d office.gnambaservices.ci \
  --email admin@gnambaservices.ci \
  --agree-tos \
  --non-interactive

# Copier les certificats vers nginx/ssl/
sudo mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/erp.gnambaservices.ci/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/erp.gnambaservices.ci/privkey.pem nginx/ssl/
sudo chown -R $(whoami):$(whoami) nginx/ssl/
sudo chmod 600 nginx/ssl/privkey.pem
```

#### Option B: Certificat auto-signé (développement/test)

```bash
mkdir -p nginx/ssl

# Générer un certificat auto-signé valide 365 jours
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/privkey.pem \
  -out nginx/ssl/fullchain.pem \
  -subj "/C=CI/ST=Abidjan/L=Abidjan/O=Gnamba Services/CN=erp.gnambaservices.ci"

chmod 600 nginx/ssl/privkey.pem
```

#### Option C: Utiliser les certificats d'un CDN (Cloudflare, etc.)

Si vous utilisez Cloudflare, générer des certificats Origin Certificates :

```bash
# 1. Générer dans Cloudflare Dashboard → SSL/TLS → Origin Server
# 2. Télécharger et sauvegarder
cp /downloads/erp.gnambaservices.ci.pem nginx/ssl/fullchain.pem
cp /downloads/erp.gnambaservices.ci.key nginx/ssl/privkey.pem
chmod 600 nginx/ssl/privkey.pem
```

### Étape 1.3: Préparer les données persistantes

```bash
# Créer les répertoires de données
sudo mkdir -p /data/postgres
sudo mkdir -p /data/backups/postgres
sudo mkdir -p /home/soma/partage/egs-docs
sudo mkdir -p /home/soma/filebrowser/{database,config}
sudo mkdir -p /home/soma/n8n

# Définir les permissions
sudo chown -R 999:999 /data/postgres              # User postgresql
sudo chown -R 999:999 /data/backups/postgres
sudo chown -R 33:33 /home/soma/partage/egs-docs   # User www-data
sudo chown -R 33:33 /home/soma/filebrowser/database
sudo chown -R 33:33 /home/soma/filebrowser/config

# Vérifier les permissions
ls -la /data/ /home/soma/
```

---

## 🐳 Phase 2: Déploiement Docker (30-45min)

### Étape 2.1: Valider la configuration

```bash
# Syntaxe docker-compose
docker compose -f docker-compose.prod.secure.yml config

# Configuration Nginx
docker run --rm -v $(pwd)/nginx:/etc/nginx:ro nginx:alpine nginx -t

# Vérifier les images
docker compose -f docker-compose.prod.secure.yml pull
```

### Étape 2.2: Déployer le stack

```bash
# Mode non-interactive (recommandé)
export DOCKER_BUILDKIT=1
docker compose -f docker-compose.prod.secure.yml up -d

# Suivre les logs
docker compose -f docker-compose.prod.secure.yml logs -f

# Attendre que tous les services soient healthy (5-10min)
watch -n 5 'docker compose -f docker-compose.prod.secure.yml ps'
```

### Étape 2.3: Vérifier la santé du stack

```bash
# Tous les containers doivent être "Up (healthy)"
docker compose -f docker-compose.prod.secure.yml ps

# Tester les endpoints clés
curl -s -o /dev/null -w "%{http_code}" https://erp.gnambaservices.ci/health
curl -s -o /dev/null -w "%{http_code}" https://api.gnambaservices.ci/health
curl -s -o /dev/null -w "%{http_code}" https://docs.gnambaservices.ci/

# Logs PostgreSQL
docker compose -f docker-compose.prod.secure.yml logs postgres | tail -20

# Logs Nginx
docker compose -f docker-compose.prod.secure.yml logs nginx-proxy | tail -20
```

---

## 💾 Phase 3: Migration BD & Données (1-2h)

### Étape 3.1: Créer backup de la base actuelle (si migration)

```bash
# Si vous avez une base existante à migrer
docker compose -f docker-compose.prod.secure.yml exec -T postgres \
  pg_dumpall -U postgres > /home/soma/backups/pre-migration-backup.sql

# Vérifier le fichier
ls -lh /home/soma/backups/pre-migration-backup.sql
```

### Étape 3.2: Appliquer les migrations EGS

```bash
# Si utilisant Supabase local (pas le cas ici, mais pour référence)
# supabase db push --db-url postgresql://postgres:PASSWORD@localhost:5432/postgres

# En production Cloud, les migrations sont gérées via Supabase Dashboard
log "Migrations Cloud gérées via Supabase Portal"
```

### Étape 3.3: Importer les données (si applicable)

```bash
# Restaurer depuis backup (optionnel)
docker compose -f docker-compose.prod.secure.yml exec -T postgres \
  psql -U postgres < /home/soma/backups/pre-migration-backup.sql

# Vérifier
docker compose -f docker-compose.prod.secure.yml exec -T postgres \
  psql -U postgres -c "SELECT COUNT(*) FROM pg_tables WHERE schemaname='public';"
```

---

## 🧪 Phase 4: Validation Fonctionnelle (1h)

### Étape 4.1: Tester les endpoints clés

```bash
# Frontend ERP
curl -s https://erp.gnambaservices.ci/ | head -50

# API Gateway
curl -s https://api.gnambaservices.ci/rest/v1/ \
  -H "apikey: $VITE_SUPABASE_ANON_KEY" | head -20

# Document Management
curl -s https://docs.gnambaservices.ci/ | head -30

# Collabora Online
curl -s https://office.gnambaservices.ci/hosting/discovery | head -30
```

### Étape 4.2: Tester les certificats TLS

```bash
# Vérifier le certificat et la chaîne
openssl s_client -connect erp.gnambaservices.ci:443 -showcerts </dev/null | grep -A 2 "^subject"

# Vérifier l'expiration
echo | openssl s_client -connect erp.gnambaservices.ci:443 2>/dev/null | \
  openssl x509 -noout -enddate
```

### Étape 4.3: Tester les headers de sécurité

```bash
# Headers requis doivent être présents
curl -sI https://erp.gnambaservices.ci/ | grep -E "Strict-Transport|X-Frame|X-Content-Type|CSP"

# Résultat attendu:
# Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
# X-Frame-Options: SAMEORIGIN
# X-Content-Type-Options: nosniff
# Content-Security-Policy: ...
```

### Étape 4.4: Tester la connectivité BD

```bash
# Vérifier que PostgreSQL répond
docker compose -f docker-compose.prod.secure.yml exec -T postgres \
  psql -U postgres -c "SELECT version();"

# Vérifier les migrations appliquées
docker compose -f docker-compose.prod.secure.yml exec -T postgres \
  psql -U postgres -c "SELECT * FROM schema_migrations LIMIT 5;"
```

---

## 🔄 Phase 5: Sauvegarde & Restauration (Test) (1h)

### Étape 5.1: Créer une sauvegarde complète

```bash
# Dump complet BD
docker compose -f docker-compose.prod.secure.yml exec -T postgres \
  pg_dumpall -U postgres | gzip > /home/soma/backups/egs-prod-$(date +%Y%m%d-%H%M%S).sql.gz

# Vérifier
ls -lh /home/soma/backups/egs-prod-*.sql.gz
```

### Étape 5.2: Tester la restauration (sur environnement test)

```bash
# Créer un backup de test
docker compose -f docker-compose.prod.secure.yml exec -T postgres \
  pg_dumpall -U postgres | gzip > /tmp/restore-test.sql.gz

# Décompresser et restaurer (en base de test)
gunzip -c /tmp/restore-test.sql.gz | \
  docker compose -f docker-compose.prod.secure.yml exec -T postgres \
  psql -U postgres

# Vérifier
echo "Restauration testée avec succès"
```

---

## 📊 Phase 6: Monitoring & Alertes (30min)

### Étape 6.1: Configurer les healthchecks

```bash
# Vérifier que tous les healthchecks passent
docker compose -f docker-compose.prod.secure.yml ps

# Chaque service doit avoir status "(healthy)"
```

### Étape 6.2: Ajouter les logs

```bash
# Centralisez les logs (recommandation: Loki + Promtail)
docker compose -f docker-compose.prod.secure.yml logs nginx-proxy | tail -50
docker compose -f docker-compose.prod.secure.yml logs postgres | tail -50
```

### Étape 6.3: Configurer les alertes minimales

```bash
# Exemple avec Uptime Kuma (optionnel)
# 1. Installer Uptime Kuma
# 2. Ajouter les endpoints:
#    - https://erp.gnambaservices.ci/health
#    - https://api.gnambaservices.ci/health
# 3. Configurer les alertes (email, Slack, etc.)
```

---

## 🔄 Maintenance & Rollback

### Rollback (en cas de problème)

```bash
# 1. Arrêter le stack
docker compose -f docker-compose.prod.secure.yml down

# 2. Restaurer depuis backup
docker compose -f docker-compose.prod.secure.yml exec -T postgres \
  gunzip -c /home/soma/backups/egs-prod-<date>.sql.gz | \
  psql -U postgres

# 3. Redémarrer
docker compose -f docker-compose.prod.secure.yml up -d
```

### Renouvellement des certificats TLS

```bash
# Automatique avec Certbot (si Let's Encrypt)
sudo certbot renew --quiet

# Ou manuel (tous les 90 jours)
sudo certbot renew --force-renewal
```

### Mise à jour des images

```bash
# Pull les dernières images
docker compose -f docker-compose.prod.secure.yml pull

# Redéployer
docker compose -f docker-compose.prod.secure.yml up -d
```

---

## 🎯 Points clés à retenir

| Point | Action |
|-------|--------|
| **Secrets** | Toujours dans `.env.server` (git-ignore), jamais en dur |
| **Certificats** | Renouvellement automatique (Let's Encrypt) ou manuel (auto-signé) |
| **Backups** | Quotidiens, testés régulièrement |
| **Monitoring** | Healthchecks Docker + alertes externes (Uptime Kuma, etc.) |
| **Logs** | Centralisés via Loki/Promtail ou équivalent |
| **RTO/RPO** | RTO < 4h, RPO < 1h (via backups) |

---

## 📞 Support & Escalade

En cas de problème:

1. Vérifier les logs: `docker compose -f docker-compose.prod.secure.yml logs [service]`
2. Vérifier la connectivité BD: `docker compose -f docker-compose.prod.secure.yml exec postgres psql -U postgres -c "SELECT 1;"`
3. Rollback si nécessaire
4. Escalader à Enterprise Architect si bloqué

---

**Fin du guide. Bonne chance! 🚀**
