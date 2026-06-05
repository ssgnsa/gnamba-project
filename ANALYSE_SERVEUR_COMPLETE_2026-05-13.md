# ANALYSE APPROFONDIE DU SERVEUR G-NAMBA
**Date**: 2026-05-13  
**Objectif**: Enquête minutieuse pour identifier dysfonctionnements, manques, mauvaises configurations, incohérences et sources de bugs

---

## 📊 RÉSUMÉ EXÉCUTIF

### Points Critiques Identifiés
- **Supabase Local**: Ne démarre pas (timeout TLS handshake)
- **Accumulation d'images Docker**: 40+ images non utilisées (~15GB)
- **Configuration .env**: 9 fichiers .env avec credentials exposés
- **Duplication de migrations**: `supabase/` vs `supabase-migrations/`
- **Synchronisation incomplète**: Scripts existants mais non automatisés

### Architecture Actuelle
```
┌─────────────────────────────────────────────────────────┐
│ CONTENEURS DOCKER RUNNING (4)                            │
├─────────────────────────────────────────────────────────┤
│ egs-frontend    :8080→80  (React/Vite)                  │
│ egs-web        :80→80    (Frontend serveur)             │
│ filebrowser    :8081→80  (Gestion fichiers)            │
│ somagro-web    :8082→3000 (ERP séparé)                  │
└─────────────────────────────────────────────────────────┘
```

---

## 🐛 1. DYSFONCTIONNEMENTS CRITIQUES

### 1.1 Supabase Local - Timeout TLS
**Statut**: ❌ Ne fonctionne pas  
**Erreur**: `TLS handshake timeout` lors de `supabase start`  
**Impact**: Développement local impossible sans DB locale

**Racine Probable**:
- Problème réseau local (firewall, DNS)
- Image Supabase Studio corrompue ou incompatible
- Conflit de ports ou ressources insuffisantes

**Solution Immédiate**:
```bash
# Nettoyer les images Supabase
docker rmi $(docker images | grep "supabase/studio" | awk '{print $3}')

# Réinitialiser Supabase
supabase stop
rm -rf supabase/.temp
supabase start
```

---

### 1.2 Conteneur egs-web - Configuration Incohérente
**Statut**: ⚠️ Running mais mal configuré  
**Problème**: Utilise `.env.server` (mode cloud) mais devrait être en mode local pour développement

**Analyse**:
- `docker-compose.server.yml` définit `WEB_PORT=80` mais le conteneur écoute sur le port du système
- Le conteneur `egs-web` est une copie de `egs-frontend` sans différenciation claire

**Recommandation**:
- Fusionner `docker-compose.yml` et `docker-compose.server.yml`
- Utiliser des variables d'environnement pour distinguer local/server/cloud

---

## 📁 2. PROBLÈMES DE CONFIGURATION

### 2.1 Fichiers .env Multiples (9 fichiers)
**Fichiers trouvés**:
```
.env                    (mode local)
.env.demo               (démo)
.env.example            (template)
.env.filebrowser        (filebrowser)
.env.local.example      (template local)
.env.server             (mode cloud - CRITICAL)
.env.server.example     (template server)
.env.staging.example    (template staging)
.env.template           (template générique)
```

**Problèmes**:
- **Credentials exposés**: `.env.server` contient:
  - `TWILIO_AUTH_TOKEN`, `TWILIO_ACCOUNT_SID`
  - `SUPABASE_SERVICE_ROLE_KEY` (clé admin)
  - `SUPABASE_DB_PASSWORD`
- **Confusion**: Difficile de savoir quel fichier est utilisé
- **Redondance**: Plusieurs templates similaires

**Risque de Sécurité**: ⚠️ ÉLEVÉ  
**Solution**:
1. Retirer `.env.server` du git (déjà dans .gitignore)
2. Utiliser `direnv` ou `dotenv` pour charger automatiquement
3. Créer un seul `.env.example` avec toutes les variables

### 2.2 Configuration Supabase Incohérente
**Fichier**: `supabase/config.toml`
```toml
[db]
major_version = 17  # ⚠️ Version incompatible avec cloud (15)
```

**Problème**: La version locale PostgreSQL 17 est incompatible avec le cloud qui utilise PostgreSQL 15

**Impact**: Les migrations peuvent échouer lors de la synchronisation

---

## 🔄 3. DUPLICATIONS ET INCOHÉRENCES

### 3.1 Dossiers de Migrations Dupliqués
**Structure**:
```
supabase/
  └── migrations/ (45 migrations - EGS)
supabase-migrations/
  ├── egs/ (8 migrations - LEGACY)
  └── somagro/ (2 migrations - SomAgro)
somagro-erp/
  └── supabase/
      └── migrations/ (migrations SomAgro)
```

**Problème**:
- `supabase-migrations/` est marqué comme LEGACY mais contient encore des fichiers
- SomAgro a ses propres migrations dans `somagro-erp/supabase/migrations/`
- Risque de confusion sur quelles migrations appliquer

**Recommandation**:
- Archiver définitivement `supabase-migrations/` dans `_archive/`
- Documenter clairement que SomAgro utilise son propre dossier

### 3.2 Fichiers Docker-Compose Multiples (6 fichiers)
**Fichiers trouvés**:
```
docker-compose.yml              (EGS frontend local)
docker-compose.server.yml       (EGS frontend serveur)
docker-compose.prod.yml         (Production complète avec Kong/Postgres)
docker-compose.filebrowser.yml  (Filebrowser avec configuration)
docker-compose.filebrowser.simple.yml (Filebrowser simple)
docker-compose.somagro.server.yml (SomAgro serveur)
```

**Problème**:
- `docker-compose.prod.yml` inclut Kong et PostgreSQL mais n'est jamais utilisé
- `docker-compose.server.yml` et `docker-compose.yml` sont très similaires
- Pas de documentation sur quand utiliser quel fichier

**Recommandation**:
- Fusionner `docker-compose.yml` et `docker-compose.server.yml` avec des profils
- Archiver `docker-compose.prod.yml` s'il n'est pas utilisé
- Documenter l'utilisation de chaque fichier

---

## 🗑️ 4. ÉLÉMENTS INACTIFS/INUTILES

### 4.1 Images Docker Non Utilisées
**Analyse**: 40+ images accumulées (~15GB)

**Images à supprimer**:
```bash
# Images Supabase multiples versions
public.ecr.aws/supabase/studio:2026.01.27-sha-2a37755
public.ecr.aws/supabase/studio:2026.03.23-sha-b7847b7
public.ecr.aws/supabase/storage-api:v1.44.11
public.ecr.aws/supabase/storage-api:v1.48.20
public.ecr.aws/supabase/storage-api:v1.54.0
public.ecr.aws/supabase/edge-runtime:v1.70.0
public.ecr.aws/supabase/edge-runtime:v1.71.0
public.ecr.aws/supabase/edge-runtime:v1.73.0

# Images PostgreSQL multiples versions
postgres:15
postgres:15-alpine
postgres:16
postgres:17 (⚠️ incompatible)
supabase/postgres:15.1.0.117
public.ecr.aws/supabase/postgres:17.6.1.063
public.ecr.aws/supabase/postgres:17.6.1.095

# Images test/legacy
attestation-droit-coutumier-villageois-api:latest
patrickhulce/lhci-client:0.13.0
kong:2.8.1
traefik/whoami:latest
```

**Commande de nettoyage**:
```bash
docker image prune -a
docker rmi $(docker images --filter "dangling=true" -q)
```

### 4.2 Scripts Inutilisés ou Obsolètes
**55 scripts dans `scripts/`** - Analyse nécessaire

**Scripts potentiellement inutiles**:
- `smb-diagnostic.sh` (diagnostic SMB - utilisé?)
- `decommission_legacy_stack.sh` (legacy déjà décommissionné?)
- `fix-filebrowser-permissions.sh` (one-time fix)
- `reactivate-migrations.sh` (emergency script)

### 4.3 Dossiers d'Archive et Backups
**Dossiers trouvés**:
```
_archive/ (contient des anciens scripts et docs)
backups/ (134 items - accumulation de backups)
dist/ (build artifact)
dist-local/ (build artifact)
dist_old/ (build artifact)
```

**Problème**:
- Accumulation de backups sans politique de rétention
- Dossiers `dist*` ne devraient pas être commités

---

## 🔗 5. SYNCHRONISATION LOCAL ↔ CLOUD

### 5.1 Mécanisme Actuel
**Script**: `scripts/sync-workflow.sh`

**Environnements définis**:
```bash
local-dev    = http://localhost:8080/login
local-server = http://192.168.1.58/login
cloud-prod   = https://gnambaservices.ci/
```

**Flux de synchronisation supportés**:
- `local-dev → local-server` (build + déploiement)
- `local-dev → cloud-prod` (build + dump DB + restore + déploiement)
- `local-server → cloud-prod` (build + déploiement)
- `cloud-prod → local-dev` (dump DB + restore)
- `cloud-prod → local-server` (redéploiement)

### 5.2 Problèmes Identifiés

**Problème 1**: Synchronisation non automatisée
- Les scripts existent mais ne sont pas exécutés automatiquement
- Pas de CI/CD configuré

**Problème 2**: Version PostgreSQL incompatible
- Local: PostgreSQL 17
- Cloud: PostgreSQL 15
- Risque d'échec des dumps/restores

**Problème 3**: Déploiement cloud manuel
```bash
# Dans sync-workflow.sh ligne 540
log_warn "Déploiement cloud manuel requis"
log_info "Fichiers buildés dans: $ROOT_DIR/dist/"
log_info "Déployez manuellement vers gnambaservices.ci"
```

**Problème 4**: Configuration de déploiement incomplète
```bash
# .sync-config devrait contenir:
cloud-prod:deploy_method=rsync|ftp|manual
cloud-prod:deploy_host=
cloud-prod:deploy_path=
cloud-prod:deploy_user=
```

### 5.3 Recommandations

**Immédiat**:
1. Corriger la version PostgreSQL dans `supabase/config.toml`:
   ```toml
   [db]
   major_version = 15  # Aligner avec cloud
   ```

2. Configurer le déploiement automatique:
   - Ajouter les credentials SSH/FTP dans `.sync-config`
   - Ou configurer GitHub Actions pour déploiement automatique

3. Créer un cron job pour synchronisation automatique:
   ```bash
   # Tous les soirs à 2h du matin
   0 2 * * * cd /home/soma/gnamba-project && ./scripts/sync-workflow.sh sync local-dev cloud-prod
   ```

---

## 🚨 6. SOURCES DE BUGS POTENTIELS

### 6.1 Conflit de Ports
**Observation**:
- `egs-frontend` :8080→80
- `egs-web` :80→80 (potentiellement en conflit si non isolé)
- `filebrowser` :8081→80
- `somagro-web` :8082→3000

**Risque**: Si `egs-web` est démarré sur la même machine que `egs-frontend`, conflit sur le port 80

### 6.2 Cross-Origin et CSP
**Statut**: ✅ Corrigé récemment  
**Historique**: Problèmes CSP bloquant Cloudflare Insights et eval()

**État actuel**:
- `nginx.conf` mis à jour avec CSP correcte
- Headers envoyés correctement
- `crossOrigin="anonymous"` ajouté aux images

### 6.3 Incohérence de Mode Supabase
**Fichier .env**:
```bash
VITE_SUPABASE_MODE=local
VITE_SUPABASE_LOCAL_URL=http://localhost:54321
```

**Fichier .env.server**:
```bash
VITE_SUPABASE_MODE=cloud
VITE_SUPABASE_URL=https://thykrnoqgylrbfupophs.supabase.co
```

**Problème**: Le conteneur `egs-web` (serveur local) utilise `.env.server` (mode cloud) mais devrait peut-être utiliser une DB locale pour éviter la latence

### 6.4 Scripts de Backup Incomplets
**Script**: `scripts/egs-supabase-backup.sh`

**Problème**: Le script existe mais il n'est pas clair s'il est exécuté automatiquement (cron)

**Vérification nécessaire**:
```bash
crontab -l | grep backup
```

---

## 📋 7. PROJET SOMAGRO-ERP (SÉPARÉ)

### 7.1 Statut
**Conteneur**: `somagro-web` running sur :8082→3000  
**Technologie**: Next.js + TypeScript + Tailwind  
**Base de données**: Supabase séparée

### 7.2 Problèmes Identifiés
1. **Migrations séparées**: `somagro-erp/supabase/migrations/` indépendantes d'EGS
2. **Conteneur séparé**: Pas intégré dans `docker-compose.yml` principal
3. **Configuration .env séparée**: `somagro-erp/.env.server`

### 7.3 Recommandations
- Intégrer SomAgro dans le workflow de synchronisation principal
- Partager les scripts de backup entre EGS et SomAgro
- Documenter clairement les différences entre les deux projets

---

## 🎯 8. MODULE LEADS & CAMPAGNES (PROPOSÉ)

**Note**: Ce module est une **proposition** et n'existe pas actuellement dans le codebase.

**Analyse de la proposition**:
- Module complet de CRM/marketing multi-canal
- Intégration avec WhatsApp, SMS, Email, Facebook
- Pipeline Kanban pour gestion des leads
- Synchronisation avec autres modules (Facturation, Stock, SAV)

**Observations**:
- Architecture bien pensée avec BullMQ pour file d'attente
- Conformité RGPD intégrée
- Intégration via webhooks/API

**Recommandations pour implémentation**:
1. Créer un nouveau module séparé `leads-campagnes/`
2. Utiliser la même base Supabase avec des tables dédiées
3. Intégrer avec le système d'authentification existant
4. Suivre les mêmes patterns que EGS (React + TypeScript + Supabase)

---

## ✅ 9. PLAN D'ACTION PRIORITAIRE

### Immédiat (Aujourd'hui)
1. ✅ **Corriger version PostgreSQL**: Modifier `supabase/config.toml` → `major_version = 15`
2. ✅ **Nettoyer images Docker**: Supprimer les images inutilisées
3. ✅ **Sécuriser credentials**: Vérifier que `.env.server` n'est pas exposé
4. ✅ **Tester Supabase local**: Réinitialiser et redémarrer

### Court Terme (Cette semaine)
1. **Fusionner docker-compose**: Créer un fichier unique avec profils
2. **Nettoyer .env**: Réduire à 3 fichiers max (local, server, example)
3. **Archiver legacy**: Déplacer `supabase-migrations/` vers `_archive/`
4. **Configurer déploiement**: Compléter `.sync-config` pour déploiement automatique

### Moyen Terme (Ce mois)
1. **Automatiser synchronisation**: Configurer cron jobs ou GitHub Actions
2. **Politique de rétention backups**: Nettoyer vieux backups
3. **Intégrer SomAgro**: Unifier les workflows
4. **Documentation**: Créer un guide d'architecture complet

---

## 📊 10. MÉTRIQUES D'ÉTAT ACTUEL

| Métrique | Valeur | État |
|----------|--------|------|
| Conteneurs Running | 4 | ✅ OK |
| Images Docker | 40+ | ⚠️ Accumulation |
| Fichiers .env | 9 | ⚠️ Trop |
| Scripts | 55 | ⚠️ Besoin audit |
| Migrations EGS | 45 | ✅ OK |
| Migrations SomAgro | ? | ⚠️ À vérifier |
| Supabase Local | ❌ Down | 🚨 Critique |
| Synchronisation Auto | ❌ Non | ⚠️ Manuel |
| Espace disque utilisé | ~15GB (images) | ⚠️ Nettoyage |

---

## 🔐 11. SÉCURITÉ

### Credentials Exposés
**Fichiers à vérifier**:
- `.env.server` (contient Twilio et Supabase admin keys)
- `.sync-config` (peut contenir des credentials de déploiement)

**Action**:
```bash
# Vérifier si ces fichiers sont dans git
git ls-files | grep -E "\.env|\.sync-config"

# S'ils sont dans git, les retirer immédiatement
git rm --cached .env.server
git rm --cached .sync-config
echo ".env.server" >> .gitignore
echo ".sync-config" >> .gitignore
```

---

## 📝 CONCLUSION

L'analyse révèle une infrastructure fonctionnelle mais avec plusieurs problèmes de maintenance et de configuration:

**Points Positifs**:
- Architecture Docker bien structurée
- Scripts de synchronisation existants
- Séparation claire entre EGS et SomAgro
- CSP récemment corrigée

**Points Négatifs**:
- Supabase local non fonctionnel
- Accumulation d'images et fichiers
- Configuration dispersée (9 fichiers .env)
- Synchronisation manuelle
- Version PostgreSQL incompatible

**Priorité Absolue**: Corriger Supabase local pour permettre le développement offline.

---

**Rapport généré automatiquement le 2026-05-13**
